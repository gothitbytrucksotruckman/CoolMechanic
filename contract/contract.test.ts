import { readdirSync, readFileSync } from 'node:fs'
import { ALL_SCHEMAS, ReadingSchema } from './schemas'

test.each(readdirSync('contract/examples'))('example %s validates', (file) => {
  const name = file.replace('.json', '')
  const schema = ALL_SCHEMAS[name]
  expect(schema).toBeDefined()
  expect(schema.safeParse(JSON.parse(readFileSync(`contract/examples/${file}`, 'utf8'))).success).toBe(true)
})

test('every schema has an example', () => {
  const files = readdirSync('contract/examples').map((f) => f.replace('.json', ''))
  expect(files.sort()).toEqual(Object.keys(ALL_SCHEMAS).sort())
})

test('a null value requires its probe flag to be false', () => {
  const ok = JSON.parse(readFileSync('contract/examples/reading.json', 'utf8'))
  expect(ReadingSchema.safeParse({ ...ok, temp_box_c: null }).success).toBe(false)
  expect(ReadingSchema.safeParse({ ...ok, temp_box_c: null, sensor_health: { ...ok.sensor_health, box_ok: false } }).success).toBe(true)
})

test('deny rule has no steps and no verify rule', () => {
  const r = { fault_code: 'electrical_part_fault', fault_name_id: 'x', fault_name_en: 'x', status: 'deny', steps: [], verify_rule: null, escalate_when: { text_id: 'Segera', text_en: 'Immediately' } }
  expect(ALL_SCHEMAS['safety-rule'].safeParse(r).success).toBe(true)
})

test('case event payload must match its type', () => {
  const bad = { case_id: 'case-0001', ts_utc: '2026-11-10T01:00:00Z', type: 'step_done', payload: { dispatch_id: 'dsp-0001' } }
  expect(ALL_SCHEMAS['case-event'].safeParse(bad).success).toBe(false)
})
