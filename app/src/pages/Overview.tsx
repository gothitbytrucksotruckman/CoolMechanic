import { Link } from 'react-router'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ErrorCard } from '../components/ErrorCard'
import { JudgeNote } from '../components/JudgeNote'
import { StatusChip } from '../components/StatusChip'
import { StatusIcon } from '../components/icons'
import { machineStatus, type StatusKey } from '../data/status'
import { useSourceData } from '../data/useSourceData'
import { fmtDateTime, fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { CONDENSER, EVENT, KIND, faultName } from '../i18n/labels'

const ORDER: StatusKey[] = ['bahaya', 'teknisi', 'waspada', 'aman']

export function Overview() {
  const { t, lang } = useT()
  const { data, error } = useSourceData(async (ds) => {
    const [sites, machines, cases, feed, rules] = await Promise.all([ds.listSites(), ds.listMachines(), ds.listCases(), ds.listCaseEvents(10), ds.listSafetyRules()])
    const now = ds.now()
    const last = await Promise.all(machines.map(async (m) => (await ds.getReadings(m.id, now, now))[0]?.ts_utc))
    return { sites, machines, cases, feed, rules, last }
  }, [])

  if (error) return <ErrorCard error={error} />
  if (!data) return <h1 className="text-2xl font-bold">{t('page.overview')}</h1>

  const rows = data.machines.map((m, i) => ({
    m, site: data.sites.find((s) => s.id === m.site_id)!, last: data.last[i],
    status: machineStatus(data.cases.filter((c) => c.machine_id === m.id)),
  })).sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
  const count = (s: StatusKey) => rows.filter((r) => r.status === s).length
  const caseById = new Map(data.cases.map((c) => [c.id, c]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('page.overview')}</h1>

      <section aria-label={t('overview.counts')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['aman', 'waspada', 'bahaya', 'teknisi'] as const).map((s) => (
          <div key={s} className="rounded-card border border-line bg-surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: `var(--${s}-fg)` }}>
              <StatusIcon status={s} />{t(`status.${s}`)}
            </p>
            <p className="num text-4xl font-bold" data-testid={`count-${s}`}>{count(s)}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title={t('overview.machines')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map(({ m, site, status, last }) => (
              <li key={m.id} data-testid="machine-card">
                <Link to={`/mesin/${m.id}`} className="block h-full rounded-card border border-line p-3 hover:border-accent">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-bold">{m.name}</span>
                    <StatusChip status={status} />
                  </div>
                  <p className="text-sm text-muted">{site.name}</p>
                  <p className="text-sm">{m.brand} {m.model} · {KIND[m.kind][lang]} · ±{m.approx_age_years} {t('overview.years')}</p>
                  <p className="text-sm">{CONDENSER[m.condenser_type][lang]}</p>
                  {last && <p className="num mt-1 text-xs text-muted">{t('overview.last_reading')}: {fmtTime(last, lang)}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3"><JudgeNote d="D1">{t('overview.judge_d1')}</JudgeNote></div>
        </Card>

        <div className="space-y-6">
          <Card title={t('overview.outcomes')}>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-sm text-muted">{t('overview.resolved')}</dt><dd className="num text-3xl font-bold" data-testid="count-resolved">{data.cases.filter((c) => c.state === 'RESOLVED').length}</dd></div>
              <div><dt className="text-sm text-muted">{t('overview.dispatched')}</dt><dd className="num text-3xl font-bold" data-testid="count-dispatched">{data.cases.filter((c) => c.state === 'DISPATCHED').length}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted">{t('overview.since_start')}</p>
          </Card>

          <Card title={t('overview.feed')}>
            {data.feed.length === 0 ? (
              <EmptyState title={t('overview.no_cases')} reason={t('overview.no_cases_reason')} />
            ) : (
              <ol className="space-y-2">
                {data.feed.map((e, i) => {
                  const c = caseById.get(e.case_id)
                  const m = data.machines.find((x) => x.id === c?.machine_id)
                  return (
                    <li key={`${e.case_id}-${i}`} data-testid="feed-item">
                      <Link to={`/kasus/${e.case_id}`} className="block rounded-lg px-2 py-1 hover:bg-bg">
                        <span className="num text-xs text-muted">{fmtDateTime(e.ts_utc, lang)}</span>
                        <span className="block text-sm font-semibold">{EVENT[e.type][lang]}</span>
                        <span className="block text-xs text-muted">{m?.name} · {c && faultName(data.rules.find((r) => r.fault_code === c.fault_code), c.fault_code, lang)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
