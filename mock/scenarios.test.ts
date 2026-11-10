import { AlertSchema, CaseEventSchema, CaseSchema, DispatchSchema, ReadingSchema } from '../contract/schemas'
import { MACHINES, normalBands } from './seed'
import { createSimulator, type LiveEvent, type Simulator } from './simulator'

const types = (s: Simulator, id: string) => s.events(id).map(e => e.type)

test('condenser_blocked resolves after verification', () => {
  const s = createSimulator(); expect(s.trigger('condenser_blocked', 'm-01')).toEqual({ ok: true }); s.advance(40)
  const c = s.cases()[0]; expect(c.state).toBe('RESOLVED'); expect(c.closed_at).not.toBeNull()
  expect(types(s, c.id)).toEqual(['alert','safety_check','step_shown','step_shown','step_shown','step_shown',
    'step_done','step_done','step_done','step_done','verify_start','verify_pass'])
  expect(s.dispatches()).toHaveLength(0)
})

test('condenser_blocked_not_fixed fails verification and dispatches', () => {
  const s = createSimulator(); s.trigger('condenser_blocked_not_fixed', 'm-02'); s.advance(40)
  const c = s.cases()[0]; expect(c.state).toBe('DISPATCHED'); expect(c.closed_at).toBeNull()
  expect(types(s, c.id).slice(-2)).toEqual(['verify_fail','dispatched'])
  expect(s.dispatches()[0].message_text).toContain('Sudah dicoba pengelola: Cabut steker')
})

test.each(['electrical_part_fault', 'unknown_anomaly'] as const)('%s dispatches with no steps', (sc) => {
  const s = createSimulator(); s.trigger(sc, 'm-04'); s.advance(15)
  const c = s.cases()[0]; expect(c.safety_status).toBe('deny'); expect(c.state).toBe('DISPATCHED')
  expect(types(s, c.id)).toEqual(['alert','safety_check','dispatched'])
  expect(s.dispatches()[0].message_text).toContain('tidak ada — dilarang untuk keamanan')
})

test.each(['m-01', 'm-02', 'm-03', 'm-04', 'm-05'])('electrical fault on %s: work-order evidence is outside the normal band', (m) => {
  const s = createSimulator(); s.trigger('electrical_part_fault', m); s.advance(6)
  const line = s.dispatches()[0].message_text.split('\n').find(l => l.startsWith('Bukti sensor:'))!
  const [value, high] = [...line.matchAll(/(\d+\.\d+)/g)].map(x => Number(x[1])).filter((_, i) => i !== 1)
  expect(value).toBeGreaterThan(high)
})

test('box temperature is still in band when the condenser alert fires', () => {
  const s = createSimulator(); s.trigger('condenser_blocked', 'm-01'); s.advance(8)
  const box = normalBands(MACHINES[0]).find(b => b.signal === 'temp_box_c')!
  const r = s.readings('m-01', s.now(), s.now())[0]
  expect(r.temp_box_c!).toBeLessThanOrEqual(box.high); expect(s.alerts()).toHaveLength(1)
})

test('condenser temperature leaves its band before the alert and returns after the fix', () => {
  const s = createSimulator(); s.trigger('condenser_blocked', 'm-01'); s.advance(40)
  const ev = s.events(s.cases()[0].id)
  const vs = ev.find(e => e.type === 'verify_start')!
  const pass = ev.find(e => e.type === 'verify_pass')!
  if (pass.type !== 'verify_pass' || vs.type !== 'verify_start') throw new Error('unreachable')
  const [lo, hi] = vs.payload.target_range
  expect(pass.payload.values.every(v => v !== null && v >= lo && v <= hi)).toBe(true)
  const beforeAlert = s.readings('m-01', '2026-11-10T01:01:00Z', s.alerts()[0].ts_utc).map(r => r.temp_condenser_c ?? 0)
  expect(Math.max(...beforeAlert)).toBeGreaterThan(hi)
})

test('every emitted entity validates against the contract', () => {
  const s = createSimulator(); const seen: LiveEvent[] = []; s.subscribe(e => seen.push(e))
  for (const [sc, m] of [['condenser_blocked','m-01'],['condenser_blocked_not_fixed','m-02'],['electrical_part_fault','m-04'],['unknown_anomaly','m-05']] as const) s.trigger(sc, m)
  s.advance(40)
  const schema = { reading: ReadingSchema, alert: AlertSchema, case: CaseSchema, case_event: CaseEventSchema, dispatch: DispatchSchema } as const
  let checked = 0
  for (const e of seen) if (e.kind in schema) { expect(schema[e.kind as keyof typeof schema].safeParse(Object.values(e)[1]).success).toBe(true); checked++ }
  expect(checked).toBeGreaterThan(200)
  expect(seen.some(e => e.kind === 'dispatch')).toBe(true)
})

test('Review Focus 1: busy machine is refused', () => {
  const s = createSimulator(); s.trigger('electrical_part_fault', 'm-03'); s.advance(10)
  expect(s.trigger('condenser_blocked', 'm-03')).toEqual({ ok: false, reason: 'busy' })
  expect(s.cases()).toHaveLength(1)
})

test('a machine is also busy between trigger and alert', () => {
  const s = createSimulator(); s.trigger('condenser_blocked', 'm-03')
  expect(s.trigger('electrical_part_fault', 'm-03')).toEqual({ ok: false, reason: 'busy' })
})

test('Review Focus 2: reset mid-case equals a fresh simulator', () => {
  const s = createSimulator(); s.setSpeed(60); s.play(); s.trigger('condenser_blocked', 'm-01'); s.advance(20); s.reset()
  const fresh = createSimulator()
  expect(s.cases()).toEqual([]); expect(s.alerts()).toEqual([]); expect(s.dispatches()).toEqual([])
  expect(s.isPlaying()).toBe(false); expect(s.now()).toBe(fresh.now())
  expect(s.readings('m-01', '2026-11-09T00:00:00Z', s.now())).toEqual(fresh.readings('m-01', '2026-11-09T00:00:00Z', fresh.now()))
  s.trigger('condenser_blocked', 'm-01'); s.advance(40)
  expect(s.cases()[0].id).toBe('case-0001')
})
