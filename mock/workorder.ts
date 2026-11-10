// Technician work order (PRD §9.5). In the real system the Nexent agent writes this; here the simulator does.
// A line whose value is unknown is omitted, never invented (ADR-008).
import type { Machine, NormalBand, Signal, Site } from '../contract/schemas'

export interface WorkOrderInput {
  caseId: string; site: Site; machine: Machine; faultNameId: string
  evidenceLine?: string; triedStepsId: string[] | null // null = deny
  bring?: string
}

const KIND_ID: Record<Machine['kind'], string> = {
  chest_freezer: 'freezer box', upright_freezer: 'freezer berdiri', ice_maker: 'mesin es', cold_room: 'ruang pendingin',
}

export function buildWorkOrder(i: WorkOrderInput): string {
  const m = i.machine
  const tried = i.triedStepsId === null ? 'tidak ada — dilarang untuk keamanan' : i.triedStepsId.join('; ')
  return [
    `[CoolMechanic] Order servis #${i.caseId}`,
    `Lokasi: ${i.site.name}, ${i.site.area}`,
    `Mesin: ${m.brand} ${m.model} (${KIND_ID[m.kind]}, ±${m.approx_age_years} th)`,
    `Dugaan kerusakan: ${i.faultNameId}`,
    i.evidenceLine && `Bukti sensor: ${i.evidenceLine}`,
    `Sudah dicoba pengelola: ${tried}`,
    i.bring && `Bawa: ${i.bring}`,
    'Balas pesan ini untuk konfirmasi.',
  ].filter(Boolean).join('\n')
}

const LABEL: Record<Signal, { id: string; unit: string; dp: number }> = {
  temp_box_c: { id: 'Suhu dalam', unit: '°C', dp: 1 },
  temp_condenser_c: { id: 'Suhu kisi-kisi belakang', unit: '°C', dp: 1 },
  temp_discharge_c: { id: 'Suhu pipa buang kompresor', unit: '°C', dp: 1 },
  current_rms_a: { id: 'Arus listrik', unit: 'A', dp: 1 },
  vib_rms_g: { id: 'Getaran', unit: 'g', dp: 2 },
}

export function evidenceLine(signal: Signal, value: number | null, band: NormalBand): string | undefined {
  if (value === null) return undefined
  const { id, unit, dp } = LABEL[signal]
  const f = (x: number) => x.toFixed(dp)
  return `${id} ${f(value)} ${unit} (normal ${f(band.low)}–${f(band.high)} ${unit})`
}
