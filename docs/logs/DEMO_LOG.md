# Demo Log

Every rehearsal of the §9.6 demo flow: date, who presented, total time (target under 3 min), what broke, fixes.

### 2026-11-10 — Scripted run, not a human rehearsal (Claude)
- Setup: `npm run build && npm run preview`, headless Edge driving the real page, no network beyond localhost.
- Flow: Overview all Aman (5) → `#/demo` m-01 `condenser_blocked` at 60× → Overview showed Freezer Box Es 1 *Waspada* after ~9 virtual minutes → case-0001 went Guiding → *Perbaikan berhasil* / *Selesai* at 08.29 WIB virtual → m-04 `electrical_part_fault` → case-0002 *Teknisi dipanggil*, 0 caretaker steps, work order shown.
- Wall time of the scripted flow: about 45 s of simulation at 60× plus page switches; a human presenter talking over it is the real measure.
- Console errors: none.
- Broke: chart marker labels overlapped (fixed); deny-case D3 note was wrong (fixed); the electrical-fault work order once quoted an in-band current value (fixed: evidence is now the worst reading since onset, plus start-retry spikes in the signal).

**Still required for the P5 exit:** two rehearsals by a person with a stopwatch, under 3 minutes each. Log them below.
