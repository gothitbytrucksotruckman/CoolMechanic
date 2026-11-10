# DEVLOG

Newest first, append-only.

### 2026-11-10 — [DOCS] Claude (session with Rangga)
- Did: Read all of `docs/source/` (PRD, project doc, Entry Information Form, competition manual, roadshow slides). Created `PLAN.md`, `TODO.md` and the `docs/logs/` skeletons. Started Phase 0 brainstorming.
- Evidence: files in the repo; source summary given in chat.
- Problems: first-submission date still unconfirmed. Slides list "National Final Nov–Dec 2026, Regional Final (APAC) Feb–Apr 2027, Global Final May 2027".
- Next: answer the Phase 0 questions one at a time, then write `docs/DESIGN.md` and the first ADRs.
- Update (same day): Phase 0 questions answered (ADR-001 to ADR-008 accepted, ADR-009 proposed). `docs/DESIGN.md` drafted; awaiting the team's "approved".
- Update: ADR-009 accepted. ADR-010: DESIGN, PLAN and TODO moved into `docs/logs/`; `.gitignore` now ignores all of `docs/`.
- Update: reversed the ignore for `docs/logs/`. `.gitignore` is now `docs/*` + `!docs/logs/`, so the logs are tracked and `docs/source/` stays local.
