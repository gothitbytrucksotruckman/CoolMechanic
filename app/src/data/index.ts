import { createMockSource } from './mockSource'
import type { DataSource } from './types'

// shortcut: only mock exists; add httpSource in P6
export function createDataSource(kind: string = import.meta.env.VITE_DATA_SOURCE ?? 'mock'): DataSource {
  if (kind === 'http') throw new Error('httpSource arrives in P6')
  return createMockSource()
}
