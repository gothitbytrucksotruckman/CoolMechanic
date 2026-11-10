// Simulated seed data. Names are fictional ("Merek A–E", sites marked "simulasi") — no real product or customer.
// Safety rules copy the project doc's allow/deny table; wait times are starting guesses (ADR-009).
import type { GlobalRule, Machine, NormalBand, SafetyRule, Site } from '../contract/schemas'

const TZ = 'Asia/Jakarta'
const INSTALLED = '2026-10-01T00:00:00Z'

export const SITES: Site[] = [
  { id: 'site-01', name: 'Depot Es (simulasi)', type: 'ice_depot', area: 'Tarumajaya, Bekasi', timezone: TZ },
  { id: 'site-02', name: 'Lapak Ikan Pasar (simulasi)', type: 'market_vendor', area: 'Bekasi Kota', timezone: TZ },
  { id: 'site-03', name: 'Kantin Kampus (simulasi)', type: 'canteen', area: 'Cikarang, Bekasi', timezone: TZ },
]

export const MACHINES: Machine[] = [
  { id: 'm-01', site_id: 'site-01', name: 'Freezer Box Es 1', kind: 'chest_freezer', brand: 'Merek A', model: 'CF-300', approx_age_years: 12, condenser_type: 'static', installed_at: INSTALLED },
  { id: 'm-02', site_id: 'site-01', name: 'Mesin Es Balok', kind: 'ice_maker', brand: 'Merek B', model: 'IM-50', approx_age_years: 6, condenser_type: 'fan', installed_at: INSTALLED },
  { id: 'm-03', site_id: 'site-02', name: 'Freezer Ikan', kind: 'chest_freezer', brand: 'Merek C', model: 'CF-200', approx_age_years: 9, condenser_type: 'static', installed_at: INSTALLED },
  { id: 'm-04', site_id: 'site-03', name: 'Kulkas Minuman', kind: 'upright_freezer', brand: 'Merek D', model: 'UF-400', approx_age_years: 3, condenser_type: 'fan', installed_at: INSTALLED },
  { id: 'm-05', site_id: 'site-03', name: 'Ruang Pendingin Kantin', kind: 'cold_room', brand: 'Merek E', model: 'CR-1', approx_age_years: 15, condenser_type: 'fan', installed_at: INSTALLED },
]

export const KIND_PARAMS: Record<Machine['kind'], { setpoint_c: number; nominal_a: number }> = {
  chest_freezer: { setpoint_c: -18, nominal_a: 1.0 },
  upright_freezer: { setpoint_c: -18, nominal_a: 1.4 },
  ice_maker: { setpoint_c: -10, nominal_a: 2.5 },
  cold_room: { setpoint_c: 2, nominal_a: 4.0 },
}

const r2 = (x: number) => Math.round(x * 100) / 100

export function normalBands(m: Machine): NormalBand[] {
  const { setpoint_c: sp, nominal_a } = KIND_PARAMS[m.kind]
  const b = (signal: NormalBand['signal'], low: number, high: number): NormalBand => ({ machine_id: m.id, signal, low: r2(low), high: r2(high), source: 'SIMULATED' })
  return [
    b('temp_box_c', sp - 2.5, sp + 4),
    b('temp_condenser_c', 25, 46),
    b('temp_discharge_c', 25, 69),
    b('current_rms_a', 0, nominal_a * 1.15),
    b('vib_rms_g', 0, 0.35),
  ]
}

const UNPLUG = { text_id: 'Cabut steker mesin terlebih dahulu (hanya jika steker, stopkontak, dan lantai kering).', text_en: 'Unplug the machine first (only if the plug, socket and floor are dry).' }
const IMMEDIATELY = { text_id: 'Segera', text_en: 'Immediately' }
const steps = (...s: { text_id: string; text_en: string }[]) => s.map((x, i) => ({ order: i + 1, ...x }))
const deny = (fault_code: SafetyRule['fault_code'], fault_name_id: string, fault_name_en: string): SafetyRule =>
  ({ fault_code, fault_name_id, fault_name_en, status: 'deny', steps: [], verify_rule: null, escalate_when: IMMEDIATELY })

