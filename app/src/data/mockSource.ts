import { GLOBAL_RULES, MACHINES, SAFETY_RULES, SITES, normalBands } from '../../../mock/seed'
import { createSimulator, type Simulator } from '../../../mock/simulator'
import type { DataSource } from './types'

export function createMockSource(sim: Simulator = createSimulator()): DataSource {
  return {
    listSites: async () => SITES,
    listMachines: async () => MACHINES,
    getReadings: async (id, from, to) => sim.readings(id, from, to),
    listNormalBands: async (id) => {
      const m = MACHINES.find((x) => x.id === id)
      return m ? normalBands(m) : []
    },
    listCases: async (f) => sim.cases().filter((c) => !f?.machineId || c.machine_id === f.machineId),
    getCase: async (id) => {
      const c = sim.cases().find((x) => x.id === id)
      if (!c) return null
      return { case: c, events: sim.events(id), dispatch: sim.dispatches().find((d) => d.case_id === id) }
    },
    listCaseEvents: async (limit) =>
      sim.cases().flatMap((c) => sim.events(c.id))
        .map((e, i) => ({ e, i }))
        .sort((a, b) => Date.parse(b.e.ts_utc) - Date.parse(a.e.ts_utc) || b.i - a.i) // same minute: later-emitted first
        .slice(0, limit).map((x) => x.e),
    listSafetyRules: async () => SAFETY_RULES,
    listGlobalRules: async () => GLOBAL_RULES,
    subscribe: (fn) => sim.subscribe(fn),
    now: () => sim.now(),
    demo: {
      play: () => sim.play(), pause: () => sim.pause(), isPlaying: () => sim.isPlaying(),
      setSpeed: (x) => sim.setSpeed(x), speed: () => sim.speed(),
      trigger: (s, m) => sim.trigger(s, m),
      advance: (n) => sim.advance(n),
      reset: () => sim.reset(),
    },
  }
}
