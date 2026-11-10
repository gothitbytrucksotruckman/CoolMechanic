// CoolMechanic data contract. Single source for TS types, runtime checks and JSON Schema.
// The real edge hub and Nexent agent must produce exactly these shapes (DESIGN §3, ADR-008, ADR-011).
import { z } from 'zod'

const Utc = z.iso.datetime()

export const ProvenanceSchema = z.enum(['SIMULATED', 'LAB-RIG', 'FIELD'])
export const SignalSchema = z.enum(['temp_box_c', 'temp_condenser_c', 'temp_discharge_c', 'current_rms_a', 'vib_rms_g'])
export const FaultCodeSchema = z.enum([
  'condenser_blocked', 'door_ajar', 'frost_buildup', 'interior_vent_blocked',
  'unstable_voltage',
  'electrical_part_fault', 'refrigerant_sealed_system', 'compressor_wear', 'fan_motor_failure', 'unknown_anomaly',
])
export const SafetyStatusSchema = z.enum(['allow', 'observe', 'deny'])
export const CaseStateSchema = z.enum(['OPEN', 'GUIDING', 'VERIFYING', 'RESOLVED', 'DISPATCHED'])

export type Provenance = z.infer<typeof ProvenanceSchema>
export type Signal = z.infer<typeof SignalSchema>
export type FaultCode = z.infer<typeof FaultCodeSchema>
export type SafetyStatus = z.infer<typeof SafetyStatusSchema>
export type CaseState = z.infer<typeof CaseStateSchema>

export const SIGNALS: readonly Signal[] = SignalSchema.options

export const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ice_depot', 'market_vendor', 'canteen', 'cooperative', 'lab']),
  area: z.string(),
  timezone: z.string(), // IANA, e.g. Asia/Jakarta
})

export const MachineSchema = z.object({
  id: z.string(),
  site_id: z.string(),
  name: z.string(),
  kind: z.enum(['chest_freezer', 'upright_freezer', 'ice_maker', 'cold_room']),
  brand: z.string(),
  model: z.string(),
  approx_age_years: z.number().nonnegative(),
  condenser_type: z.enum(['fan', 'static']),
  installed_at: Utc,
})

const SIGNAL_FLAG = {
  temp_box_c: 'box_ok', temp_condenser_c: 'condenser_ok', temp_discharge_c: 'discharge_ok',
  current_rms_a: 'current_ok', vib_rms_g: 'vib_ok',
} as const

export const ReadingSchema = z.object({
  machine_id: z.string(),
  ts_utc: Utc,
  provenance: ProvenanceSchema,
  temp_box_c: z.number().nullable(),        // °C
  temp_condenser_c: z.number().nullable(),  // °C
  temp_discharge_c: z.number().nullable(),  // °C
  current_rms_a: z.number().nullable(),     // A
  vib_rms_g: z.number().nullable(),         // g
  sensor_health: z.object({
    box_ok: z.boolean(), condenser_ok: z.boolean(), discharge_ok: z.boolean(), current_ok: z.boolean(), vib_ok: z.boolean(),
  }),
}).refine(
  (r) => SIGNALS.every((s) => r[s] !== null || !r.sensor_health[SIGNAL_FLAG[s]]),
  { message: 'a null signal value requires its sensor_health flag to be false' },
)

export const NormalBandSchema = z.object({
  machine_id: z.string(),
  signal: SignalSchema,
  low: z.number(),
  high: z.number(),
  source: ProvenanceSchema,
})

export const AlertSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  ts_utc: Utc,
  fault_code: FaultCodeSchema,
  confidence: z.number().min(0).max(1),
  severity: z.enum(['info', 'warning', 'critical']),
  source: z.enum(['edge', 'cloud']),
})

export const CaseSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  fault_code: FaultCodeSchema,
  safety_status: SafetyStatusSchema,
  state: CaseStateSchema,
  opened_at: Utc,
  closed_at: Utc.nullable(),
})

const Range = z.tuple([z.number(), z.number()])
const ev = <T extends string, P extends z.ZodType>(type: T, payload: P) =>
  z.object({ case_id: z.string(), ts_utc: Utc, type: z.literal(type), payload })
const VerifyResult = z.object({ signal: SignalSchema, values: z.array(z.number().nullable()), target_range: Range })

export const CaseEventSchema = z.discriminatedUnion('type', [
  ev('alert', z.object({ alert_id: z.string(), fault_code: FaultCodeSchema, confidence: z.number(), evidence_signal: SignalSchema })),
  ev('safety_check', z.object({ fault_code: FaultCodeSchema, status: SafetyStatusSchema })),
  ev('step_shown', z.object({ order: z.number().int() })),
  ev('step_done', z.object({ order: z.number().int() })),
  ev('verify_start', z.object({ signal: SignalSchema, target_range: Range, wait_minutes: z.number() })),
  ev('verify_pass', VerifyResult),
  ev('verify_fail', VerifyResult),
  ev('dispatched', z.object({ dispatch_id: z.string() })),
  ev('technician_confirmed', z.object({})),
])

const Bilingual = z.object({ text_id: z.string(), text_en: z.string() })

export const SafetyRuleSchema = z.object({
  fault_code: FaultCodeSchema,
  fault_name_id: z.string(),
  fault_name_en: z.string(),
  status: SafetyStatusSchema,
  steps: z.array(Bilingual.extend({ order: z.number().int() })),
  verify_rule: z.object({ signal: SignalSchema, target: z.literal('normal_band'), wait_minutes: z.number() }).nullable(),
  escalate_when: Bilingual,
})

export const GlobalRuleSchema = Bilingual.extend({ order: z.number().int() })

export const DispatchSchema = z.object({
  id: z.string(),
  case_id: z.string(),
  channel: z.enum(['whatsapp', 'sms', 'mock']),
  sent_at: Utc,
  delivery_status: z.enum(['queued', 'sent', 'delivered', 'failed']),
  message_text: z.string(),
})

export type Site = z.infer<typeof SiteSchema>
export type Machine = z.infer<typeof MachineSchema>
export type Reading = z.infer<typeof ReadingSchema>
export type NormalBand = z.infer<typeof NormalBandSchema>
export type Alert = z.infer<typeof AlertSchema>
export type Case = z.infer<typeof CaseSchema>
export type CaseEvent = z.infer<typeof CaseEventSchema>
export type CaseEventType = CaseEvent['type']
export type SafetyRule = z.infer<typeof SafetyRuleSchema>
export type GlobalRule = z.infer<typeof GlobalRuleSchema>
export type Dispatch = z.infer<typeof DispatchSchema>

// Keys match the file names in contract/examples/.
export const ALL_SCHEMAS: Record<string, z.ZodType> = {
  site: SiteSchema,
  machine: MachineSchema,
  reading: ReadingSchema,
  'normal-band': NormalBandSchema,
  alert: AlertSchema,
  case: CaseSchema,
  'case-event': CaseEventSchema,
  'safety-rule': SafetyRuleSchema,
  'global-rule': GlobalRuleSchema,
  dispatch: DispatchSchema,
}
