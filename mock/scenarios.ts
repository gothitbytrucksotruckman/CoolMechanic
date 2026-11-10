// Fault scenario scripts: how signals drift and when the alert fires. Illustrative, not physics.
import type { Alert, FaultCode, Machine, Reading, Signal } from '../contract/schemas'
import { KIND_PARAMS } from './seed'
import { CYCLE_MIN, isCompressorOn } from './signals'

export type ScenarioId = 'condenser_blocked' | 'condenser_blocked_not_fixed' | 'electrical_part_fault' | 'unknown_anomaly'

export interface ScenarioScript {
  fault_code: FaultCode
  alertAt: number // minutes after trigger
  severity: Alert['severity']
  confidence: number
  evidence_signal: Signal
  fixWorks: boolean
  bring?: string // mock-only: what the technician should bring
  // m = minutes since trigger; decay = 1 before a successful fix, then falls toward 0
  apply(r: Reading, m: number, decay: number, machine: Machine, tMs: number): void
}

const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d
const add = (r: Reading, s: Signal, d: number, dp = 2) => { if (r[s] !== null) r[s] = round(r[s]! + d, dp) }

function condenser(r: Reading, m: number, decay: number, machine: Machine, tMs: number) {
  add(r, 'temp_condenser_c', Math.min(1.5 * m, 20) * decay) // steep enough to leave the band before the alert (demo step 2)
  add(r, 'temp_discharge_c', Math.min(1.2 * m, 25) * decay)
  if (isCompressorOn(machine, tMs) && r.current_rms_a !== null) r.current_rms_a = round(r.current_rms_a * (1 + Math.min(0.02 * m, 0.3) * decay))
  add(r, 'temp_box_c', Math.min(Math.max(0, 0.08 * (m - 20)), 4) * decay)
}

const CONDENSER_BRING = 'Sikat kondensor dan termometer'

export const SCENARIOS: Record<ScenarioId, ScenarioScript> = {
  condenser_blocked: {
    fault_code: 'condenser_blocked', alertAt: 8, severity: 'warning', confidence: 0.87,
    evidence_signal: 'temp_condenser_c', fixWorks: true, bring: CONDENSER_BRING, apply: condenser,
  },
  condenser_blocked_not_fixed: {
    fault_code: 'condenser_blocked', alertAt: 8, severity: 'warning', confidence: 0.87,
    evidence_signal: 'temp_condenser_c', fixWorks: false, bring: CONDENSER_BRING, apply: condenser,
  },
  electrical_part_fault: {
    fault_code: 'electrical_part_fault', alertAt: 5, severity: 'critical', confidence: 0.82,
    evidence_signal: 'current_rms_a', fixWorks: false, bring: 'Kapasitor start dan relay start sesuai tipe kompresor',
    apply(r, _m, _d, machine, tMs) {
      if (!isCompressorOn(machine, tMs)) return
      const phase = (Math.floor(tMs / 60_000) + Number(machine.id.slice(2)) * 7) % CYCLE_MIN
      if (phase < 2) add(r, 'current_rms_a', 1.5 * KIND_PARAMS[machine.kind].nominal_a)
      add(r, 'vib_rms_g', 0.3, 3)
    },
  },
  unknown_anomaly: {
    fault_code: 'unknown_anomaly', alertAt: 10, severity: 'warning', confidence: 0.41,
    evidence_signal: 'vib_rms_g', fixWorks: false,
    apply(r, m) { add(r, 'vib_rms_g', Math.min(0.005 * m, 0.2), 3) },
  },
}
