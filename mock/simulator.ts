// In-browser simulator. Plays the edge hub + Nexent agent until the real ones exist (ADR-004).
// All case logic lives here, because in the real system the agent owns it; the dashboard only displays.
import type { Alert, Case, CaseEvent, Dispatch, Machine, Reading, SafetyRule } from '../contract/schemas'
import { rngFor } from './rng'
import { SCENARIOS, type ScenarioId, type ScenarioScript } from './scenarios'
import { MACHINES, SAFETY_RULES, SITES, normalBands } from './seed'
import { isoUtc, normalReading } from './signals'
import { buildWorkOrder, evidenceLine } from './workorder'

export type { ScenarioId }

export type LiveEvent =
  | { kind: 'reading'; reading: Reading } | { kind: 'alert'; alert: Alert } | { kind: 'case'; case: Case }
  | { kind: 'case_event'; event: CaseEvent } | { kind: 'dispatch'; dispatch: Dispatch }
  | { kind: 'clock'; now: string } | { kind: 'reset' }

export type Speed = 1 | 10 | 60
export type TriggerResult = { ok: true } | { ok: false; reason: 'busy' | 'unknown_machine' }

export interface Simulator {
  now(): string
  readings(machineId: string, fromUtc: string, toUtc: string): Reading[]
  alerts(): Alert[]; cases(): Case[]; events(caseId: string): CaseEvent[]; dispatches(): Dispatch[]
  advance(minutes: number): void
  subscribe(fn: (e: LiveEvent) => void): () => void
  trigger(s: ScenarioId, machineId: string): TriggerResult
  play(): void; pause(): void; isPlaying(): boolean
  setSpeed(x: Speed): void; speed(): Speed
  reset(): void
}

const MIN = 60_000
const HISTORY_MIN = 6 * 60
const MAX_READINGS = 24 * 60 + 1 // shortcut: ring-buffer cap at 24h, raise if a longer history view is added
const DROPOUT = { machineId: 'm-01', startBeforeMin: 180, minutes: 10 } // m-01 discharge probe gap, shows "sensor lepas"
const CARETAKER_DELAY_MIN = 6 // simulated caretaker taps "done" this long after the steps are shown (ADR-003)
const VERIFY_SAMPLES = 5

interface Run {
  script: ScenarioScript
  machine: Machine
  startMs: number
  caseId?: string
  fixAtMin?: number
  verifyAtMin?: number
}

const pad = (n: number) => String(n).padStart(4, '0')

