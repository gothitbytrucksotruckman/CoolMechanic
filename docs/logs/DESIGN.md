# CoolMechanic Dashboard — Design (Phase 0)

Status: **awaiting team review** · Owner: Rangga · Date: 2026-11-10
Sources: `docs/source/PRD.md` (v2), the Entry Information Form, the project doc. Decisions: `docs/logs/DECISIONS.md` ADR-001 to ADR-010.

---

## 1. Goal and scope of this round

This round is an **introduction-level prototype**. Serious build-out starts at the semifinal stage. The dashboard runs on simulated data, is built for **judges first** (ADR-002), and must clearly show the five steps (Sense → Diagnose → Guide → Verify → Dispatch) and the three differentiators:

- **D1 Brand-agnostic retrofit:** mixed brands, ages and condenser types in the machine list.
- **D2 Caretaker-first guidance:** the steps the caretaker was shown, and none for deny-list faults.
- **D3 Closed-loop verification:** the before/after signal for every case.

**In this round (PRD §10, "Minimum Submittable Dashboard"):** Overview, Machine detail, Case detail, Safety rules, Architecture and `/demo`, plus scenarios `condenser_blocked`, `condenser_blocked_not_fixed`, `electrical_part_fault` and `unknown_anomaly`.

**Roadmap (until the semifinal):** standalone Sites, Alerts and Dispatches pages; the `door_ajar`, `frost_buildup`, `interior_vent_blocked` and `unstable_voltage` scenarios; the offline banner (arrives with `httpSource` in P6); a phone-frame caretaker view; live highlighting on the Architecture diagram; automated screenshots.

**Out of scope:** firmware, edge inference, model training, the Nexent agent, real WhatsApp sending, real openGauss.

**Deadline:** plan back from **15 Dec 2026** until the instructor confirms the real date.

---

## 2. Architecture

```
contract/          Zod schemas = the single source for types, runtime checks and JSON Schema.
                   examples/ (one valid payload per entity) and API.md (endpoints for P6).
mock/              The simulator: seed, normal cycling, scenario scripts, virtual clock.
                   It plays the role of the edge hub + Nexent agent.
app/src/data/      DataSource interface → mockSource (wraps mock/) now, httpSource in P6.
                   Chosen by VITE_DATA_SOURCE in .env (mock | http).
app/src/pages/     Screens. They only use the DataSource, never mock/ directly.
```

The PRD's `coolmechanic-dashboard/` root is this repository's root.

### 2.1 Data flow
1. The simulator advances its virtual clock. Each tick it emits Readings for every machine.
2. Scenario scripts change the signals and emit Alerts, Cases, CaseEvents and Dispatches. **All case logic lives in the simulator**, because in the real system the agent owns it.
3. Screens subscribe through the DataSource and re-render. The UI never generates steps, statuses or messages (PRD rule 6).
4. Only `/demo` calls the simulator controls.

### 2.2 DataSource interface (sketch)

```ts
interface DataSource {
  // reads
  listSites(): Promise<Site[]>
  listMachines(): Promise<Machine[]>
  getReadings(machineId: string, fromUtc: string, toUtc: string): Promise<Reading[]>
  listNormalBands(machineId: string): Promise<NormalBand[]>
  listCases(filter?: { machineId?: string }): Promise<Case[]>
  getCase(id: string): Promise<{ case: Case; events: CaseEvent[]; dispatch?: Dispatch }>
  listSafetyRules(): Promise<SafetyRule[]>
  // live: returns an unsubscribe function
  subscribe(onEvent: (e: LiveEvent) => void): () => void   // LiveEvent = reading | alert | case | case_event | dispatch
  now(): string                                            // current (virtual) time, ISO UTC
  // mock-only; absent on httpSource
  demo?: DemoControls   // play(), pause(), setSpeed(1|10|60), trigger(scenario, machineId), reset()
}
```

Live updates are in-process callbacks for now (ADR-004). The real transport (SSE or polling) is chosen in P6.

### 2.3 Libraries (ADR-004, ADR-007; versions checked in P1 and marked `[VERIFY]` until then)
React + Vite + TypeScript, Tailwind CSS, React Router, **Recharts** (charts), **Zod** (contract), Vitest + Testing Library (tests). TanStack Query is deferred to P6, because there is no network to cache until then.

---

## 3. Data contract (`contract/`)

Times are ISO-8601 UTC strings. IDs are short strings (`site-01`, `m-03`, `case-0007`). Every entity read from the simulator carries `provenance: "SIMULATED"`.

