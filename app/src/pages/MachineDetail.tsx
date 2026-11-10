import { Link, useParams } from 'react-router'
import { SIGNALS } from '../../../contract/schemas'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ErrorCard } from '../components/ErrorCard'
import { JudgeNote } from '../components/JudgeNote'
import { SensorChart } from '../components/SensorChart'
import { StatusChip } from '../components/StatusChip'
import { machineStatus } from '../data/status'
import { useSourceData } from '../data/useSourceData'
import { fmtDateTime, fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { CONDENSER, KIND, faultName } from '../i18n/labels'

const WINDOW_MIN = 3 * 60

export function MachineDetail() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const { data, error } = useSourceData(async (ds) => {
    const machine = (await ds.listMachines()).find((m) => m.id === id)
    if (!machine) return { machine }
    const now = ds.now()
    const from = new Date(Date.parse(now) - WINDOW_MIN * 60_000).toISOString()
    const [site, readings, bands, cases, rules, alerts] = await Promise.all([
      ds.listSites().then((s) => s.find((x) => x.id === machine.site_id)),
      ds.getReadings(id, from, now), ds.listNormalBands(id), ds.listCases({ machineId: id }), ds.listSafetyRules(),
      ds.listCases({ machineId: id }).then((cs) => Promise.all(cs.map(async (c) => (await ds.getCase(c.id))?.events.find((e) => e.type === 'alert')))),
    ])
    return { machine, site, readings, bands, cases, rules, alerts }
  }, [id])

  if (error) return <ErrorCard error={error} />
  if (!data) return <h1 className="text-2xl font-bold">{t('page.machine')}</h1>
  if (!data.machine) return <EmptyState title={t('machine.not_found')} reason={t('machine.not_found_reason', { id })} />

  const { machine: m, readings = [], bands = [], cases = [], rules = [], alerts = [] } = data
  const latest = readings.at(-1)
  const health = latest ? Object.values(latest.sensor_health) : []
  const okCount = health.filter(Boolean).length
  const markers = alerts.flatMap((a) => (a ? [{ ts_utc: a.ts_utc, label: t('chart.detected'), dashed: true }] : []))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{m.name}</h1>
        <StatusChip status={machineStatus(cases)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Card title={t('machine.profile')}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">{t('machine.brand_model')}</dt><dd className="font-semibold">{m.brand} {m.model}</dd>
              <dt className="text-muted">{t('machine.kind')}</dt><dd>{KIND[m.kind][lang]}</dd>
              <dt className="text-muted">{t('machine.age')}</dt><dd className="num">±{m.approx_age_years} {t('overview.years')}</dd>
              <dt className="text-muted">{t('machine.condenser')}</dt><dd>{CONDENSER[m.condenser_type][lang]}</dd>
              <dt className="text-muted">{t('machine.site')}</dt><dd>{data.site?.name}, {data.site?.area}</dd>
              <dt className="text-muted">{t('machine.installed')}</dt><dd className="num">{fmtDateTime(m.installed_at, lang)}</dd>
            </dl>
            <div className="mt-3"><JudgeNote d="D1">{t('machine.judge_d1')}</JudgeNote></div>
          </Card>

          <Card title={t('machine.health')}>
            <p data-testid="sensor-health" className="num text-lg font-bold" style={{ color: okCount === health.length ? 'var(--aman-fg)' : 'var(--bahaya-fg)' }}>
              {okCount}/{health.length} {t('machine.probes_ok')}
            </p>
            {latest && <p className="num text-xs text-muted">{t('overview.last_reading')}: {fmtTime(latest.ts_utc, lang)}</p>}
          </Card>

          <Card title={t('machine.cases')}>
            {cases.length === 0 ? (
              <EmptyState title={t('overview.no_cases')} reason={t('machine.no_cases_reason')} />
            ) : (
              <ul className="space-y-2">
                {[...cases].reverse().map((c) => (
                  <li key={c.id} data-testid="case-row">
                    <Link to={`/kasus/${c.id}`} className="block rounded-lg border border-line px-3 py-2 hover:border-accent">
                      <span className="block font-semibold">{faultName(rules.find((r) => r.fault_code === c.fault_code), c.fault_code, lang)}</span>
                      <span className="num text-xs text-muted">{c.id} · {fmtDateTime(c.opened_at, lang)} · {t(`state.${c.state}`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <section aria-label={t('machine.charts')} className="space-y-4">
          <p className="text-sm text-muted">{t('machine.window')}</p>
          {SIGNALS.map((s) => (
            <SensorChart key={s} signal={s} readings={readings} band={bands.find((b) => b.signal === s)} markers={markers}
              provenance={latest?.provenance ?? 'SIMULATED'} height={170} />
          ))}
        </section>
      </div>
    </div>
  )
}
