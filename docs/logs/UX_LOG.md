# UX Log

Per entry: date, screen, who reviewed (teammate, advisor or real user with consent), what confused them (their words), what we changed, before/after screenshot paths. WCAG AA contrast checks are logged here too.

### 2026-11-10 — WCAG AA contrast, all token pairs (automated, Claude)
Ratios computed with the WCAG 2.x relative-luminance formula straight from `app/src/styles/tokens.css`. Text needs ≥ 4.5, chart lines ≥ 3.

| Pair | Light | Dark | Result |
|---|---|---|---|
| text on surface / bg | 16.52 / 15.12 | 14.55 / 15.93 | pass |
| muted on surface / bg | 7.29 / 6.67 | 8.05 / 8.81 | pass |
| accent on surface (and surface on accent) | 8.14 | 8.50 | pass |
| aman-fg on aman | 5.83 | 8.20 | pass |
| waspada-fg on waspada | 6.33 | 8.79 | pass |
| bahaya-fg on bahaya | 5.56 | 8.27 | pass |
| teknisi-fg on teknisi | 7.28 | 7.84 | pass |
| status fg on surface (aman/waspada/bahaya/teknisi) | 6.72 / 7.22 / 6.82 / 8.78 | 11.10 / 12.10 / 9.58 / 10.04 | pass |
| chart lines on surface (box/condenser/discharge/current/vib) | 5.28 / 5.18 / 7.31 / 5.47 / 8.98 | 7.87 / 8.21 / 10.01 / 9.22 / 8.45 | pass (≥ 3) |

Borders (1.41 light / 1.43 dark) are decorative separators, not the only cue for anything.

### 2026-11-10 — Keyboard and screen check (automated, Claude)
- Tab order on `#/`: skip link → nav (3) → ID/EN → theme → 5 machine cards. On `#/demo`: machine select → 4 scenario buttons → play → 1×/10×/60× → reset. Every stop showed the 3 px focus outline.
- Status chips: icon is `aria-hidden`, a visible word always sits next to it (never colour alone).
- Phone width 390 px: no horizontal page scroll on the Overview (scrollWidth = 390).
- Not yet done: a review by a real person (teammate, advisor or caretaker). Log their words here when it happens.

### 2026-11-10 — Fixes found from screenshots
- Case chart: the "Terdeteksi" and "Perbaikan" marker labels overlapped when the two lines were close → the detected label now sits left of its line, the fix label right of its line. Before: `docs/screenshots/03-case-resolved.png` (first run), after: `case-resolved-light-id-1280.png`.
- Deny case: the D3 note claimed "sensors re-read after the fix" on a case with no fix → deny cases now show an evidence note instead (test added).

Screenshots: `docs/screenshots/` — every page × light/dark × ID/EN at 1280×720, plus ID light at 390 px. Local only (git-ignored).
