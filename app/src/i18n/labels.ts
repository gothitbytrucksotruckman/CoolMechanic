// Owner-facing labels for contract enums (glossary.md: no refrigeration jargon).
import type { CaseEventType, Machine, SafetyRule, Signal } from '../../../contract/schemas'
import type { Lang } from './i18n'

type L = Record<Lang, string>

export const KIND: Record<Machine['kind'], L> = {
  chest_freezer: { id: 'Freezer box', en: 'Chest freezer' },
  upright_freezer: { id: 'Freezer berdiri', en: 'Upright freezer' },
  ice_maker: { id: 'Mesin es', en: 'Ice maker' },
  cold_room: { id: 'Ruang pendingin', en: 'Cold room' },
}

export const CONDENSER: Record<Machine['condenser_type'], L> = {
  fan: { id: 'Kisi-kisi berkipas', en: 'Fan-cooled coils' },
  static: { id: 'Kisi-kisi tanpa kipas', en: 'Static coils' },
}

export const SIGNAL: Record<Signal, L & { unit: string }> = {
  temp_box_c: { id: 'Suhu dalam', en: 'Inside temperature', unit: '°C' },
  temp_condenser_c: { id: 'Suhu kisi-kisi belakang', en: 'Back-coil temperature', unit: '°C' },
  temp_discharge_c: { id: 'Suhu pipa buang kompresor', en: 'Compressor outlet temperature', unit: '°C' },
  current_rms_a: { id: 'Arus listrik', en: 'Current', unit: 'A' },
  vib_rms_g: { id: 'Getaran', en: 'Vibration', unit: 'g' },
}

export const EVENT: Record<CaseEventType, L> = {
  alert: { id: 'Gangguan terdeteksi', en: 'Fault detected' },
  safety_check: { id: 'Dicek di tabel keamanan', en: 'Checked against safety table' },
  step_shown: { id: 'Langkah dikirim ke pengelola', en: 'Step sent to caretaker' },
  step_done: { id: 'Pengelola menandai selesai', en: 'Caretaker marked done' },
  verify_start: { id: 'Sensor mulai memeriksa hasil', en: 'Sensors started checking' },
  verify_pass: { id: 'Perbaikan berhasil', en: 'Fix confirmed' },
  verify_fail: { id: 'Perbaikan belum berhasil', en: 'Fix not confirmed' },
  dispatched: { id: 'Teknisi dipanggil', en: 'Technician called' },
  technician_confirmed: { id: 'Teknisi mengonfirmasi', en: 'Technician confirmed' },
}

export const faultName = (rule: SafetyRule | undefined, code: string, lang: Lang) =>
  rule ? (lang === 'id' ? rule.fault_name_id : rule.fault_name_en) : code