| Entity | Fields (type, unit) |
|---|---|
| **Site** | `id`, `name`, `type` (`ice_depot`\|`market_vendor`\|`canteen`\|`cooperative`\|`lab`), `area` (string, e.g. "Cikarang, Bekasi"), `timezone` (IANA, e.g. `Asia/Jakarta`) |
| **Machine** | `id`, `site_id`, `name`, `kind` (`chest_freezer`\|`upright_freezer`\|`ice_maker`\|`cold_room`), `brand`, `model`, `approx_age_years` (number, years), `condenser_type` (`fan`\|`static`), `installed_at` (UTC) |
| **Reading** | `machine_id`, `ts_utc`, `provenance` (`SIMULATED`\|`LAB-RIG`\|`FIELD`), `temp_box_c` (°C), `temp_condenser_c` (°C), `temp_discharge_c` (°C), `current_rms_a` (A), `vib_rms_g` (g), `sensor_health` {`box_ok`, `condenser_ok`, `discharge_ok`, `current_ok`, `vib_ok`: boolean}. A value is `null` when its probe is not ok. |
| **NormalBand** | `machine_id`, `signal` (one of the five Reading signals), `low`, `high` (signal unit), `source` (provenance) |
| **Alert** | `id`, `machine_id`, `ts_utc`, `fault_code`, `confidence` (0–1), `severity` (`info`\|`warning`\|`critical`), `source` (`edge`\|`cloud`) |
| **Case** | `id`, `machine_id`, `fault_code`, `safety_status` (`allow`\|`observe`\|`deny`), `state` (`OPEN`\|`GUIDING`\|`VERIFYING`\|`RESOLVED`\|`DISPATCHED`), `opened_at`, `closed_at` (UTC or null) |
| **CaseEvent** | `case_id`, `ts_utc`, `type` (`alert`\|`safety_check`\|`step_shown`\|`step_done`\|`verify_start`\|`verify_pass`\|`verify_fail`\|`dispatched`\|`technician_confirmed`), `payload` (object; shape per type, documented in `contract/`) |
| **SafetyRule** | `fault_code`, **`fault_name_id`**, **`fault_name_en`** (added, ADR-008), `status`, `steps[]` {`order`, `text_id`, `text_en`}, `verify_rule` {`signal`, `target_range` [low, high], `wait_minutes`}, `escalate_when` {`text_id`, `text_en`} |
| **Dispatch** | `id`, `case_id`, `channel` (`whatsapp`\|`sms`\|`mock`), `sent_at`, `delivery_status` (`queued`\|`sent`\|`delivered`\|`failed`), `message_text` (shown exactly as stored, ADR-008) |

**Fault codes.** Allow: `condenser_blocked`, `door_ajar`, `frost_buildup`, `interior_vent_blocked`. Observe: `unstable_voltage`. Deny: `electrical_part_fault`, `refrigerant_sealed_system`, `compressor_wear`, `fan_motor_failure`, and `unknown_anomaly` (always deny).

**Steps and the safety table.** Steps and verify rules are copied from the project doc's safety table. The global rules (unplug first; never touch a wet plug; never open panels or touch wiring) are stored as data alongside the table and shown on the Safety rules page. Deny rules store `steps: []`.

**API for P6 (`contract/API.md`):** `GET /sites`, `/machines`, `/machines/{id}/readings?from&to`, `/machines/{id}/normal-bands`, `/cases?machine_id`, `/cases/{id}` (with events and dispatch), `/safety-rules`, `/dispatches`, and `/stream` for live events (transport decided in P6). The JSON bodies use the same shapes as above.

---

## 4. Simulator (`mock/`)

- **Seed:** 3 sites (an ice depot, a market seafood stall, a campus canteen) and 5 machines with mixed kinds, brands, ages (roughly 2 to 15 years) and condenser types. Brand and model names are generic placeholders (for example "Merek A"), so we don't misrepresent any real product.
- **Repeatable:** a seeded random generator. The same seed gives the same data, and `reset()` restarts from it.
- **Clock:** virtual time with play, pause and 1×/10×/60× speed. It samples one Reading per machine per virtual minute. It starts with 6 virtual hours of history, so charts are never empty.
- **Normal behaviour:** compressor on/off cycles, door-opening spikes at the canteen, and a daily ambient swing.
- **Scenarios this round:**

| Scenario | Signals | Case path | Ends |
|---|---|---|---|
| `condenser_blocked` | Condenser and discharge temperatures and current rise first; box temperature later | alert → safety_check → step_shown ×N → step_done → verify_start → verify_pass; signals return to the band | RESOLVED |
| `condenser_blocked_not_fixed` | Same signals | … → verify_start → verify_fail → dispatched | DISPATCHED |
| `electrical_part_fault` | Current spikes on start and the vibration pattern changes | alert → safety_check → dispatched (no steps) | DISPATCHED |
| `unknown_anomaly` | An out-of-pattern drift that matches no known signature | alert → safety_check → dispatched (no steps) | DISPATCHED |

- The caretaker's "done" is simulated after a scripted delay (ADR-003).
- The work-order `message_text` is built **in the simulator** from the PRD §9.5 template. A line whose value is unknown is omitted, never invented.
- `technician_confirmed` is not emitted this round, so DISPATCHED cases stay open.
- `mock/README.md` says the signal shapes are **illustrative, not physics**, and that recorded rig data replaces them later.

---

## 5. Screens

**Global header:** the source badge (from Reading `provenance`; it shows `SIMULATED`), ID/EN toggle (ADR-005), light/dark toggle, and "Terakhir diperbarui" (last updated; virtual time). Navigation: Ringkasan, Arsitektur, Aturan Keamanan. Machines and cases are reached by clicking through. `/demo` is never linked.

