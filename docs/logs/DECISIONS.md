# Architecture Decision Records

Numbered, newest at the bottom. Format:

```
## ADR-NNN: Title  (YYYY-MM-DD, status: proposed | accepted | superseded)
Context: ...  Options: ...  Decision: ...  Consequences: ...
Verified against: <doc link + date>
```

## ADR-001: One owner for the dashboard prototype  (2026-11-10, status: accepted)
Context: The first round is an introduction-level submission. Serious build-out starts at the semifinal stage. The other students carry hardware, model and agent work.
Options: A) split UI/DATA/API across all three students; B) one owner, others review the contract; C) two owners.
Decision: B. Rangga owns the whole dashboard (UI, simulator, contract, docs). The other students review `contract/` only, because their edge hub and agent must write into it later. Andika keeps `[INS]`.
Consequences: Fast decisions, one bottleneck. Scope is held to the PRD §10 "Minimum Submittable Dashboard"; everything else is labelled roadmap until the semifinal. Revisit at the semifinal.
Verified against: n/a (team decision)

## ADR-002: Judges are the primary audience for the prototype  (2026-11-10, status: accepted)
Context: In the first round the dashboard is seen mainly in the demo video. No pilot site or real owner exists yet.
Options: A) judges first, with explanation labels; B) owner first; C) both, with an explain-mode toggle.
Decision: A. Screens make the five-step loop and D1–D3 visible, with short explanation labels. Owner views stay correct and read-only but are not polished for daily use.
Consequences: Explanation labels live in one component so they can be hidden for real owners later. Revisit at the semifinal, once a pilot site exists.
Verified against: n/a (team decision)

## ADR-003: Caretaker flow shown read-only inside the case  (2026-11-10, status: accepted)
Context: The real caretaker app belongs to the agent work (software student). D2 still has to be visible to judges.
Options: A) read-only "what the caretaker saw" in Case detail; B) the same inside a phone frame; C) an interactive caretaker app.
Decision: A. Case detail lists the steps sent (from `step_shown` / `step_done` CaseEvents) and the verification result. The demo panel simulates the caretaker's "done" taps. Deny and unknown cases show "Jangan disentuh — teknisi dipanggil" and zero steps.
Consequences: No second app to build or throw away. Judges don't see a phone UI; reconsider B for the semifinal video.
Verified against: n/a (team decision)

## ADR-004: Simulator runs in the browser behind one DataSource interface  (2026-11-10, status: accepted)
Context: One owner, a December deadline, and the demo must run offline on a laptop and be easy to show to judges.
Options: A) in-browser TypeScript simulator; B) separate API server with SSE; C) in-browser behind a fake network (MSW).
Decision: A. The app talks only to a `DataSource` interface; `mockSource` (the simulator) is the only implementation for now. The stack follows the PRD recommendation: React + Vite + TypeScript + Tailwind.
Consequences:
- Live updates (PRD Q6): in-process subscription callbacks. The real transport (SSE or polling) is chosen in P6 when `httpSource` is built.
- Deployment (PRD Q7): static build. The same files run offline on a laptop and on any static host. No server.
- No HTTP API exists until P6, so `contract/` must document the intended endpoints for the edge hub and agent.
- Time controls (1×/10×/60×) live in the simulator's own clock.
Verified against: n/a (architecture choice; library versions get checked in P1)

## ADR-005: Bahasa Indonesia primary, English toggle  (2026-11-10, status: accepted)
Context: The product serves Indonesian caretakers and owners (D2). Judges present in English.
Options: A) ID primary + EN toggle; B) EN primary + ID toggle; C) EN only for now.
Decision: A. UI strings live in `id.json` / `en.json`; the default is ID. Caretaker step text comes from data (`text_id` / `text_en`), never from the UI.
Consequences: For this round EN is complete only on the Minimum Submittable screens; other screens may fall back to ID. Owner-facing words follow `app/src/i18n/glossary.md` (no refrigeration jargon).
Verified against: n/a (team decision)

