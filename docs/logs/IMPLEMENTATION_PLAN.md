# CoolMechanic Dashboard (P1–P5, Minimum Submittable) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A judge-first dashboard running on a seeded, in-browser simulator that shows Sense → Diagnose → Guide → Verify → Dispatch and D1–D3 across six screens, runs offline and needs one command to start.

**Architecture:** One npm project at the repo root. `contract/` (Zod schemas) is the single source for types. `mock/` is the simulator and plays the edge hub + Nexent agent; it owns all case logic. `app/` (Vite root) talks only to a `DataSource` interface whose only implementation is `mockSource`. Screens display data; they never generate steps, statuses or messages.

**Tech Stack:** Node 24, Vite 8.3, React 19.3, TypeScript 7.0, Tailwind CSS 4.3 (`@tailwindcss/vite`), React Router 8.5 (hash routing), Recharts 3.10, Zod 4.6, `@fontsource/plus-jakarta-sans` 5.3, Vitest 5.1 + `@testing-library/react` 16.3 + jsdom 31.

**Spec:** `docs/logs/DESIGN.md` (approved 2026-11-10) and `docs/logs/DECISIONS.md` ADR-001…ADR-011. PRD: `docs/source/PRD.md`.

## Global Constraints

- Versions above were read from the npm registry on 2026-11-10. Zod 4 `z.toJSONSchema` and the Recharts `ReferenceArea`/`ReferenceLine`/`ComposedChart` exports were checked by running them. React Router 8 hash-router API: **[VERIFY]** against reactrouter.com in Task 6 and log the result in DECISIONS.md.
- No dependencies beyond the Tech Stack line. TanStack Query, MSW, jest-dom and a backend are out of scope.
- Every simulated entity carries or inherits `provenance: "SIMULATED"`. No number on screen is hard-coded. Unknown values are omitted, never invented.
- Deny and unknown cases never render caretaker steps; they show **"Jangan disentuh — teknisi dipanggil"**. The owner screens have no buttons that act on machines; only `/demo` has controls.
- Bahasa Indonesia is the default UI language and EN is the toggle. Owner-facing words follow `app/src/i18n/glossary.md` ("kisi-kisi belakang", not "kondensor").
- Status is never shown by colour alone: colour + icon + word. Every colour pair is WCAG AA.
- Every page renders `ErrorCard` when `useSourceData` returns `error`, never a blank page.
- Times are ISO-8601 UTC strings in data; they are displayed in the site's timezone (`Asia/Jakarta`).
- Secrets only in git-ignored `.env`; `.env.example` is committed. No phone numbers or emails in code or seed data.
- **Commits:** the owner commits. At each "Commit" step, stage the listed files and propose the message; don't run `git commit` unless the owner says so. Never stage `docs/source/`.
- Each task ends with a DEVLOG entry and moved TODO items (PRD §5 ritual).

## Review Focus

1. **Triggering a scenario on a machine that already has an open case.** It is refused with a visible reason on `/demo`; the simulator never runs two cases on one machine. Test in Task 4.
2. **Reset in the middle of a case (while playing, at 60×).** All cases, alerts and dispatches are cleared, the clock returns to the start, and the readings are identical to a fresh simulator. Test in Task 4.
3. **A stale case link** (for example `#/kasus/case-0001` after a reset). It shows "Kasus tidak ditemukan", not a crash. Test in Task 10.
4. **A case whose fault code has no SafetyRule.** It is treated as deny, with zero steps and "Jangan disentuh". Test in Task 10.
5. **An EN translation key that is missing.** The ID string shows, never the raw key. Test in Task 6.

---

## Contract refinements (ADR-011, proposed — owner OK needed before Task 2)

These sharpen the approved DESIGN §3 where it was underspecified:
1. `SafetyRule.verify_rule` becomes `{ signal, target: "normal_band", wait_minutes } | null` (null for deny rules). A fault-wide `[low, high]` can't fit machines with different setpoints. The concrete range is resolved per machine and stored in the `verify_start` event payload as `target_range`.
2. The `alert` CaseEvent payload gains `evidence_signal`, so deny cases know which signal to chart.
3. New `GlobalRule { order, text_id, text_en }` for the three "every fault" rules.
4. `NormalBand.source` uses the provenance enum.
5. The DataSource gains `listCaseEvents(limit)` (Overview feed) and `listGlobalRules()`, and `getCase` returns `null` for an unknown ID.

## Schedule (targets, planned back from 15 Dec 2026)

| Task | Target | Task | Target |
|---|---|---|---|
| 1 Setup | 11-12 | 8 Overview | 11-26 |
| 2 Contract | 11-13 | 9 Machine detail | 11-28 |
| 3 Simulator core | 11-16 | 10 Case detail | 12-02 |
| 4 Scenarios | 11-19 | 11 Safety rules | 12-03 |
| 5 DataSource | 11-20 | 12 Architecture | 12-05 |
| 6 App shell | 11-23 | 13 Polish + rehearsal | 12-09 |
| 7 Demo page | 11-24 | buffer | 12-10 → 12-15 |

---

## File map

```
package.json  vite.config.ts  vitest.config.ts  tsconfig.json  .env.example  README.md  .gitignore
contract/   schemas.ts  export-schema.ts  schema.json (generated)  API.md  examples/*.json  contract.test.ts
mock/       rng.ts  seed.ts  signals.ts  scenarios.ts  workorder.ts  simulator.ts  README.md
            simulator.test.ts  scenarios.test.ts  workorder.test.ts
app/        index.html
app/src/    main.tsx  App.tsx (routes)
  data/     types.ts  mockSource.ts  index.ts  context.tsx  useSourceData.ts  status.ts  architecture.json
  i18n/     i18n.tsx  id.json  en.json  glossary.md
  styles/   tokens.css  index.css
  components/ Header.tsx StatusChip.tsx SourceBadge.tsx JudgeNote.tsx ErrorCard.tsx EmptyState.tsx
              SensorChart.tsx CaseTimeline.tsx CaretakerSteps.tsx WorkOrderPreview.tsx
  pages/    Overview.tsx MachineDetail.tsx CaseDetail.tsx SafetyRules.tsx Architecture.tsx Demo.tsx
app/tests/  status.test.ts  mockSource.test.ts  i18n.test.tsx  StatusChip.test.tsx  pages.test.tsx  CaseDetail.test.tsx
```

---

### Task 1: Project setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.env.example`, `app/index.html`, `app/src/main.tsx`, `app/src/styles/index.css`, `app/tests/smoke.test.ts`
- Modify: `.gitignore` (append `node_modules/`, `dist/`, `.env`)

**Interfaces:**
- Produces: the scripts `npm run dev | build | preview | test | typecheck | contract:schema`

