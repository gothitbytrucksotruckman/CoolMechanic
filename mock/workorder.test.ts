import { MACHINES, SITES } from './seed'
import { buildWorkOrder, evidenceLine } from './workorder'

test('deny order with unknown bring and null evidence omits those lines', () => {
  const txt = buildWorkOrder({ caseId: 'case-0001', site: SITES[2], machine: MACHINES[3], faultNameId: 'Pola tidak dikenal', triedStepsId: null })
  expect(txt.split('\n')).toEqual([
    '[CoolMechanic] Order servis #case-0001', 'Lokasi: Kantin Kampus (simulasi), Cikarang, Bekasi',
    'Mesin: Merek D UF-400 (freezer berdiri, ±3 th)', 'Dugaan kerusakan: Pola tidak dikenal',
    'Sudah dicoba pengelola: tidak ada — dilarang untuk keamanan', 'Balas pesan ini untuk konfirmasi.'])
})

test('allow order lists tried steps, evidence and what to bring', () => {
  const txt = buildWorkOrder({ caseId: 'case-0002', site: SITES[0], machine: MACHINES[1], faultNameId: 'X', evidenceLine: 'E', triedStepsId: ['a', 'b'], bring: 'B' })
  expect(txt).toContain('\nBukti sensor: E\n')
  expect(txt).toContain('\nSudah dicoba pengelola: a; b\n')
  expect(txt).toContain('\nBawa: B\n')
})

test('evidenceLine formats and returns undefined for null', () => {
  const band = { machine_id: 'm-01', signal: 'temp_condenser_c', low: 25, high: 46, source: 'SIMULATED' } as const
  expect(evidenceLine('temp_condenser_c', 52.34, band)).toBe('Suhu kisi-kisi belakang 52.3 °C (normal 25.0–46.0 °C)')
  expect(evidenceLine('temp_condenser_c', null, band)).toBeUndefined()
})

test('vibration evidence uses two decimals', () => {
  const band = { machine_id: 'm-01', signal: 'vib_rms_g', low: 0, high: 0.35, source: 'SIMULATED' } as const
  expect(evidenceLine('vib_rms_g', 0.456, band)).toBe('Getaran 0.46 g (normal 0.00–0.35 g)')
})