## ADR-006: Architecture page as a four-layer diagram with data-driven status  (2026-11-10, status: accepted)
Context: The AI Innovation Track lists ModelEngine, Nexent and Huawei Cloud as technical areas. The honesty rules forbid implying parts exist when they don't.
Options: A) static four-layer SVG diagram with Connected / Planned (simulated) chips; B) table; C) diagram that animates the active component during the demo.
Decision: A. Machine → Site → Cloud → People. Each component's status comes from one data file, so it changes in a single edit as real parts arrive. Today only the dashboard is "Connected".
Consequences: About a day of SVG work. Live highlighting (C) is a semifinal candidate.
Verified against: n/a (team decision)

## ADR-007: Recharts for charts, Zod for the contract, TanStack Query deferred  (2026-11-10, status: accepted)
Context: The PRD suggested ECharts or Recharts, plus TanStack Query. With an in-browser simulator (ADR-004) there is no network yet.
Options: Charts: ECharts / Recharts. Contract: hand-written types + JSON Schema / Zod as the single source. Fetching: TanStack Query now / later.
Decision: Recharts (React components; built-in shaded bands and reference lines). Zod (one definition gives types, runtime checks and a JSON Schema export). TanStack Query deferred to P6, when `httpSource` exists.
Consequences: Zod is one dependency the PRD didn't list. Its JSON Schema export and Recharts' band/marker support are `[VERIFY]` in P1.
Verified against: pending P1 (official docs)

## ADR-008: Contract additions — fault names, verbatim work orders  (2026-11-10, status: accepted)
Context: The UI must not invent text (PRD rules 3 and 6), but the contract had no human-readable fault names, and the §9.5 work order was described as a UI template.
Decision: SafetyRule gains `fault_name_id` and `fault_name_en`. The work-order preview shows `Dispatch.message_text` verbatim; the §9.5 template is filled by the simulator (the agent's stand-in), which omits unknown lines.
Consequences: The real agent must produce `message_text` in the same format. The other teammates review this in `contract/`.
Verified against: n/a (contract decision)

## ADR-009: Fan imbalance not in the dashboard; verify waits follow the Entry Form  (2026-11-10, status: accepted)
Context: The Entry Form lists "fan imbalance" as a reversible test fault but gives it no safety status. PRD §8 mentions a "20-minute verification window", while the form says about 10–15 minutes.
Decision: Leave fan imbalance out of the dashboard's fault codes; it is training data, and `fan_motor_failure` (deny) covers the field case. Wait times come from `verify_rule.wait_minutes`, seeded at 15 (condenser) and 10 (door), per the form.
Consequences: The wait times still need the refrigeration advisor's confirmation later.
Verified against: Entry Information Form; project doc safety table

## ADR-011: Contract refinements found while planning  (2026-11-10, status: accepted)
Context: Writing the implementation plan exposed gaps in DESIGN §3: a fault-wide `target_range` can't fit machines with different setpoints, and deny cases had no signal to chart.
Decision (proposed): (1) `SafetyRule.verify_rule` = `{signal, target: "normal_band", wait_minutes} | null` (null for deny); the per-machine range is stored in the `verify_start` payload as `target_range`. (2) The `alert` CaseEvent payload gains `evidence_signal`. (3) New `GlobalRule {order, text_id, text_en}` for the three every-fault rules. (4) `NormalBand.source` uses the provenance enum. (5) DataSource gains `listCaseEvents(limit)` and `listGlobalRules()`; `getCase` returns null when not found.
Consequences: Owner OK needed before plan Task 2. The other students review it with the rest of `contract/`.
Verified against: n/a (contract decision)

## ADR-010: Project docs live in docs/logs/ and are tracked; the rest of docs/ is git-ignored  (2026-11-10, status: accepted)
Context: The owner wants planning docs kept together. PRD §5 placed PLAN.md and TODO.md at the root and DESIGN.md in docs/. A first version ignored all of `docs/`; it was reversed the same day so the team's shared memory stays in git.
Decision: DESIGN.md, PLAN.md and TODO.md move into `docs/logs/`. `.gitignore` ignores `docs/*` except `docs/logs/`.
Consequences: Logs, plan, TODO and design are tracked. `docs/source/` (PRD, Entry Form with personal contact details, PDFs) and `docs/screenshots/` stay local only and need a separate backup. Deviates from PRD §5/§6 paths; the session ritual reads `docs/logs/PLAN.md` and `docs/logs/TODO.md`.
Verified against: n/a (team decision)