export const SAFETY_RULES: SafetyRule[] = [
  {
    fault_code: 'condenser_blocked', status: 'allow',
    fault_name_id: 'Kisi-kisi belakang tersumbat atau berdebu', fault_name_en: 'Condenser airflow blocked or dusty',
    steps: steps(
      UNPLUG,
      { text_id: 'Singkirkan kardus, plastik, atau barang yang menutupi kisi-kisi belakang.', text_en: 'Move boxes, plastic or other items away from the back coils.' },
      { text_id: 'Sikat debu dari bagian luar kisi-kisi dengan sikat kering.', text_en: 'Brush dust off the outside of the coils with a dry brush.' },
      { text_id: 'Colokkan kembali steker mesin.', text_en: 'Plug the machine back in.' },
    ),
    verify_rule: { signal: 'temp_condenser_c', target: 'normal_band', wait_minutes: 15 },
    escalate_when: { text_id: 'Masih panas setelah dibersihkan', text_en: 'Still hot after cleaning' },
  },
  {
    fault_code: 'door_ajar', status: 'allow',
    fault_name_id: 'Pintu tidak rapat atau karet pintu kotor', fault_name_en: 'Door ajar or dirty gasket',
    steps: steps(
      { text_id: 'Singkirkan barang yang mengganjal pintu.', text_en: 'Remove items blocking the door.' },
      { text_id: 'Lap karet pintu dengan kain lembap.', text_en: 'Wipe the rubber door seal with a damp cloth.' },
      { text_id: 'Tutup pintu sampai rapat.', text_en: 'Close the door fully.' },
    ),
    verify_rule: { signal: 'temp_box_c', target: 'normal_band', wait_minutes: 10 },
    escalate_when: { text_id: 'Kebocoran dingin masih terdeteksi (karet pintu perlu diganti)', text_en: 'Leak signature persists (gasket needs replacing)' },
  },
  {
    fault_code: 'frost_buildup', status: 'allow',
    fault_name_id: 'Bunga es menumpuk', fault_name_en: 'Frost or ice buildup',
    steps: steps(
      UNPLUG,
      { text_id: 'Pindahkan isi mesin ke wadah dingin lain.', text_en: 'Move the contents to another cold container.' },
      { text_id: 'Cairkan bunga es dengan handuk atau mangkuk berisi air hangat. Jangan pakai pisau, benda tajam, pemanas, atau pengering rambut.', text_en: 'Defrost with towels or a bowl of warm water. Never use knives, sharp tools, heat guns or hair dryers.' },
      { text_id: 'Keringkan bagian dalam, lalu colokkan kembali steker.', text_en: 'Dry the inside, then plug the machine back in.' },
    ),
    verify_rule: { signal: 'temp_box_c', target: 'normal_band', wait_minutes: 15 },
    escalate_when: { text_id: 'Bunga es cepat muncul lagi', text_en: 'Frost returns quickly' },
  },
  {
    fault_code: 'interior_vent_blocked', status: 'allow',
    fault_name_id: 'Lubang angin di dalam tertutup barang', fault_name_en: 'Interior vent blocked by stock',
    steps: steps({ text_id: 'Atur ulang barang agar tidak menutupi lubang kipas di dalam.', text_en: 'Rearrange stock away from the interior fan outlet.' }),
    verify_rule: { signal: 'temp_box_c', target: 'normal_band', wait_minutes: 15 },
    escalate_when: { text_id: 'Kipas terlihat tidak berputar', text_en: 'Fan appears stalled' },
  },
  {
    fault_code: 'unstable_voltage', status: 'observe',
    fault_name_id: 'Tegangan listrik tidak stabil', fault_name_en: 'Unstable supply voltage',
    steps: steps(
      { text_id: 'Periksa apakah ada alat listrik besar lain di stopkontak atau kabel roll yang sama.', text_en: 'Check for heavy appliances on the same socket or extension cord.' },
      { text_id: 'Tunggu sampai listrik stabil. Jangan membuka panel sekring/MCB.', text_en: 'Wait for stable power. Never open the breaker panel.' },
    ),
    verify_rule: { signal: 'current_rms_a', target: 'normal_band', wait_minutes: 15 },
    escalate_when: { text_id: 'Kompresor tidak mau menyala padahal tegangan normal', text_en: "Compressor won't start on normal voltage" },
  },
  deny('electrical_part_fault', 'Kerusakan komponen listrik (kapasitor, relay, bau terbakar)', 'Electrical part fault (capacitor, relay, burnt smell)'),
  deny('refrigerant_sealed_system', 'Kebocoran freon atau masalah sistem tertutup', 'Refrigerant leak or sealed-system problem'),
  deny('compressor_wear', 'Kompresor aus', 'Compressor mechanical wear'),
  deny('fan_motor_failure', 'Motor kipas rusak', 'Fan motor failure'),
  deny('unknown_anomaly', 'Pola tidak dikenal', 'Unknown anomaly'),
]

export const GLOBAL_RULES: GlobalRule[] = [
  { order: 1, text_id: 'Jika steker, stopkontak, atau lantai basah, jangan sentuh steker. Hubungi teknisi.', text_en: "If the plug, socket or floor is wet, don't touch the plug. Call a technician." },
  { order: 2, text_id: 'Selalu cabut steker sebelum membersihkan atau mencairkan bunga es.', text_en: 'Always unplug before any cleaning or defrosting.' },
  { order: 3, text_id: 'Jangan pernah membuka panel, melepas pelindung kipas, atau menyentuh kabel.', text_en: 'Never open a panel, remove a fan guard or touch wiring.' },
]
