import { Link, useParams } from 'react-router'
import { Card } from '../components/Card'
import { CaretakerSteps } from '../components/CaretakerSteps'
import { CaseTimeline } from '../components/CaseTimeline'
import { EmptyState } from '../components/EmptyState'
import { ErrorCard } from '../components/ErrorCard'
import { JudgeNote } from '../components/JudgeNote'
import { SensorChart } from '../components/SensorChart'
import { StatusChip } from '../components/StatusChip'
import { WorkOrderPreview } from '../components/WorkOrderPreview'
import { machineStatus } from '../data/status'
import { useSourceData } from '../data/useSourceData'
import { useT } from '../i18n/i18n'
import { faultName } from '../i18n/labels'

const BEFORE_MIN = 30

export function CaseDetail() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const { data, error } = useSourceData(async (ds) => {
    const bundle = await ds.getCase(id)
    if (!bundle) return { bundle }
    const c = bundle.case
    const alert = bundle.events.find((e) => e.type === 'alert')
    const vs = bundle.events.find((e) => e.type === 'verify_start')
    const signal = vs?.type === 'verify_start' ? vs.payload.signal : alert?.type === 'alert' ? alert.payload.evidence_signal : undefined
    const from = new Date(Date.parse(c.opened_at) - BEFORE_MIN * 60_000).toISOString()
    const [machine, rules, bands, readings] = await Promise.all([
      ds.listMachines().then((ms) => ms.find((m) => m.id === c.machine_id)),
      ds.listSafetyRules(), ds.listNormalBands(c.machine_id),
      ds.getReadings(c.machine_id, from, c.closed_at ?? ds.now()),
    ])
    return { bundle, machine, rule: rules.find((r) => r.fault_code === c.fault_code), signal, bands, readings }
  }, [id])

  if (error) return <ErrorCard error={error} />
  if (!data) return <h1 className="text-2xl font-bold">{t('page.case')}</h1>
  if (!data.bundle) return <EmptyState title={t('case.not_found')} reason={t('case.not_found_reason', { id })} />

  const { bundle: { case: c, events, dispatch }, machine, rule, signal, readings = [], bands = [] } = data
  const alert = events.find((e) => e.type === 'alert')
  const vs = events.find((e) => e.type === 'verify_start')
  const fixAt = [...events].reverse().find((e) => e.type === 'step_done')
  const band = vs?.type === 'verify_start' ? { low: vs.payload.target_range[0], high: vs.payload.target_range[1] } : bands.find((b) => b.signal === signal)
  const markers = [
    ...(alert ? [{ ts_utc: alert.ts_utc, label: t('chart.detected'), dashed: true }] : []),
    ...(fixAt ? [{ ts_utc: fixAt.ts_utc, label: t('chart.fix') }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="num text-sm text-muted">{c.id} · <Link className="underline" to={`/mesin/${c.machine_id}`}>{machine?.name ?? c.machine_id}</Link></p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{faultName(rule, c.fault_code, lang)}</h1>
          <StatusChip status={machineStatus([c])} label={t(`state.${c.state}`)} />
        </div>
      </div>

      <CaseTimeline case={c} events={events} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('case.caretaker')}>
          <CaretakerSteps safetyStatus={c.safety_status} rule={rule} events={events} />
          <div className="mt-3"><JudgeNote d="D2">{t('case.judge_d2')}</JudgeNote></div>
        </Card>

        <Card title={vs ? t('case.before_after') : t('case.evidence')}>
          {signal ? (
            <SensorChart signal={signal} readings={readings} band={band} markers={markers} provenance={readings.at(-1)?.provenance ?? 'SIMULATED'} height={240} />
          ) : (
            <EmptyState title={t('chart.empty')} reason={t('case.no_signal')} />
          )}
          {vs ? <div className="mt-3"><JudgeNote d="D3">{t('case.judge_d3')}</JudgeNote></div>
            : <p className="mt-3 text-sm text-muted">{t('case.evidence_note')}</p>}
        </Card>
      </div>

      {dispatch && (
        <Card title={t('case.work_order')}>
          <WorkOrderPreview dispatch={dispatch} />
        </Card>
      )}
    </div>
  )
}