export function createSimulator(opts: { seed?: number; startUtc?: string } = {}): Simulator {
  const seed = opts.seed ?? 20261110
  const startMs = Date.parse(opts.startUtc ?? '2026-11-10T01:00:00Z')
  const subs = new Set<(e: LiveEvent) => void>()
  let t: number
  let store: Map<string, Reading[]>
  let alerts: Alert[], cases: Case[], dispatches: Dispatch[]
  let events: Map<string, CaseEvent[]>
  let runs: Map<string, Run>
  let seq: { al: number; c: number; d: number }
  let timer: ReturnType<typeof setInterval> | undefined
  let speed: Speed = 1

  const emit = (e: LiveEvent) => subs.forEach((fn) => fn(e))
  const ts = () => isoUtc(t)

  function sample(mi: number, tMs: number): Reading {
    const m = MACHINES[mi]
    const r = normalReading(m, tMs, rngFor(seed, mi, Math.floor(tMs / MIN)))
    const gapStart = startMs - DROPOUT.startBeforeMin * MIN
    if (m.id === DROPOUT.machineId && tMs >= gapStart && tMs < gapStart + DROPOUT.minutes * MIN) {
      r.temp_discharge_c = null
      r.sensor_health.discharge_ok = false
    }
    const run = runs.get(m.id)
    if (run) {
      const min = (tMs - run.startMs) / MIN
      const decay = run.fixAtMin !== undefined && run.script.fixWorks ? Math.exp(-(min - run.fixAtMin) / 3) : 1
      run.script.apply(r, min, decay, m, tMs)
    }
    return r
  }

  function push(r: Reading) {
    const arr = store.get(r.machine_id)!
    arr.push(r)
    if (arr.length > MAX_READINGS) arr.shift()
  }

  function init() {
    t = startMs
    alerts = []; cases = []; dispatches = []
    events = new Map(); runs = new Map()
    seq = { al: 0, c: 0, d: 0 }
    store = new Map(MACHINES.map((m) => [m.id, []]))
    for (let tm = startMs - HISTORY_MIN * MIN; tm <= startMs; tm += MIN) MACHINES.forEach((_, mi) => push(sample(mi, tm)))
  }

  function addEvent(e: CaseEvent) {
    events.get(e.case_id)!.push(e)
    emit({ kind: 'case_event', event: e })
  }

  function setCase(id: string, patch: Partial<Case>) {
    const i = cases.findIndex((c) => c.id === id)
    cases[i] = { ...cases[i], ...patch }
    emit({ kind: 'case', case: cases[i] })
  }

  function dispatch(run: Run, rule: SafetyRule | undefined, denied: boolean) {
    const caseId = run.caseId!
    const m = run.machine
    const latest = store.get(m.id)!.at(-1)!
    const sig = run.script.evidence_signal
    const band = normalBands(m).find((b) => b.signal === sig)!
    const d: Dispatch = {
      id: `dsp-${pad(++seq.d)}`,
      case_id: caseId,
      channel: 'mock',
      sent_at: ts(),
      delivery_status: 'sent',
      message_text: buildWorkOrder({
        caseId,
        site: SITES.find((s) => s.id === m.site_id)!,
        machine: m,
        faultNameId: rule?.fault_name_id ?? run.script.fault_code,
        evidenceLine: evidenceLine(sig, latest[sig], band),
        triedStepsId: denied ? null : (rule?.steps ?? []).map((s) => s.text_id),
        bring: run.script.bring,
      }),
    }
    dispatches.push(d)
    emit({ kind: 'dispatch', dispatch: d })
    addEvent({ case_id: caseId, ts_utc: ts(), type: 'dispatched', payload: { dispatch_id: d.id } })
    setCase(caseId, { state: 'DISPATCHED' })
  }

  function advanceRun(run: Run) {
    const min = (t - run.startMs) / MIN
    const { script, machine } = run
    const rule = SAFETY_RULES.find((r) => r.fault_code === script.fault_code)
    const status = rule?.status ?? 'deny' // no rule → treat as deny

    if (min === script.alertAt) {
      const alert: Alert = {
        id: `al-${pad(++seq.al)}`, machine_id: machine.id, ts_utc: ts(), fault_code: script.fault_code,
        confidence: script.confidence, severity: script.severity, source: 'edge',
      }
      alerts.push(alert)
      emit({ kind: 'alert', alert })
      const c: Case = {
        id: `case-${pad(++seq.c)}`, machine_id: machine.id, fault_code: script.fault_code,
        safety_status: status, state: 'OPEN', opened_at: ts(), closed_at: null,
      }
      run.caseId = c.id
      cases.push(c)
      events.set(c.id, [])
      emit({ kind: 'case', case: c })
      addEvent({ case_id: c.id, ts_utc: ts(), type: 'alert', payload: { alert_id: alert.id, fault_code: script.fault_code, confidence: script.confidence, evidence_signal: script.evidence_signal } })
      addEvent({ case_id: c.id, ts_utc: ts(), type: 'safety_check', payload: { fault_code: script.fault_code, status } })
      if (status === 'deny' || !rule) return dispatch(run, rule, true)
      for (const s of rule.steps) addEvent({ case_id: c.id, ts_utc: ts(), type: 'step_shown', payload: { order: s.order } })
      setCase(c.id, { state: 'GUIDING' })
      return
    }

    if (!run.caseId || !rule?.verify_rule) return
    const caseId = run.caseId
    const vr = rule.verify_rule

    if (min === script.alertAt + CARETAKER_DELAY_MIN) {
      for (const s of rule.steps) addEvent({ case_id: caseId, ts_utc: ts(), type: 'step_done', payload: { order: s.order } })
      run.fixAtMin = min
      run.verifyAtMin = min + vr.wait_minutes
      const band = normalBands(machine).find((b) => b.signal === vr.signal)!
      addEvent({ case_id: caseId, ts_utc: ts(), type: 'verify_start', payload: { signal: vr.signal, target_range: [band.low, band.high], wait_minutes: vr.wait_minutes } })
      setCase(caseId, { state: 'VERIFYING' })
      return
    }

    if (min === run.verifyAtMin) {
      const band = normalBands(machine).find((b) => b.signal === vr.signal)!
      const values = store.get(machine.id)!.slice(-VERIFY_SAMPLES).map((r) => r[vr.signal])
      const pass = values.every((v) => v !== null && v >= band.low && v <= band.high)
      const payload = { signal: vr.signal, values, target_range: [band.low, band.high] as [number, number] }
      if (pass) {
        addEvent({ case_id: caseId, ts_utc: ts(), type: 'verify_pass', payload })
        setCase(caseId, { state: 'RESOLVED', closed_at: ts() })
        runs.delete(machine.id) // machine is free again
      } else {
        addEvent({ case_id: caseId, ts_utc: ts(), type: 'verify_fail', payload })
        dispatch(run, rule, false) // run stays: fault persists, machine stays busy until a technician confirms
      }
    }
  }

  function step() {
    t += MIN
    MACHINES.forEach((_, mi) => {
      const r = sample(mi, t)
      push(r)
      emit({ kind: 'reading', reading: r })
    })
    for (const run of [...runs.values()]) advanceRun(run)
    emit({ kind: 'clock', now: ts() })
  }

  function stopTimer() {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
  }
  function startTimer() {
    stopTimer()
    timer = setInterval(step, MIN / speed)
  }

  init()

  return {
    now: ts,
    readings(machineId, fromUtc, toUtc) {
      const from = Date.parse(fromUtc), to = Date.parse(toUtc)
      return (store.get(machineId) ?? []).filter((r) => { const x = Date.parse(r.ts_utc); return x >= from && x <= to })
    },
    alerts: () => [...alerts],
    cases: () => [...cases],
    events: (caseId) => [...(events.get(caseId) ?? [])],
    dispatches: () => [...dispatches],
    advance(minutes) { for (let i = 0; i < minutes; i++) step() },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn) } },
    trigger(s, machineId) {
      const machine = MACHINES.find((m) => m.id === machineId)
      if (!machine) return { ok: false, reason: 'unknown_machine' }
      const open = cases.some((c) => c.machine_id === machineId && c.closed_at === null)
      if (open || runs.has(machineId)) return { ok: false, reason: 'busy' }
      runs.set(machineId, { script: SCENARIOS[s], machine, startMs: t })
      return { ok: true }
    },
    play() { if (timer === undefined) startTimer() },
    pause: stopTimer,
    isPlaying: () => timer !== undefined,
    setSpeed(x) { speed = x; if (timer !== undefined) startTimer() },
    speed: () => speed,
    reset() { stopTimer(); init(); emit({ kind: 'reset' }) },
  }
}
