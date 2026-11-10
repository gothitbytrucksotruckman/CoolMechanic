# CoolMechanic Dashboard — Plan

Source of truth: `docs/source/PRD.md` (§10). Worst-case first deadline: **15 Dec 2026** (unconfirmed).

| Phase | Goal | Exit criteria (evidence) | Status |
|---|---|---|---|
| P0 Brainstorm | Decisions locked | `docs/logs/DESIGN.md` approved; ADRs written | **Done** 2026-11-10 (task breakdown: `docs/logs/IMPLEMENTATION_PLAN.md`) |
| P1 Foundations | Repo, tooling, contract, tokens | `contract/` types + example payloads; tokens.css with both themes; app runs locally | **Done** 2026-11-10 |
| P2 Simulator | Repeatable data | All §8 scenarios run with time controls; output validates against the contract | **Done for this round's 4 scenarios** 2026-11-10; other 4 are roadmap |
| P3 Core screens | Overview, sites/machines, machine detail | Screens render live simulated data; empty and offline states done | **Done** 2026-11-10 (offline banner waits for P6; Sites page roadmap) |
| P4 Case story | Case detail, alerts, dispatches, safety rules | Every §8 scenario produces a correct case timeline; deny cases show no steps | **Done** 2026-11-10 (Alerts/Dispatches pages roadmap) |
| P5 Polish | Architecture page, i18n, a11y, demo route | AA contrast checked; ID/EN complete; demo rehearsed under 3 min twice (DEMO_LOG) | **Almost**: contrast + ID/EN done; two human rehearsals still to log |
| P6 Ready to connect | Adapters for real data | Real HTTP adapter reads the same contract; mock ↔ real swap is a config change | Not started |

## Minimum Submittable Dashboard (if the deadline is in December)
Overview, machine detail, case detail (five-step timeline + before/after chart), safety rules, architecture page, demo route running scenarios 1, 2 and 5. Everything else is labelled roadmap.
