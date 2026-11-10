import type { Case, CaseState, SafetyStatus } from '../../contract/schemas'
import { machineStatus } from '../src/data/status'

// DESIGN §5.1, first match wins
const c = (safety_status: SafetyStatus, state: CaseState, closed = false): Case => ({ id: 'c', machine_id: 'm', fault_code: 'condenser_blocked', safety_status, state, opened_at: 'x', closed_at: closed ? 'y' : null })

test.each([
  [[], 'aman'], [[c('allow', 'RESOLVED', true)], 'aman'],
  [[c('allow', 'GUIDING')], 'waspada'], [[c('observe', 'VERIFYING')], 'waspada'],
  [[c('deny', 'OPEN')], 'bahaya'], [[c('deny', 'DISPATCHED')], 'teknisi'], [[c('allow', 'DISPATCHED')], 'teknisi'],
  [[c('allow', 'GUIDING'), c('deny', 'OPEN')], 'bahaya'], [[c('allow', 'GUIDING'), c('allow', 'DISPATCHED')], 'teknisi'],
])('%j → %s', (cases, expected) => expect(machineStatus(cases as Case[])).toBe(expected))
