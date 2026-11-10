# mock/ — the CoolMechanic simulator

Everything this folder produces is tagged `provenance: "SIMULATED"`.

**The signal shapes are illustrative, not physics.** They are hand-made curves so the dashboard and the demo have something realistic-looking to show:
- compressor on/off cycles (30 min: 18 on, 12 off), box temperature as a triangle wave around the setpoint;
- a daily ambient swing (29 ± 3 °C, peak mid-afternoon WIB) that lifts condenser and discharge temperatures;
- door-opening spikes on the canteen machines (m-04, m-05) between 06:00 and 14:00 WIB;
- a 10-minute discharge-probe dropout on m-01, three hours before the start, to show the "sensor lepas" state.

They will be replaced by **recorded data from our test rig** (normal operation plus reversible faults) once it exists. Do not quote any number from the simulator as a measured result.

## Files
- `seed.ts` — 3 fictional sites, 5 machines with mixed kinds, brands ("Merek A–E"), ages and condenser types; the safety table and global rules (copied from the project doc).
- `signals.ts` — normal readings.
- `rng.ts` — seeded random numbers: same seed, same data, every run.
- `simulator.ts` — virtual clock (play, pause, 1×/10×/60×), history buffer, live events, reset.
- `scenarios.ts`, `workorder.ts` — fault scenarios and the technician work order (the agent's stand-in).
