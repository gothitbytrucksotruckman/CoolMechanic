import type { Case } from '../../../contract/schemas'

export type StatusKey = 'aman' | 'waspada' | 'bahaya' | 'teknisi'

// DESIGN §5.1: derived from open cases, first matching row wins.
export function machineStatus(machineCases: Case[]): StatusKey {
  const open = machineCases.filter((c) => c.closed_at === null)
  if (open.some((c) => c.safety_status === 'deny' && c.state !== 'DISPATCHED')) return 'bahaya'
  if (open.some((c) => c.state === 'DISPATCHED')) return 'teknisi'
  if (open.length > 0) return 'waspada'
  return 'aman'
}
