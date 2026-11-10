import { useEffect, useRef, useState } from 'react'
import { useDataSource } from './context'
import type { DataSource } from './types'

const THROTTLE_MS = 250

// Loads on mount, when deps change, and again on live events (at most once per 250 ms).
export function useSourceData<T>(load: (ds: DataSource) => Promise<T>, deps: unknown[]): { data?: T; error?: Error; loading: boolean } {
  const ds = useDataSource()
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true })
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    let alive = true
    let pending: ReturnType<typeof setTimeout> | undefined
    const run = () => {
      pending = undefined
      loadRef.current(ds).then(
        (data) => alive && setState({ data, loading: false }),
        (error: unknown) => alive && setState({ error: error instanceof Error ? error : new Error(String(error)), loading: false }),
      )
    }
    run()
    const off = ds.subscribe(() => { if (pending === undefined) pending = setTimeout(run, THROTTLE_MS) })
    return () => { alive = false; off(); if (pending !== undefined) clearTimeout(pending) }
  }, [ds, ...deps])

  return state
}
