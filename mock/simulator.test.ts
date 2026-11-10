import { ReadingSchema } from '../contract/schemas'
import { MACHINES, SAFETY_RULES, SITES, GLOBAL_RULES, normalBands } from './seed'
import { createSimulator } from './simulator'

const H6 = 6 * 60

test('same seed gives identical readings', () => {
  const a = createSimulator(), b = createSimulator(); a.advance(60); b.advance(60)
  expect(a.readings('m-01', '2026-11-09T00:00:00Z', a.now())).toEqual(b.readings('m-01', '2026-11-09T00:00:00Z', b.now()))
})

test('a different seed gives different readings', () => {
  const a = createSimulator(), b = createSimulator({ seed: 7 })
  expect(a.readings('m-01', '2026-11-10T00:00:00Z', a.now())).not.toEqual(b.readings('m-01', '2026-11-10T00:00:00Z', b.now()))
})

test('24h of normal readings stay inside every normal band', () => {
  const s = createSimulator(); s.advance(24 * 60)
  for (const m of MACHINES) for (const band of normalBands(m))
    for (const r of s.readings(m.id, '2026-11-01T00:00:00Z', s.now())) {
      const v = r[band.signal]; if (v === null) continue
      expect(v).toBeGreaterThanOrEqual(band.low); expect(v).toBeLessThanOrEqual(band.high)
    }
})

test('every reading validates and is SIMULATED', () => {
  const s = createSimulator()
  const rs = s.readings('m-01', '2026-11-09T00:00:00Z', s.now())
  expect(rs).toHaveLength(H6 + 1)   // 6h history + the reading at startUtc
  for (const r of rs) { expect(ReadingSchema.safeParse(r).success).toBe(true); expect(r.provenance).toBe('SIMULATED') }
})

test('m-01 discharge probe drops out for 10 minutes', () => {
  const s = createSimulator()
  const gap = s.readings('m-01', '2026-11-09T22:00:00Z', '2026-11-09T22:09:00Z')
  expect(gap).toHaveLength(10)
  expect(gap.every(r => r.temp_discharge_c === null && !r.sensor_health.discharge_ok)).toBe(true)
  const after = s.readings('m-01', '2026-11-09T22:10:00Z', '2026-11-09T22:10:00Z')[0]
  expect(after.temp_discharge_c).not.toBeNull()
})

test('advance emits 5 readings then a clock event per minute', () => {
  const s = createSimulator(); const kinds: string[] = []; s.subscribe(e => kinds.push(e.kind)); s.advance(2)
  expect(kinds).toEqual(['reading','reading','reading','reading','reading','clock','reading','reading','reading','reading','reading','clock'])
})

test('unsubscribe stops events', () => {
  const s = createSimulator(); let n = 0; const off = s.subscribe(() => n++); off(); s.advance(1)
  expect(n).toBe(0)
})

test('seed has 3 sites, 5 machines, 10 rules and deny rules have no steps', () => {
  expect(SITES).toHaveLength(3); expect(MACHINES).toHaveLength(5); expect(SAFETY_RULES).toHaveLength(10); expect(GLOBAL_RULES).toHaveLength(3)
  for (const r of SAFETY_RULES.filter(r => r.status === 'deny')) { expect(r.steps).toEqual([]); expect(r.verify_rule).toBeNull() }
})

test('compressor cycles: current is near zero for part of every half hour', () => {
  const s = createSimulator()
  const rs = s.readings('m-04', '2026-11-10T00:00:00Z', '2026-11-10T00:29:00Z')
  const on = rs.filter(r => r.current_rms_a! > 0.5).length
  expect(on).toBe(18)
})

test('play advances on a timer at the chosen speed', () => {
  vi.useFakeTimers()
  const s = createSimulator(); const start = s.now(); s.setSpeed(60); s.play()
  expect(s.isPlaying()).toBe(true)
  vi.advanceTimersByTime(3000)   // 60x: one virtual minute per second
  s.pause(); vi.useRealTimers()
  expect(Date.parse(s.now()) - Date.parse(start)).toBe(3 * 60_000)
  expect(s.speed()).toBe(60)
})

test('trigger on an unknown machine is refused', () => {
  expect(createSimulator().trigger('condenser_blocked', 'm-99')).toEqual({ ok: false, reason: 'unknown_machine' })
})
