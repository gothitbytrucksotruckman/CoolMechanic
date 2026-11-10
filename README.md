# CoolMechanic — dashboard prototype

Team Betelgeuse (President University), 11th Huawei ICT Competition 2026–2027, Innovation Competition, AI Innovation Track.

CoolMechanic clips onto any freezer, ice maker or cold room, catches faults before the cold is lost, walks the caretaker through safe fixes, checks with live sensors that each fix worked, and sends a technician the right diagnosis over WhatsApp when a specialist is needed.

This repository holds the **owner/judge dashboard** only. **All data is simulated** (`SIMULATED` badge on every screen). The sensors, edge model and agent are built later and will plug in through `contract/`.

## Run it

Requires Node 24.

```bash
npm install && npm run dev
```

Open the URL Vite prints. The hidden demo control is at `#/demo` (not in the navigation).

| Command | What it does |
|---|---|
| `npm test` | Runs the contract, simulator, safety-display and page tests |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serves `dist/` locally — fully offline, use this at the venue |
| `npm run contract:schema` | Regenerates `contract/schema.json` for the hardware/agent teammates |

Settings (`.env`, copy from `.env.example`):
- `VITE_DATA_SOURCE=mock` — only `mock` exists until the real adapter (plan phase P6).
- `VITE_JUDGE_NOTES=on` — the small D1/D2/D3 explanation tags for judges; `off` hides them.

## Demo flow (under 3 minutes, no typing)

1. **Overview** (`#/`): every machine reads *Aman*.
2. **`#/demo`**: pick `m-01`, press `condenser_blocked`, choose **60×**, press **Jalankan**.
3. **Overview**: Freezer Box Es 1 turns *Waspada* while the inside temperature is still normal.
4. **Case** (click the newest event): Sense and Diagnose, then the four safe steps the caretaker received.
5. Wait about 20 seconds: the before/after chart returns to the green band and the case closes as *Selesai*.
6. **`#/demo`**: pick `m-04`, press `electrical_part_fault`. The case shows no steps, *Jangan disentuh — teknisi dipanggil*, and the technician work order.
7. Finish on **Arsitektur**: what is connected (only this dashboard) and what is planned.

**Reset** on `#/demo` restarts everything from the same seed, so every rehearsal looks the same.

## Layout

```
contract/   data contract: Zod schemas, JSON Schema, example payloads, API.md (target for the real system)
mock/       the simulator (plays the edge hub + agent); signal shapes are illustrative, not physics
app/        the React dashboard (Vite root)
docs/logs/  plan, design, decisions (ADR), dev/UX/demo logs
```

## Honesty notes

- Every number on screen comes from the simulator. None is a measured result.
- Machine brands ("Merek A–E") and sites are fictional and marked *simulasi*.
- Safety steps are copied from the project's allow/deny table; wait times are starting guesses to be confirmed with a refrigeration advisor (ADR-009).
