// The socket the dashboard plugs into (ADR-004). mockSource today, httpSource in P6.
import type { Case, CaseEvent, Dispatch, GlobalRule, Machine, NormalBand, Reading, SafetyRule, Site } from '../../../contract/schemas'
import type { LiveEvent, ScenarioId, Speed, TriggerResult } from '../../../mock/simulator'

export type { LiveEvent, ScenarioId, Speed, TriggerResult }

// Mock-only: absent on a real source. Only /demo uses it.
export interface DemoControls {
  play(): void; pause(): void; isPlaying(): boolean
  setSpeed(x: Speed): void; speed(): Speed
  trigger(s: ScenarioId, machineId: string): TriggerResult
  advance(min: number): void
  reset(): void
}

export interface CaseBundle { case: Case; events: CaseEvent[]; dispatch?: Dispatch }

export interface DataSource {
  listSites(): Promise<Site[]>
  listMachines(): Promise<Machine[]>
  getReadings(machineId: string, fromUtc: string, toUtc: string): Promise<Reading[]>
  listNormalBands(machineId: string): Promise<NormalBand[]>
  listCases(filter?: { machineId?: string }): Promise<Case[]>
  getCase(id: string): Promise<CaseBundle | null> // null = not found
  listCaseEvents(limit: number): Promise<CaseEvent[]> // newest first, across cases
  listSafetyRules(): Promise<SafetyRule[]>
  listGlobalRules(): Promise<GlobalRule[]>
  subscribe(fn: (e: LiveEvent) => void): () => void
  now(): string
  demo?: DemoControls
}
