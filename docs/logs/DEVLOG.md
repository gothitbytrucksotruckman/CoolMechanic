# DEVLOG

Newest first, append-only.

### 2026-11-10 — [ALL] Claude (session with Rangga), plan Tasks 1–13
- Did: built the dashboard on branch `dashboard-mvp`: contract (Zod + JSON Schema + examples + API.md), seeded simulator with 4 scenarios and closed-loop verify, DataSource, Overview, Machine detail, Case detail, Safety rules, Architecture, `/demo`, ID/EN, light/dark, README.
- Evidence: `npm test` 92/92 pass; `npm run typecheck` clean; `npm run build` ok; headless Edge run of the demo flow with no console errors; contrast table in UX_LOG; screenshots in `docs/screenshots/` (local).
- Problems: npm `.cmd` shims break on the `&` in the folder name `GITHUB & PROJECTS`, so scripts call each tool's bin file with `node`. Build warns that the JS bundle is over 500 kB (Recharts); fine offline, not split.
- Next: Rangga reviews and merges the branch; two human demo rehearsals; native-speaker check of the safety-step wording.

### 2026-11-10 — [DOCS] Claude (session with Rangga)
- Did: Read all of `docs/source/` (PRD, project doc, Entry Information Form, competition manual, roadshow slides). Created `PLAN.md`, `TODO.md` and the `docs/logs/` skeletons. Started Phase 0 brainstorming.
- Evidence: files in the repo; source summary given in chat.
- Problems: first-submission date still unconfirmed. Slides list "National Final Nov–Dec 2026, Regional Final (APAC) Feb–Apr 2027, Global Final May 2027".
- Next: answer the Phase 0 questions one at a time, then write `docs/DESIGN.md` and the first ADRs.
- Update (same day): Phase 0 questions answered (ADR-001 to ADR-008 accepted, ADR-009 proposed). `docs/DESIGN.md` drafted; awaiting the team's "approved".
- Update: ADR-009 accepted. ADR-010: DESIGN, PLAN and TODO moved into `docs/logs/`; `.gitignore` now ignores all of `docs/`.
- Update: reversed the ignore for `docs/logs/`. `.gitignore` is now `docs/*` + `!docs/logs/`, so the logs are tracked and `docs/source/` stays local.
- Update: DESIGN.md approved. Wrote `docs/logs/IMPLEMENTATION_PLAN.md` (13 tasks, P1–P5). Library versions read from the npm registry; Zod 4 `z.toJSONSchema` and Recharts `ReferenceArea`/`ReferenceLine` checked by running them in a scratch install. ADR-011 proposed (contract refinements).
