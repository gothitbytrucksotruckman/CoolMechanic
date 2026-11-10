import { useState } from 'react'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { useDataSource } from '../data/context'
import type { ScenarioId, Speed } from '../data/types'
import { useSourceData } from '../data/useSourceData'
import { fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'

const SCENARIOS: ScenarioId[] = ['condenser_blocked', 'condenser_blocked_not_fixed', 'electrical_part_fault', 'unknown_anomaly']
const SPEEDS: Speed[] = [1, 10, 60]

// Hidden route for the presenter (PRD §9.4.9). Never linked from navigation.
export function Demo() {
  const { t, lang } = useT()
  const ds = useDataSource()
  const demo = ds.demo
  const { data } = useSourceData(async (s) => ({ machines: await s.listMachines(), now: s.now() }), [])
  const [machineId, setMachineId] = useState('m-01')
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const [confirmReset, setConfirmReset] = useState(false)
  const [, rerender] = useState(0)
  const refresh = () => rerender((n) => n + 1)

  if (!demo) return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{t('page.demo')}</h1>
      <EmptyState title={t('demo.unavailable')} reason={t('demo.unavailable_reason')} />
    </>
  )

  const trigger = (s: ScenarioId) => {
    const r = demo.trigger(s, machineId)
    setMsg(r.ok ? { ok: true, text: t('demo.triggered', { s, m: machineId }) } : { ok: false, text: t(`demo.refused.${r.reason}`) })
  }
  const btn = 'rounded-lg border border-line px-3 py-2 font-semibold hover:bg-bg'
  const on = 'bg-accent text-surface border-accent hover:bg-accent'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('page.demo')}</h1>
      <p className="rounded-card border-2 px-4 py-3 font-bold" style={{ borderColor: 'var(--waspada-fg)', background: 'var(--waspada)', color: 'var(--waspada-fg)' }}>
        Demo control — simulated · Kontrol demo — data simulasi
      </p>

      <Card title={t('demo.scenario')}>
        <label className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-semibold">{t('demo.machine')}</span>
          <select className="rounded-lg border border-line bg-surface px-3 py-2" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
            {data?.machines.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => <button key={s} type="button" className={`${btn} font-mono text-sm`} onClick={() => trigger(s)}>{s}</button>)}
        </div>
        {msg && <p role="status" className="mt-3 text-sm font-semibold" style={{ color: msg.ok ? 'var(--aman-fg)' : 'var(--bahaya-fg)' }}>{msg.text}</p>}
      </Card>

      <Card title={t('demo.time')}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => { if (demo.isPlaying()) demo.pause(); else demo.play(); refresh() }}>
            {demo.isPlaying() ? t('demo.pause') : t('demo.play')}
          </button>
          <div role="group" aria-label={t('demo.speed')} className="flex gap-1">
            {SPEEDS.map((x) => (
              <button key={x} type="button" aria-pressed={demo.speed() === x} className={`${btn} num ${demo.speed() === x ? on : ''}`}
                onClick={() => { demo.setSpeed(x); refresh() }}>{x}×</button>
            ))}
          </div>
          <span className="text-muted num">{t('demo.virtual_time')}: {fmtTime(data?.now ?? ds.now(), lang)}</span>
        </div>
      </Card>

      <Card title="Reset">
        {!confirmReset ? (
          <button type="button" className={btn} onClick={() => setConfirmReset(true)}>Reset</button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span>{t('demo.reset_confirm')}</span>
            <button type="button" className={`${btn} ${on}`} onClick={() => { demo.reset(); setConfirmReset(false); setMsg(undefined) }}>{t('demo.reset_yes')}</button>
            <button type="button" className={btn} onClick={() => setConfirmReset(false)}>{t('demo.reset_no')}</button>
          </div>
        )}
      </Card>
    </div>
  )
}