- [ ] **Step 1: Write `package.json`**
  - `"type": "module"`, `"private": true`.
  - Scripts:
    - `dev: "vite"`
    - `build: "tsc --noEmit && vite build"`
    - `preview: "vite preview"`
    - `test: "vitest run"`
    - `typecheck: "tsc --noEmit"`
    - `contract:schema: "node contract/export-schema.ts"`
  - Install exact versions from the Tech Stack line, plus `react-dom`, `@types/react`, `@types/react-dom` and `@vitejs/plugin-react@6.3.0`.
- [ ] **Step 2: Write `vite.config.ts`** with `root: 'app'`, `envDir: '..'`, `build: { outDir: '../dist', emptyOutDir: true }`, `base: './'` (so `dist/` works from any static host), and plugins `react()` and `tailwindcss()`.
- [ ] **Step 3: Write `vitest.config.ts`** at the repo root with `plugins: [react()]`, `test: { globals: true, environment: 'jsdom', include: ['contract/**/*.test.ts', 'mock/**/*.test.ts', 'app/**/*.test.{ts,tsx}'] }`.
- [ ] **Step 4: Write `tsconfig.json`** from the create-vite 9.3.4 `react-ts` `tsconfig.app.json`. Add `"resolveJsonModule": true`, set `"types": ["vite/client", "vitest/globals"]`, and set `include` to `["app", "contract", "mock", "*.ts"]`.
- [ ] **Step 5: Write the remaining files.**
  - `.env.example`: `VITE_DATA_SOURCE=mock` and `VITE_JUDGE_NOTES=on`.
  - `app/index.html`: `lang="id"`, title "CoolMechanic".
  - `app/src/styles/index.css`: `@import "tailwindcss";`.
  - `main.tsx`: renders an `<h1>CoolMechanic</h1>` placeholder.
  - `smoke.test.ts`: `expect(1 + 1).toBe(2)`.
- [ ] **Step 6: Verify.** Run `npm test`; expected `1 passed`. Run `npm run build`; it exits 0 and creates `dist/index.html`. Run `npm run dev`; the page shows "CoolMechanic".
- [ ] **Step 7: Commit:** `chore: project setup (vite, react, ts, tailwind, vitest)`

---

### Task 2: Data contract

**Files:**
- Create: `contract/schemas.ts`, `contract/export-schema.ts`, `contract/API.md`, `contract/examples/{site,machine,reading,normal-band,alert,case,case-event,safety-rule,global-rule,dispatch}.json`
- Test: `contract/contract.test.ts`

**Interfaces:**
- Produces: Zod schemas and inferred types. Every schema is `XSchema` with `type X = z.infer<typeof XSchema>`:
  - `Site`, `Machine`, `Reading`, `NormalBand`, `Alert`, `Case`, `CaseEvent`, `SafetyRule`, `GlobalRule`, `Dispatch`
  - Enums: `Provenance`, `Signal` (`'temp_box_c'|'temp_condenser_c'|'temp_discharge_c'|'current_rms_a'|'vib_rms_g'`), `FaultCode`, `SafetyStatus`, `CaseState`, `CaseEventType`
  - `export const SIGNALS: readonly Signal[]` and `export const ALL_SCHEMAS: Record<string, z.ZodType>`
- Fields are exactly DESIGN §3 plus the ADR-011 refinements:
  - `Reading` signal values are `number | null`.
  - `sensor_health` is `{ box_ok, condenser_ok, discharge_ok, current_ok, vib_ok }`, all booleans.
  - A refinement rejects a reading whose value is null while its flag is true.
- `CaseEvent` is a discriminated union on `type`. Payloads:
  - `alert {alert_id, fault_code, confidence, evidence_signal}`
  - `safety_check {fault_code, status}`
  - `step_shown {order}` and `step_done {order}`
  - `verify_start {signal, target_range: [number, number], wait_minutes}`
  - `verify_pass` and `verify_fail` `{signal, values: (number|null)[], target_range}`
  - `dispatched {dispatch_id}`
  - `technician_confirmed {}`

- [ ] **Step 1: Write the failing tests**

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { ALL_SCHEMAS, ReadingSchema } from './schemas'

