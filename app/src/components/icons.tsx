// Small inline status icons. Always decorative (aria-hidden): a visible word carries the meaning.
import type { StatusKey } from '../data/status'

const PATHS: Record<StatusKey, string> = {
  aman: 'M4 10.5l4 4 8-9', // check
  waspada: 'M1.5 10s3-5.5 8.5-5.5S18.5 10 18.5 10s-3 5.5-8.5 5.5S1.5 10 1.5 10zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z', // eye
  bahaya: 'M6 10V4.5a1.2 1.2 0 012.4 0V9m0-5.5v-1a1.2 1.2 0 012.4 0V9m0-5.5a1.2 1.2 0 012.4 0V9m0-3a1.2 1.2 0 012.4 0v6.5a5.5 5.5 0 01-5.5 5.5h-.6a5.5 5.5 0 01-4.6-2.5L3.2 11.4a1.2 1.2 0 011.9-1.4L6 11', // raised hand
  teknisi: 'M12.5 3.5a4 4 0 00-4.9 5.2L3 13.3a1.6 1.6 0 002.3 2.3l4.6-4.6a4 4 0 005.2-4.9l-2.4 2.4-2.2-.6-.6-2.2 2.6-2.2z', // wrench
}

export function StatusIcon(p: { status: StatusKey; size?: number }) {
  const s = p.size ?? 16
  return (
    <svg aria-hidden="true" width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[p.status]} />
    </svg>
  )
}
