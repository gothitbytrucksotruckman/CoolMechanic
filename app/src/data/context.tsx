import { createContext, useContext, type ReactNode } from 'react'
import type { DataSource } from './types'

const Ctx = createContext<DataSource | null>(null)

export function DataSourceProvider(p: { value: DataSource; children: ReactNode }) {
  return <Ctx.Provider value={p.value}>{p.children}</Ctx.Provider>
}

export function useDataSource(): DataSource {
  const ds = useContext(Ctx)
  if (!ds) throw new Error('useDataSource must be used inside DataSourceProvider')
  return ds
}
