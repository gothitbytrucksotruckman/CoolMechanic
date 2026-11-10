// In-browser simulator. Plays the edge hub + Nexent agent until the real ones exist (ADR-004).
import type { Alert, Case, CaseEvent, Dispatch, Reading } from '../contract/schemas'
import { rngFor } from './rng'
import { MACHINES } from './seed'
import { isoUtc, normalReading } from './signals'

export type LiveEvent =
  | { kind: 'reading'; reading: Reading } | { kind: 'alert'; alert: Alert } | { kind: 'case'; case: Case }
  | { kind: 'case_event'; event: CaseEvent } | { kind: 'dispatch'; dispatch: Dispatch }
  | { kind: 'clock'; now: string } | { kind: 'reset' }

export type ScenarioId = 'condenser_blocked' | 'condenser_blocked_not_fixed' | 'electrical_part_fault' | 'unknown_anomaly'
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

export function createSimulator(opts: { seed?: number; startUtc?: string } = {}): Simulator {
  const seed = opts.seed ?? 20261110
  const startMs = Date.parse(opts.startUtc ?? '2026-11-10T01:00:00Z')
  const subs = new Set<(e: LiveEvent) => void>()
  let t: number
  let store: Map<string, Reading[]>
  let timer: ReturnType<typeof setInterval> | undefined
  let speed: Speed = 1

  const emit = (e: LiveEvent) => subs.forEach((fn) => fn(e))

  function sample(mi: number, tMs: number): Reading {
    const m = MACHINES[mi]
    const r = normalReading(m, tMs, rngFor(seed, mi, Math.floor(tMs / MIN)))
    const gapStart = startMs - DROPOUT.startBeforeMin * MIN
    if (m.id === DROPOUT.machineId && tMs >= gapStart && tMs < gapStart + DROPOUT.minutes * MIN) {
      r.temp_discharge_c = null
      r.sensor_health.discharge_ok = false
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
    store = new Map(MACHINES.map((m) => [m.id, []]))
    for (let tm = startMs - HISTORY_MIN * MIN; tm <= startMs; tm += MIN) MACHINES.forEach((_, mi) => push(sample(mi, tm)))
  }

  function step() {
    t += MIN
    MACHINES.forEach((_, mi) => {
      const r = sample(mi, t)
      push(r)
      emit({ kind: 'reading', reading: r })
    })
    emit({ kind: 'clock', now: isoUtc(t) })
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
    now: () => isoUtc(t),
    readings(machineId, fromUtc, toUtc) {
      const from = Date.parse(fromUtc), to = Date.parse(toUtc)
      return (store.get(machineId) ?? []).filter((r) => { const x = Date.parse(r.ts_utc); return x >= from && x <= to })
    },
    alerts: () => [],
    cases: () => [],
    events: () => [],
    dispatches: () => [],
    advance(minutes) { for (let i = 0; i < minutes; i++) step() },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn) } },
    trigger(_s, machineId) {
      if (!MACHINES.some((m) => m.id === machineId)) return { ok: false, reason: 'unknown_machine' }
      throw new Error('scenarios arrive in plan Task 4')
    },
    play() { if (timer === undefined) startTimer() },
    pause: stopTimer,
    isPlaying: () => timer !== undefined,
    setSpeed(x) { speed = x; if (timer !== undefined) startTimer() },
    speed: () => speed,
    reset() { stopTimer(); init(); emit({ kind: 'reset' }) },
  }
}
