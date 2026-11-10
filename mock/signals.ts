// Normal operating signals. Illustrative shapes, not physics (see mock/README.md).
import type { Machine, Reading } from '../contract/schemas'
import { KIND_PARAMS } from './seed'

export const CYCLE_MIN = 30
export const ON_MIN = 18 // minutes 0–17 of each cycle the compressor runs
const CANTEENS = new Set(['m-04', 'm-05'])

export const isoUtc = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d

export function isCompressorOn(m: Machine, tMs: number): boolean {
  return cyclePhase(m, tMs) < ON_MIN
}

function cyclePhase(m: Machine, tMs: number): number {
  const offset = Number(m.id.slice(2)) * 7 // machines don't cycle in lockstep
  return (Math.floor(tMs / 60_000) + offset) % CYCLE_MIN
}

export function normalReading(m: Machine, tMs: number, rnd: () => number): Reading {
  const { setpoint_c: sp, nominal_a } = KIND_PARAMS[m.kind]
  const noise = (amp: number) => (rnd() * 2 - 1) * amp
  const hourWib = ((tMs / 3_600_000) + 7) % 24
  const ambient = 29 + 3 * Math.sin((2 * Math.PI * (hourWib - 9)) / 24)
  const p = cyclePhase(m, tMs)
  const on = p < ON_MIN

  let box = on ? sp + 1.5 - (3 * p) / (ON_MIN - 1) : sp - 1.5 + (3 * (p - ON_MIN)) / (CYCLE_MIN - ON_MIN - 1)
  box += noise(0.2)
  if (CANTEENS.has(m.id) && hourWib >= 6 && hourWib < 14 && rnd() < 0.05) box += 2.0 // door opening

  return {
    machine_id: m.id,
    ts_utc: isoUtc(tMs),
    provenance: 'SIMULATED',
    temp_box_c: round(box),
    temp_condenser_c: round(ambient + (on ? (m.condenser_type === 'fan' ? 12 : 10) : 3) + noise(0.3)),
    temp_discharge_c: round(ambient + (on ? 35 : 8) + noise(0.3)),
    current_rms_a: round(on ? nominal_a * (1 + noise(0.03)) : 0.02),
    vib_rms_g: round(on ? 0.25 + noise(0.02) : 0.01, 3),
    sensor_health: { box_ok: true, condenser_ok: true, discharge_ok: true, current_ok: true, vib_ok: true },
  }
}