test.each(readdirSync('contract/examples'))('example %s validates', (file) => {
  const name = file.replace('.json', '')
  const schema = ALL_SCHEMAS[name]
  expect(schema).toBeDefined()
  expect(schema.safeParse(JSON.parse(readFileSync(`contract/examples/${file}`, 'utf8'))).success).toBe(true)
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
```

- [ ] **Step 2: Run** `npx vitest run contract`. Expected: FAIL (the module `./schemas` is not found).
- [ ] **Step 3: Implement `contract/schemas.ts`** with `ALL_SCHEMAS` keys matching the example file names. Write one valid example per entity (`provenance: "SIMULATED"`, `Asia/Jakarta`, `case-0001`-style IDs).
- [ ] **Step 4: Implement `contract/export-schema.ts`.** It writes `contract/schema.json` as `{ [name]: z.toJSONSchema(schema) }` for every entry, imports `./schemas.ts` with the extension so Node 24 can strip types, and runs via `npm run contract:schema`.
- [ ] **Step 5: Write `contract/API.md`.** Use the endpoint list from DESIGN §3. One line per endpoint with its response type, plus "transport for /stream decided in P6".
- [ ] **Step 6: Verify.** Run `npx vitest run contract`; expected PASS. Run `npm run contract:schema`; it creates `contract/schema.json`. Run `npm run typecheck`; it exits 0.
- [ ] **Step 7: Commit:** `feat(contract): zod schemas, examples, JSON schema export, API.md`

---

### Task 3: Simulator core (seed, normal signals, clock)

**Files:**
- Create: `mock/rng.ts`, `mock/seed.ts`, `mock/signals.ts`, `mock/simulator.ts`, `mock/README.md`
- Test: `mock/simulator.test.ts`

**Interfaces:**
- Consumes: contract types and schemas (Task 2).
- Produces:

```ts
// mock/rng.ts
export function mulberry32(seed: number): () => number          // [0,1)
// mock/seed.ts
export const SITES: Site[]; export const MACHINES: Machine[]
export const SAFETY_RULES: SafetyRule[]; export const GLOBAL_RULES: GlobalRule[]
export const KIND_PARAMS: Record<Machine['kind'], { setpoint_c: number; nominal_a: number }>
export function normalBands(m: Machine): NormalBand[]
// mock/signals.ts
export function normalReading(m: Machine, tMs: number, rnd: () => number): Reading
// mock/simulator.ts
export type LiveEvent =
  | { kind: 'reading'; reading: Reading } | { kind: 'alert'; alert: Alert } | { kind: 'case'; case: Case }
  | { kind: 'case_event'; event: CaseEvent } | { kind: 'dispatch'; dispatch: Dispatch }
  | { kind: 'clock'; now: string } | { kind: 'reset' }
export type ScenarioId = 'condenser_blocked' | 'condenser_blocked_not_fixed' | 'electrical_part_fault' | 'unknown_anomaly'
export interface Simulator {
  now(): string
  readings(machineId: string, fromUtc: string, toUtc: string): Reading[]
  alerts(): Alert[]; cases(): Case[]; events(caseId: string): CaseEvent[]; dispatches(): Dispatch[]
  advance(minutes: number): void                // deterministic; one Reading per machine per virtual minute
  subscribe(fn: (e: LiveEvent) => void): () => void
  trigger(s: ScenarioId, machineId: string): { ok: true } | { ok: false; reason: 'busy' | 'unknown_machine' }  // body in Task 4
  play(): void; pause(): void; isPlaying(): boolean
  setSpeed(x: 1 | 10 | 60): void; speed(): 1 | 10 | 60
  reset(): void
}
export function createSimulator(opts?: { seed?: number; startUtc?: string }): Simulator
```

**Seed values** (all names are fictional; `installed_at` is `2026-10-01T00:00:00Z`; timezone is `Asia/Jakarta`):

| site id | name | area | type |
|---|---|---|---|
| site-01 | Depot Es (simulasi) | Tarumajaya, Bekasi | ice_depot |
| site-02 | Lapak Ikan Pasar (simulasi) | Bekasi Kota | market_vendor |
| site-03 | Kantin Kampus (simulasi) | Cikarang, Bekasi | canteen |

| id | site | name | kind | brand / model | age | condenser |
|---|---|---|---|---|---|---|
| m-01 | site-01 | Freezer Box Es 1 | chest_freezer | Merek A / CF-300 | 12 | static |
| m-02 | site-01 | Mesin Es Balok | ice_maker | Merek B / IM-50 | 6 | fan |
| m-03 | site-02 | Freezer Ikan | chest_freezer | Merek C / CF-200 | 9 | static |
| m-04 | site-03 | Kulkas Minuman | upright_freezer | Merek D / UF-400 | 3 | fan |
| m-05 | site-03 | Ruang Pendingin Kantin | cold_room | Merek E / CR-1 | 15 | fan |

`KIND_PARAMS`: chest_freezer {−18, 1.0}, upright_freezer {−18, 1.4}, ice_maker {−10, 2.5}, cold_room {2, 4.0}.

**Normal signal model** (illustrative, not physics; `mock/README.md` must say so). `t` = minutes since the epoch.
- Ambient = `29 + 3·sin(2π(hourWIB − 9)/24)`.
- The compressor runs on a 30-min cycle: on for minutes 0–17, off for 18–29.
- Box: a triangle wave between setpoint ±1.5 (falling while on, rising while off), noise ±0.2. Canteen machines (m-04, m-05) add +2.0 °C on minutes where `rnd() < 0.05` between 06:00 and 14:00 WIB.
- Condenser = ambient + (on: 12 for fan, 10 for static; off: 3) ± 0.3.
- Discharge = ambient + (on 35 / off 8) ± 0.3.
- Current = on: nominal × (1 ± 0.03); off: 0.02.
- Vibration = on: 0.25 ± 0.02; off: 0.01.
- Probe dropout: m-01 `temp_discharge_c` is `null` with `discharge_ok: false` for the 10 minutes starting 3 h before `startUtc`.

**Normal bands** (`source: 'SIMULATED'`): box `[sp−2.5, sp+4]`, condenser `[25, 46]`, discharge `[25, 69]`, current `[0, nominal×1.15]`, vibration `[0, 0.35]`.

**Clock:**
- `startUtc` defaults to `2026-11-10T01:00:00Z`, and the seed defaults to `20261110`.
- `createSimulator` pre-generates readings for `startUtc − 360 min` through `startUtc` inclusive (361 per machine) without emitting events. `now()` is `startUtc`.
- `advance(n)` steps one minute at a time. Each step emits `reading` ×5, then `clock`.
- `play()` uses `setInterval(() => advance(1), 60000 / speed)`. `setSpeed` restarts the interval if playing.
- Readings are capped at 24 h per machine. (`// shortcut: ring-buffer cap at 24h, raise if a longer history view is added`)

**Safety rules** (exact copy; ID drafted from the project doc, and the owner reviews the wording). Wait times: 10 for door_ajar, 15 for every other allow and observe rule (ADR-009; starting guesses). `UNPLUG_ID` = "Cabut steker mesin terlebih dahulu (hanya jika steker, stopkontak, dan lantai kering)." / EN "Unplug the machine first (only if the plug, socket and floor are dry)."

| fault_code | status | fault_name_id / fault_name_en | steps (ID / EN) | verify signal | escalate_when (ID / EN) |
|---|---|---|---|---|---|
| condenser_blocked | allow | Kisi-kisi belakang tersumbat atau berdebu / Condenser airflow blocked or dusty | 1 UNPLUG · 2 Singkirkan kardus, plastik, atau barang yang menutupi kisi-kisi belakang. / Move boxes, plastic or other items away from the back coils. · 3 Sikat debu dari bagian luar kisi-kisi dengan sikat kering. / Brush dust off the outside of the coils with a dry brush. · 4 Colokkan kembali steker mesin. / Plug the machine back in. | temp_condenser_c | Masih panas setelah dibersihkan / Still hot after cleaning |
| door_ajar | allow | Pintu tidak rapat atau karet pintu kotor / Door ajar or dirty gasket | 1 Singkirkan barang yang mengganjal pintu. / Remove items blocking the door. · 2 Lap karet pintu dengan kain lembap. / Wipe the rubber door seal with a damp cloth. · 3 Tutup pintu sampai rapat. / Close the door fully. | temp_box_c | Kebocoran dingin masih terdeteksi (karet pintu perlu diganti) / Leak signature persists (gasket needs replacing) |
| frost_buildup | allow | Bunga es menumpuk / Frost or ice buildup | 1 UNPLUG · 2 Pindahkan isi mesin ke wadah dingin lain. / Move the contents to another cold container. · 3 Cairkan bunga es dengan handuk atau mangkuk berisi air hangat. Jangan pakai pisau, benda tajam, pemanas, atau pengering rambut. / Defrost with towels or a bowl of warm water. Never use knives, sharp tools, heat guns or hair dryers. · 4 Keringkan bagian dalam, lalu colokkan kembali steker. / Dry the inside, then plug the machine back in. | temp_box_c | Bunga es cepat muncul lagi / Frost returns quickly |
| interior_vent_blocked | allow | Lubang angin di dalam tertutup barang / Interior vent blocked by stock | 1 Atur ulang barang agar tidak menutupi lubang kipas di dalam. / Rearrange stock away from the interior fan outlet. | temp_box_c | Kipas terlihat tidak berputar / Fan appears stalled |
| unstable_voltage | observe | Tegangan listrik tidak stabil / Unstable supply voltage | 1 Periksa apakah ada alat listrik besar lain di stopkontak atau kabel roll yang sama. / Check for heavy appliances on the same socket or extension cord. · 2 Tunggu sampai listrik stabil. Jangan membuka panel sekring/MCB. / Wait for stable power. Never open the breaker panel. | current_rms_a | Kompresor tidak mau menyala padahal tegangan normal / Compressor won't start on normal voltage |
| electrical_part_fault | deny | Kerusakan komponen listrik (kapasitor, relay, bau terbakar) / Electrical part fault (capacitor, relay, burnt smell) | none | null | Segera / Immediately |
| refrigerant_sealed_system | deny | Kebocoran freon atau masalah sistem tertutup / Refrigerant leak or sealed-system problem | none | null | Segera / Immediately |
| compressor_wear | deny | Kompresor aus / Compressor mechanical wear | none | null | Segera / Immediately |
| fan_motor_failure | deny | Motor kipas rusak / Fan motor failure | none | null | Segera / Immediately |
| unknown_anomaly | deny | Pola tidak dikenal / Unknown anomaly | none | null | Segera / Immediately |

`GLOBAL_RULES`:
1. "Jika steker, stopkontak, atau lantai basah, jangan sentuh steker. Hubungi teknisi." / "If the plug, socket or floor is wet, don't touch the plug. Call a technician."
2. "Selalu cabut steker sebelum membersihkan atau mencairkan bunga es." / "Always unplug before any cleaning or defrosting."
3. "Jangan pernah membuka panel, melepas pelindung kipas, atau menyentuh kabel." / "Never open a panel, remove a fan guard or touch wiring."

- [ ] **Step 1: Write the failing tests** in `mock/simulator.test.ts`:

```ts
const H6 = 6 * 60
test('same seed gives identical readings', () => {
  const a = createSimulator(), b = createSimulator(); a.advance(60); b.advance(60)
  expect(a.readings('m-01', '2026-11-09T00:00:00Z', a.now())).toEqual(b.readings('m-01', '2026-11-09T00:00:00Z', b.now()))
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
  expect(gap.every(r => r.temp_discharge_c === null && !r.sensor_health.discharge_ok)).toBe(true)
})
test('advance emits 5 readings then a clock event per minute', () => {
  const s = createSimulator(); const kinds: string[] = []; s.subscribe(e => kinds.push(e.kind)); s.advance(2)
  expect(kinds).toEqual(['reading','reading','reading','reading','reading','clock','reading','reading','reading','reading','reading','clock'])
})
test('seed has 3 sites, 5 machines, 10 rules and deny rules have no steps', () => {
  expect(SITES).toHaveLength(3); expect(MACHINES).toHaveLength(5); expect(SAFETY_RULES).toHaveLength(10)
  for (const r of SAFETY_RULES.filter(r => r.status === 'deny')) { expect(r.steps).toEqual([]); expect(r.verify_rule).toBeNull() }
})
```

- [ ] **Step 2: Run** `npx vitest run mock/simulator.test.ts`. Expected: FAIL (the modules are missing).
- [ ] **Step 3: Implement** `rng.ts`, `seed.ts`, `signals.ts`, and `simulator.ts` without scenario logic. In this task, `trigger` returns `{ ok: false, reason: 'unknown_machine' }` for unknown IDs and is otherwise a stub that Task 4 fills in. Write `mock/README.md`: signals are illustrative, not physics, and recorded rig data replaces them.
- [ ] **Step 4: Run** `npx vitest run mock`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(mock): seeded simulator with normal cycling and virtual clock`

---

### Task 4: Scenarios, case engine and work orders

**Files:**
- Create: `mock/scenarios.ts`, `mock/workorder.ts`
- Modify: `mock/simulator.ts` (`trigger`, per-minute scenario step, `reset`)
- Test: `mock/scenarios.test.ts`, `mock/workorder.test.ts`

**Interfaces:**
- Consumes: Task 3.
- Produces:

```ts
// mock/workorder.ts
export interface WorkOrderInput {
  caseId: string; site: Site; machine: Machine; faultNameId: string
  evidenceLine?: string; triedStepsId: string[] | null   // null = deny
  bring?: string
}
export function buildWorkOrder(i: WorkOrderInput): string
export function evidenceLine(signal: Signal, value: number | null, band: NormalBand): string | undefined
```

**Scenario signal deltas.** `m` = minutes since trigger; the first tick after `trigger()` is m=1. Deny and failed scenarios keep their deltas active while the case stays open. `fix` = the minute of `step_done`; after a successful fix, multiply the deltas by `exp(−(m − fix)/3)`.

| scenario | deltas | alert at | severity, confidence | evidence_signal |
|---|---|---|---|---|
| condenser_blocked | condenser `+min(0.8m, 20)`; discharge `+min(1.2m, 25)`; current `×(1 + min(0.02m, 0.3))` when on; box `+min(max(0, 0.08(m−20)), 4)` | m=8 | warning, 0.87 | temp_condenser_c |
| condenser_blocked_not_fixed | same, and the fix has no effect | m=8 | warning, 0.87 | temp_condenser_c |
| electrical_part_fault | current `+1.5×nominal` in the first 2 on-minutes of each cycle; vib `+0.3` when on | m=5 | critical, 0.82 | current_rms_a |
| unknown_anomaly | vib `+min(0.005m, 0.2)` | m=10 | warning, 0.41 | vib_rms_g |

**Case engine** (all at virtual-minute ticks; IDs `al-0001`, `case-0001`, `dsp-0001`, zero-padded and incrementing):
1. **At alert time:**
   - emit `Alert` (`source: 'edge'`)
   - emit `Case` (OPEN)
   - add `alert` and `safety_check` events
   - Rule missing → treat as deny.
2. **allow/observe:**
   - add one `step_shown` per step
   - set state to GUIDING
   - at alert + 6 min, add one `step_done` per step (the simulated caretaker)
   - apply the fix
   - add `verify_start {signal, target_range: machine band, wait_minutes}` and set state to VERIFYING
3. **At `step_done + wait_minutes`:**
   - take the last 5 readings of the signal
   - pass iff all are non-null and inside `target_range`
   - **pass:** add `verify_pass`, set RESOLVED with `closed_at`, and end the scenario
   - **fail:** add `verify_fail`, then dispatch
4. **deny, or dispatch after fail:**
   - create `Dispatch {channel: 'mock', delivery_status: 'sent', message_text: buildWorkOrder(...)}`
   - add a `dispatched` event
   - set state to DISPATCHED (stays open)
5. **`trigger` refusal:** returns `{ok:false, reason:'busy'}` when the machine has an open case or a running scenario.
6. **`reset()`:**
   - stop play
   - clear everything
   - rebuild from the seed
   - emit `{kind:'reset'}`

Mock-only `BRING` map:
- condenser_* → "Sikat kondensor dan termometer"
- electrical_part_fault → "Kapasitor start dan relay start sesuai tipe kompresor"
- unknown_anomaly → none, so the line is omitted

**Work-order format** (PRD §9.5). Lines in order; a line whose value is undefined is omitted:

```
[CoolMechanic] Order servis #{caseId}
Lokasi: {site.name}, {site.area}
Mesin: {brand} {model} ({kind_id}, ±{age} th)
Dugaan kerusakan: {faultNameId}
Bukti sensor: {evidenceLine}
Sudah dicoba pengelola: {triedStepsId.join('; ') | "tidak ada — dilarang untuk keamanan"}
Bawa: {bring}
Balas pesan ini untuk konfirmasi.
```

`kind_id`: chest_freezer "freezer box", upright_freezer "freezer berdiri", ice_maker "mesin es", cold_room "ruang pendingin".

`evidenceLine` reads `"{label_id} {value} {unit} (normal {low}–{high} {unit})"`, with 1 decimal (2 for vib). It returns `undefined` when the value is null. Labels:
- temp_box_c "Suhu dalam" °C
- temp_condenser_c "Suhu kisi-kisi belakang" °C
- temp_discharge_c "Suhu pipa buang kompresor" °C
- current_rms_a "Arus listrik" A
- vib_rms_g "Getaran" g

- [ ] **Step 1: Write the failing tests**

```ts
// mock/scenarios.test.ts
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
test('box temperature is still in band when the condenser alert fires', () => {
  const s = createSimulator(); s.trigger('condenser_blocked', 'm-01'); s.advance(8)
  const box = normalBands(MACHINES[0]).find(b => b.signal === 'temp_box_c')!
  const r = s.readings('m-01', s.now(), s.now())[0]
  expect(r.temp_box_c!).toBeLessThanOrEqual(box.high); expect(s.alerts()).toHaveLength(1)
})
test('every emitted entity validates against the contract', () => {
  const s = createSimulator(); const seen: LiveEvent[] = []; s.subscribe(e => seen.push(e))
  for (const [sc, m] of [['condenser_blocked','m-01'],['condenser_blocked_not_fixed','m-02'],['electrical_part_fault','m-04'],['unknown_anomaly','m-05']] as const) s.trigger(sc, m)
  s.advance(40)
  const schema = { reading: ReadingSchema, alert: AlertSchema, case: CaseSchema, case_event: CaseEventSchema, dispatch: DispatchSchema } as const
  for (const e of seen) if (e.kind in schema) expect(schema[e.kind as keyof typeof schema].safeParse(Object.values(e)[1]).success).toBe(true)
})
test('Review Focus 1: busy machine is refused', () => {
  const s = createSimulator(); s.trigger('electrical_part_fault', 'm-03'); s.advance(10)
  expect(s.trigger('condenser_blocked', 'm-03')).toEqual({ ok: false, reason: 'busy' })
  expect(s.cases()).toHaveLength(1)
})
test('Review Focus 2: reset mid-case equals a fresh simulator', () => {
  const s = createSimulator(); s.setSpeed(60); s.play(); s.trigger('condenser_blocked', 'm-01'); s.advance(20); s.reset()
  const fresh = createSimulator()
  expect(s.cases()).toEqual([]); expect(s.alerts()).toEqual([]); expect(s.dispatches()).toEqual([])
  expect(s.isPlaying()).toBe(false); expect(s.now()).toBe(fresh.now())
  expect(s.readings('m-01', '2026-11-09T00:00:00Z', s.now())).toEqual(fresh.readings('m-01', '2026-11-09T00:00:00Z', fresh.now()))
})

// mock/workorder.test.ts
test('deny order with unknown bring and null evidence omits those lines', () => {
  const txt = buildWorkOrder({ caseId: 'case-0001', site: SITES[2], machine: MACHINES[3], faultNameId: 'Pola tidak dikenal', triedStepsId: null })
  expect(txt.split('\n')).toEqual([
    '[CoolMechanic] Order servis #case-0001', 'Lokasi: Kantin Kampus (simulasi), Cikarang, Bekasi',
    'Mesin: Merek D UF-400 (freezer berdiri, ±3 th)', 'Dugaan kerusakan: Pola tidak dikenal',
    'Sudah dicoba pengelola: tidak ada — dilarang untuk keamanan', 'Balas pesan ini untuk konfirmasi.'])
})
test('evidenceLine formats and returns undefined for null', () => {
  const band = { machine_id: 'm-01', signal: 'temp_condenser_c', low: 25, high: 46, source: 'SIMULATED' } as const
  expect(evidenceLine('temp_condenser_c', 52.34, band)).toBe('Suhu kisi-kisi belakang 52.3 °C (normal 25.0–46.0 °C)')
  expect(evidenceLine('temp_condenser_c', null, band)).toBeUndefined()
})
```
- [ ] **Step 2: Run** `npx vitest run mock`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** `scenarios.ts` (the delta functions and the per-scenario script table), `workorder.ts`, and the engine in `simulator.ts`.
- [ ] **Step 4: Run** `npx vitest run mock`. Expected: all PASS.
- [ ] **Step 5: Commit:** `feat(mock): four scenarios, closed-loop verify, work orders`

---

### Task 5: DataSource, live hook, status derivation

**Files:**
- Create: `app/src/data/types.ts`, `mockSource.ts`, `index.ts`, `context.tsx`, `useSourceData.ts`, `status.ts`
- Test: `app/tests/status.test.ts`, `app/tests/mockSource.test.ts`

**Interfaces:**
- Consumes: `Simulator`, `LiveEvent`, `ScenarioId`, the seed exports and the contract types.
- Produces:

```ts
// types.ts
export interface DemoControls { play(): void; pause(): void; isPlaying(): boolean; setSpeed(x: 1|10|60): void; speed(): 1|10|60
  trigger(s: ScenarioId, machineId: string): { ok: true } | { ok: false; reason: 'busy' | 'unknown_machine' }; advance(min: number): void; reset(): void }
export interface CaseBundle { case: Case; events: CaseEvent[]; dispatch?: Dispatch }
export interface DataSource {
  listSites(): Promise<Site[]>; listMachines(): Promise<Machine[]>
  getReadings(machineId: string, fromUtc: string, toUtc: string): Promise<Reading[]>
  listNormalBands(machineId: string): Promise<NormalBand[]>
  listCases(filter?: { machineId?: string }): Promise<Case[]>
  getCase(id: string): Promise<CaseBundle | null>          // null = not found
  listCaseEvents(limit: number): Promise<CaseEvent[]>       // newest first, across cases
  listSafetyRules(): Promise<SafetyRule[]>; listGlobalRules(): Promise<GlobalRule[]>
  subscribe(fn: (e: LiveEvent) => void): () => void
  now(): string
  demo?: DemoControls
}
// mockSource.ts
export function createMockSource(sim?: Simulator): DataSource
// index.ts — reads import.meta.env.VITE_DATA_SOURCE (default 'mock'); 'http' throws Error('httpSource arrives in P6')
export function createDataSource(kind?: string): DataSource
// context.tsx
export function DataSourceProvider(p: { value: DataSource; children: ReactNode }): JSX.Element
export function useDataSource(): DataSource
// useSourceData.ts — reruns load on mount, on deps change and on every LiveEvent (throttled to 1 per 250 ms)
export function useSourceData<T>(load: (ds: DataSource) => Promise<T>, deps: unknown[]): { data?: T; error?: Error; loading: boolean }
// status.ts
export type StatusKey = 'aman' | 'waspada' | 'bahaya' | 'teknisi'
export function machineStatus(machineCases: Case[]): StatusKey
```

- [ ] **Step 1: Write the failing tests**

```ts
// status.test.ts — DESIGN §5.1, first match wins
const c = (safety_status: SafetyStatus, state: CaseState, closed = false): Case => ({ id: 'c', machine_id: 'm', fault_code: 'condenser_blocked', safety_status, state, opened_at: 'x', closed_at: closed ? 'y' : null })
test.each([
  [[], 'aman'], [[c('allow', 'RESOLVED', true)], 'aman'],
  [[c('allow', 'GUIDING')], 'waspada'], [[c('observe', 'VERIFYING')], 'waspada'],
  [[c('deny', 'OPEN')], 'bahaya'], [[c('deny', 'DISPATCHED')], 'teknisi'], [[c('allow', 'DISPATCHED')], 'teknisi'],
  [[c('allow', 'GUIDING'), c('deny', 'OPEN')], 'bahaya'], [[c('allow', 'GUIDING'), c('allow', 'DISPATCHED')], 'teknisi'],
])('%j → %s', (cases, expected) => expect(machineStatus(cases as Case[])).toBe(expected))

// mockSource.test.ts
test('getCase bundles events and dispatch; unknown id is null', async () => {
  const ds = createMockSource(); ds.demo!.trigger('electrical_part_fault', 'm-04'); ds.demo!.advance(10)
  const [first] = await ds.listCases(); const b = await ds.getCase(first.id)
  expect(b!.events.map(e => e.type)).toContain('dispatched'); expect(b!.dispatch).toBeDefined()
  expect(await ds.getCase('case-9999')).toBeNull()
})
test('http source is not available yet', () => expect(() => createDataSource('http')).toThrow('P6'))
```

- [ ] **Step 2: Run** `npx vitest run app/tests/status.test.ts app/tests/mockSource.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the files. `index.ts` carries `// shortcut: only mock exists; add httpSource in P6`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(data): DataSource interface, mock adapter, status derivation`

---

### Task 6: App shell, tokens, i18n, shared components

**Files:**
- Create: `app/src/styles/tokens.css`, `app/src/i18n/{i18n.tsx,id.json,en.json,glossary.md}`, `app/src/components/{Header,StatusChip,SourceBadge,JudgeNote,ErrorCard,EmptyState}.tsx`, `app/src/App.tsx`, and the six page files as placeholders
- Modify: `app/src/main.tsx`, `app/src/styles/index.css`
- Test: `app/tests/i18n.test.tsx`, `app/tests/StatusChip.test.tsx`

**Interfaces:**
- Produces:

```ts
export function I18nProvider(p: { children: ReactNode; initial?: 'id' | 'en' }): JSX.Element
export function useT(): { t: (key: string) => string; lang: 'id' | 'en'; setLang(l: 'id' | 'en'): void }  // missing en → id → key never shown (returns id string)
export function StatusChip(p: { status: StatusKey }): JSX.Element     // icon (aria-hidden) + word; colour from tokens
export function SourceBadge(p: { provenance: Provenance }): JSX.Element
export function JudgeNote(p: { d: 'D1' | 'D2' | 'D3'; children: ReactNode }): JSX.Element | null  // null when VITE_JUDGE_NOTES !== 'on'
export function ErrorCard(p: { error: Error }): JSX.Element
export function EmptyState(p: { title: string; reason: string }): JSX.Element
```

- Routes (hash) in `App.tsx`: `/` Overview, `/mesin/:id` MachineDetail, `/kasus/:id` CaseDetail, `/aturan` SafetyRules, `/arsitektur` Architecture, `/demo` Demo. The nav links Ringkasan, Arsitektur and Aturan Keamanan. `/demo` is not linked.
- **[VERIFY]** the React Router 8 hash-router API (`createHashRouter` + `RouterProvider`, or the v8 equivalent) at reactrouter.com. Log the doc link and date as ADR-012.
- The header contains:
  - the brand
  - nav links
  - `SourceBadge`, showing the latest reading's provenance
  - the ID/EN toggle
  - the light/dark toggle, which sets `data-theme` on `<html>`
  - "Terakhir diperbarui {time WIB}", taken from `ds.now()`
- `main.tsx`:
  - imports `@fontsource/plus-jakarta-sans` (weights 400/600/700) so the font works offline
  - wraps everything in `DataSourceProvider(createDataSource())` and `I18nProvider`
  - log the font package choice in ADR-012
- `tokens.css`:
  - `:root` (light) and `[data-theme=dark]` variables for surfaces, text and borders
  - the four status colours `--aman`, `--waspada`, `--bahaya`, `--teknisi`, each with an `-fg` pair
  - one colour per signal
  - `--radius: 12px`; spacing on the 8 px grid
  - `font-variant-numeric: tabular-nums` on numbers
  - wired into Tailwind with `@theme`
- Status icons are inline SVG: check (aman), eye (waspada), hand (bahaya), wrench (teknisi).
- Status words:
  - ID: "Aman", "Waspada", "Jangan disentuh", "Teknisi dipanggil"
  - EN: "OK", "Watch", "Don't touch", "Technician called"
- `glossary.md` maps the jargon to the owner word: kondensor → kisi-kisi belakang; evaporator → bagian pendingin di dalam; refrigeran/freon → freon; kompresor → kompresor (mesin di bawah belakang); gasket → karet pintu.

- [ ] **Step 1: Write the failing tests**

```tsx
// i18n.test.tsx — Review Focus 5
test('missing EN key falls back to the ID string', () => {
  const Probe = () => <span>{useT().t('test.only_in_id')}</span>
  render(<I18nProvider initial="en"><Probe /></I18nProvider>)
  expect(screen.getByText('Hanya ada di ID')).toBeTruthy()
})
// StatusChip.test.tsx
test.each([['aman','Aman'],['waspada','Waspada'],['bahaya','Jangan disentuh'],['teknisi','Teknisi dipanggil']] as const)
('%s shows icon and word', (s, word) => {
  const { container } = render(<I18nProvider><StatusChip status={s} /></I18nProvider>)
  expect(screen.getByText(word)).toBeTruthy(); expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})
```

`id.json` contains `"test": { "only_in_id": "Hanya ada di ID" }`, and `en.json` doesn't.

- [ ] **Step 2: Run** `npx vitest run app/tests/i18n.test.tsx app/tests/StatusChip.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Run** the tests (PASS), `npm run typecheck` (exit 0) and `npm run dev`. All six routes render their placeholder headings, and both toggles work.
- [ ] **Step 5: Commit:** `feat(app): shell, tokens, i18n, status chip, header`

---

### Task 7: Demo page (`/demo`)

**Files:**
- Modify: `app/src/pages/Demo.tsx`

**Interfaces:**
- Consumes: `useDataSource().demo` and `listMachines`.

- [ ] **Step 1: Implement the page**
  - Banner "Demo control — simulated" (fixed EN + ID text).
  - Machine picker.
  - Four scenario buttons. A refused trigger shows the reason inline, e.g. "Mesin sedang punya kasus terbuka" for `busy` (Review Focus 1).
  - Play/pause, a 1×/10×/60× segmented control, and a "Reset" button with a confirm step.
  - If `ds.demo` is undefined, show `EmptyState` with "Kontrol demo hanya tersedia untuk data simulasi".
- [ ] **Step 2: Check it manually.** On `/#/demo`, trigger `condenser_blocked` on m-01 at 60×. Within about 30 s, the console has no errors. A second trigger on m-01 shows the busy reason.
- [ ] **Step 3: Commit:** `feat(app): demo control route`

---

### Task 8: Overview (Ringkasan)

**Files:**
- Modify: `app/src/pages/Overview.tsx`
- Test: `app/tests/pages.test.tsx`

**Interfaces:**
- Consumes: `useSourceData`, `machineStatus`, `StatusChip`, `JudgeNote`.

- [ ] **Step 1: Write the failing test** (renders with a `createMockSource()` whose demo has run `electrical_part_fault` on m-04 plus `advance(10)`, wrapped in a MemoryRouter or the router equivalent):

```tsx
test('overview counts come from data', async () => {
  renderWithSource(<Overview />, ds)
  expect((await screen.findByTestId('count-teknisi')).textContent).toBe('1')
  expect(screen.getByTestId('count-aman').textContent).toBe('4')
  expect(screen.getAllByTestId('machine-card')[0].textContent).toContain('Kulkas Minuman')  // attention first
})
```

`renderWithSource(ui, ds)` lives in `app/tests/render.tsx`. It wraps the UI in `DataSourceProvider`, `I18nProvider` and the router.

- [ ] **Step 2: Run** `npx vitest run app/tests/pages.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the page**
  - Four status count tiles (`data-testid="count-{status}"`).
  - Machine cards (`data-testid="machine-card"`), sorted bahaya > teknisi > waspada > aman. Each shows name, site, brand + model, `±{age} th`, condenser type ("kipas"/"statis"), the `StatusChip`, the last reading time, and links to `#/mesin/:id`.
  - The latest 10 case events, each linking to its case. With none, show `EmptyState` "Belum ada kasus" / "Semua mesin bekerja normal sejak simulasi dimulai."
  - "Selesai di tempat" (RESOLVED count) vs "Teknisi dipanggil" (DISPATCHED count), counted since the simulation started.
  - `JudgeNote d="D1"`: "Merek dan umur mesin campuran — sensor jepit untuk mesin apa saja."
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(app): overview page`

---

### Task 9: Machine detail + SensorChart

**Files:**
- Create: `app/src/components/SensorChart.tsx`
- Modify: `app/src/pages/MachineDetail.tsx`, `app/tests/pages.test.tsx`

**Interfaces:**
- Produces:

```ts
export function SensorChart(p: {
  readings: Reading[]; signal: Signal; band?: { low: number; high: number }
  markers?: { ts_utc: string; label: string; dashed?: boolean }[]
  provenance: Provenance; height?: number
}): JSX.Element
```

Build it from Recharts `ResponsiveContainer > ComposedChart`:
- a `Line` with `connectNulls={false}` and `isAnimationActive={false}`
- a `ReferenceArea` (y1 = low, y2 = high) for the band
- a `ReferenceLine` per marker
- the `SourceBadge` in the chart's corner

When the window contains null values, show the caption "sensor lepas". Use large axis labels (≥ 14 px), so they stay readable on a projector.

- [ ] **Step 1: Write the failing test.** jsdom can't render chart sizes, so this tests the page, not the SVG. `ds` is the Task 8 fixture (`electrical_part_fault` on m-04, `advance(10)`), and the page renders brand and model in one element:

```tsx
test('machine detail shows profile, sensor health and case history', async () => {
  renderWithSource(<MachineDetail />, ds, '/mesin/m-04')
  expect(await screen.findByText('Merek D UF-400')).toBeTruthy()
  expect(screen.getByTestId('sensor-health').textContent).toContain('5/5')
  expect(screen.getAllByTestId('case-row')).toHaveLength(1)
})
test('unknown machine id shows an empty state', async () => {
  renderWithSource(<MachineDetail />, ds, '/mesin/m-99')
  expect(await screen.findByText('Mesin tidak ditemukan')).toBeTruthy()
})
```

- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement the page**
  - five `SensorChart`s covering the last 3 virtual hours, each with its band
  - a dashed marker at each case's alert time
  - sensor health "{ok}/5 probe normal"
  - an equipment profile (kind, brand, model, age, condenser, installed)
  - case history rows (`data-testid="case-row"`) linking to `#/kasus/:id`
  - `JudgeNote d="D1"`
- [ ] **Step 4: Run** the tests (PASS). In `npm run dev`, m-01's discharge chart shows the 10-minute gap labelled "sensor lepas".
- [ ] **Step 5: Commit:** `feat(app): machine detail with live sensor charts`

---

### Task 10: Case detail (the hero screen)

**Files:**
- Create: `app/src/components/{CaseTimeline,CaretakerSteps,WorkOrderPreview}.tsx`
- Modify: `app/src/pages/CaseDetail.tsx`
- Test: `app/tests/CaseDetail.test.tsx`

**Interfaces:**
- Produces:

```ts
export function CaretakerSteps(p: { safetyStatus: SafetyStatus; rule: SafetyRule | undefined; events: CaseEvent[] }): JSX.Element
// renders steps ONLY when safetyStatus is allow|observe AND rule exists; otherwise the
// "Jangan disentuh — teknisi dipanggil" block with zero <li>. Each step shows ✓ + time when a step_done with its order exists.
export function CaseTimeline(p: { case: Case; events: CaseEvent[]; rule?: SafetyRule }): JSX.Element
// five columns Sense/Diagnose/Guide/Verify/Dispatch, each with the timestamp of its first event or
// "tidak diperlukan" (Dispatch on RESOLVED; Verify on deny) / "dilewati: daftar larangan" (Guide on deny) / "menunggu" (pending)
export function WorkOrderPreview(p: { dispatch: Dispatch }): JSX.Element   // <pre> of message_text verbatim + channel, sent_at, delivery_status
```

Before/after chart:
- `SensorChart` for `verify_start.signal ?? alert.evidence_signal`
- range: from `opened_at − 30 min` to `closed_at ?? now`
- band: `verify_start.target_range ?? the machine's NormalBand for that signal`
- markers: a dashed "Terdeteksi" at the alert, and "Perbaikan" at the last `step_done`

- [ ] **Step 1: Write the failing tests**

```tsx
const allowRule = SAFETY_RULES.find(r => r.fault_code === 'condenser_blocked')!
test('deny case renders zero steps even when the rule data contains steps', () => {
  render(<I18nProvider><CaretakerSteps safetyStatus="deny" rule={allowRule} events={[]} /></I18nProvider>)
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.getByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
})
test('Review Focus 4: missing rule is treated as deny', () => {
  render(<I18nProvider><CaretakerSteps safetyStatus="allow" rule={undefined} events={[]} /></I18nProvider>)
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.getByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
})
test.each(['electrical_part_fault', 'unknown_anomaly'] as const)('%s page: no steps, work order shown', async (sc) => {
  const ds = createMockSource(); ds.demo!.trigger(sc, 'm-04'); ds.demo!.advance(15)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect(await screen.findByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
  expect(screen.queryAllByTestId('caretaker-step')).toHaveLength(0)
  expect(screen.getByTestId('work-order').textContent).toContain('[CoolMechanic] Order servis #case-0001')
  expect(screen.getByTestId('step-guide').textContent).toContain('dilewati: daftar larangan')
})
test('resolved case shows 4 done steps and no dispatch', async () => {
  const ds = createMockSource(); ds.demo!.trigger('condenser_blocked', 'm-01'); ds.demo!.advance(40)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect(await screen.findAllByTestId('caretaker-step')).toHaveLength(4)
  expect(screen.getByTestId('step-dispatch').textContent).toContain('tidak diperlukan')
  expect(screen.queryByTestId('work-order')).toBeNull()
})
test('Review Focus 3: stale case link shows not found', async () => {
  renderWithSource(<CaseDetail />, createMockSource(), '/kasus/case-0001')
  expect(await screen.findByText('Kasus tidak ditemukan')).toBeTruthy()
})
```

- [ ] **Step 2: Run** `npx vitest run app/tests/CaseDetail.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the three components and the page.
  - Page order: header (machine name, fault name ID/EN from the rule, `StatusChip`, case state) → `CaseTimeline` → `CaretakerSteps` with `JudgeNote d="D2"` → before/after chart with `JudgeNote d="D3"` → `WorkOrderPreview` (only when a dispatch exists).
  - Test IDs: `caretaker-step` on each step item, `step-{sense|diagnose|guide|verify|dispatch}` on the timeline columns, `work-order` on the preview.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(app): case detail with five-step timeline, steps, before/after, work order`

---

### Task 11: Safety rules page (Aturan Keamanan)

**Files:**
- Modify: `app/src/pages/SafetyRules.tsx`, `app/tests/pages.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
test('safety page shows every stored rule and global rule, read-only', async () => {
  renderWithSource(<SafetyRules />, createMockSource())
  expect(await screen.findAllByTestId('rule-row')).toHaveLength(10)
  expect(screen.getAllByTestId('global-rule')).toHaveLength(3)
  expect(screen.queryAllByRole('button')).toHaveLength(0)
})
```

- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement the page**
  - Global rules first.
  - Then a table grouped allow → observe → deny, with these columns:
    - status chip (allow = waspada styling with the word "Boleh dikerjakan pengelola"; observe = "Pantau saja"; deny = bahaya)
    - fault name in the current language
    - the numbered steps (the deny rows read "— (langsung ke teknisi)")
    - verify (signal label + "{wait_minutes} menit")
    - escalate_when
  - Every text comes from the data.
  - `JudgeNote d="D2"`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(app): read-only safety rules page`

---

### Task 12: Architecture page (Arsitektur)

**Files:**
- Create: `app/src/data/architecture.json`
- Modify: `app/src/pages/Architecture.tsx`, `app/tests/pages.test.tsx`

**`architecture.json`** is an array of `{ id, layer: 'machine'|'site'|'cloud'|'people', name_id, name_en, huawei: boolean, status: 'connected'|'planned' }`:
- machine: ESP32 sensor node (3 temperature probes, current clamp, vibration sensor)
- site: Orange Pi AIpro (Ascend NPU, openEuler) [huawei]; compressed MindSpore model [huawei]
- cloud: ModelArts [huawei]; ModelEngine Nexent agent [huawei]; MCP `sensor_check`, MCP `safe_caretaker_guide`, MCP `dispatch` [huawei]; openGauss [huawei]; Huawei Cloud [huawei]
- people: caretaker phone app; technician WhatsApp/SMS; owner dashboard (this app) — **the only `connected`**

- [ ] **Step 1: Write the failing test**

```tsx
test('architecture statuses come from data; only the dashboard is connected', async () => {
  renderWithSource(<Architecture />, createMockSource())
  expect(await screen.findAllByTestId('arch-connected')).toHaveLength(1)
  expect(screen.getAllByTestId('arch-planned')).toHaveLength(arch.length - 1)   // arch = architecture.json (13 items)
})
```

- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement the page**
  - An inline SVG with four horizontal layer bands (Machine → Site → Cloud → People) and downward arrows between them.
  - The boxes are generated from the JSON (no hand-placed coordinates per component), each with a status chip ("Terhubung" with `data-testid="arch-connected"`, or "Direncanakan (disimulasikan)" with `data-testid="arch-planned"`) and a small "Huawei" tag when `huawei` is set.
  - A legend below the SVG.
  - It must work in both themes (colours come from tokens) and at phone width (`viewBox`, width 100%).
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(app): architecture page with data-driven status`

---

### Task 13: Polish, evidence and rehearsal (P5 exit)

**Files:**
- Modify: `README.md`, `docs/logs/{UX_LOG,DEMO_LOG,DEVLOG,PLAN,TODO}.md`, `app/src/i18n/en.json`
- Create: `docs/screenshots/*.png` (local only, git-ignored)

- [ ] **Step 1: Complete EN.** Every key used by the six screens exists in `en.json`. To check, run `npx vitest run` and use `npm run dev` with EN selected: no ID text appears outside the data-driven step text.
- [ ] **Step 2: Check contrast.** Check every token pair (text/surface, each status fg/bg, chart lines/surface) in both themes with a WCAG checker. Log each pair with its ratio and pass/fail in UX_LOG, and fix any that fail AA.
- [ ] **Step 3: Check keyboard use.** Tab through each page. Focus is visible, the nav and demo controls work from the keyboard, and the icons have `aria-hidden` next to a visible word. Log the result in UX_LOG.
- [ ] **Step 4: Take screenshots** of every page: light/dark × ID/EN at 1280×720, plus phone width (390 px) in ID light. Save to `docs/screenshots/{page}-{theme}-{lang}-{w}.png`.
- [ ] **Step 5: Update `README.md`.** One command (`npm install && npm run dev`). Also list `npm test`, `npm run build`, `npm run preview` (offline at the venue), the `.env.example` keys, and a note that all data is `SIMULATED` with signal shapes that are illustrative.
- [ ] **Step 6: Rehearse.** Run the PRD §9.6 flow twice with `npm run build && npm run preview`, Wi-Fi off. The target is under 3 minutes with no typing. Log each run (date, time, what broke, fix) in DEMO_LOG.
- [ ] **Step 7: Run the final checks.** `npm test` (all pass), `npm run typecheck` (exit 0), `npm run build` (exit 0). Update PLAN (P1–P5 status), TODO and DEVLOG.
- [ ] **Step 8: Commit:** `docs: P5 evidence — contrast, screenshots, demo rehearsals, README`