**JudgeNote** (ADR-002): one small component that renders a tag such as "D3 · Sensor memastikan perbaikan berhasil" ("D3 · Sensors confirm the fix worked"). One flag hides all of them.

### 5.1 Machine status (derived, never stored)
An open case is one with `closed_at = null`. Rows are checked top to bottom, and the first match wins. When a machine has several open cases, the first matching row across all of them sets the status.

| Condition | Status | Colour + icon + word |
|---|---|---|
| An open case with `deny`, state ≠ DISPATCHED | `bahaya` | red + hand + "Jangan disentuh" |
| An open case in DISPATCHED (any safety status) | `teknisi` | blue + wrench + "Teknisi dipanggil" |
| An open case with `allow` or `observe` | `waspada` | amber + eye + "Waspada" |
| No open case | `aman` | green + check + "Aman" |

### 5.2 Screens this round
1. **Ringkasan (Overview):** four status counts; machine cards sorted by attention needed (name, site, brand, age, condenser type, status chip, last reading time); latest case events; "Selesai di tempat vs teknisi dipanggil" (fixed on site vs technician called) counts since the simulation started. A period picker is roadmap. JudgeNote D1.
2. **Detail Mesin (Machine detail):** five live charts (three temperatures, current, vibration) with shaded normal bands and dashed fault-onset lines; sensor health; equipment profile; case history.
3. **Detail Kasus (Case detail, the hero screen):**
   - A five-step timeline with timestamps: Sense (alert), Diagnose (safety_check: fault name + status), Guide (step_shown/step_done), Verify (verify_*), Dispatch (dispatched). Steps that don't apply read "tidak diperlukan" (not needed) or "dilewati: daftar larangan" (skipped: deny list).
   - Caretaker steps: rendered **only** when `safety_status` is `allow` or `observe`. Otherwise the screen shows "Jangan disentuh — teknisi dipanggil" and zero steps, **even if the data contains steps**. JudgeNote D2.
   - Before/after chart: the `verify_rule.signal` from case open to the end of verification. The target range is shaded, a labelled marker sits at `step_done` ("Perbaikan" (fix)), and a dashed line at the alert. Deny cases show the evidence signal up to dispatch. JudgeNote D3.
   - Work-order preview: `Dispatch.message_text` verbatim, with channel, time and delivery status.
4. **Aturan Keamanan (Safety rules):** read-only table of every SafetyRule plus the global rules, exactly as stored.
5. **Arsitektur (Architecture):** a four-layer SVG (Machine → Site → Cloud → People). Each component's status (Terhubung / Connected or Direncanakan (disimulasikan) / Planned (simulated)) comes from `app/src/data/architecture.json` (ADR-006).
6. **/demo:** banner "Demo control — simulated"; scenario buttons with a machine picker; play/pause; 1×/10×/60×; reset.

### 5.3 Empty and error states
- A probe that is not ok shows a gap in its chart line, labelled "sensor lepas" (sensor disconnected). No value is ever made up.
- No cases → "Belum ada kasus" (no cases yet) plus a one-line reason.
- A DataSource error shows an error card with the message, never a blank page.

---

## 6. Visual system
PRD §9.3 applies: Plus Jakarta Sans with tabular figures; status tokens as CSS variables in `app/src/styles/tokens.css` for light and dark; neutral surfaces; 8 px grid; 12 px radius; no gradients or decorative shadows; one accent colour per signal; status is never shown by colour alone. Every colour pair is checked for WCAG AA and logged in `docs/logs/UX_LOG.md`. Readable at 1280×720 and at phone width. Owner-facing words follow `app/src/i18n/glossary.md` ("kisi-kisi belakang", not "kondensor").

---

## 7. Tests (Vitest, PRD §12)
1. **Contract:** every payload emitted during a full run of each scenario passes its Zod schema. Each file in `contract/examples/` passes too.
2. **Safety display:** for deny and unknown cases, Case detail renders zero step items and shows "Jangan disentuh", including a case whose data deliberately contains steps.
3. **Scenarios:** each of the four scenarios, fast-forwarded, ends in its expected state with the expected event sequence.
4. **Status derivation:** a table test of §5.1.
5. **Manual this round:** screenshots of every page (both themes, ID/EN, 1280×720 and phone width) in `docs/screenshots/`; keyboard navigation; icon labels; the AA contrast log.

**A task is done when** the tests pass, DEVLOG and TODO are updated, and no secrets are in the diff.

---

## 8. Open items (not blocking P1)
- First-submission date and formats: instructor (`[INS]`).
- Whether APAC onsite presentations happen at the Regional or the National stage (the manual and the slides disagree): instructor.
- `docs/logs/` and `docs/source/PRD.md` are tracked; the rest of `docs/source/` and `docs/screenshots/` are git-ignored (ADR-010, ADR-013).
- ~~Fan imbalance and the 20-minute window~~ resolved by ADR-009 (accepted).
