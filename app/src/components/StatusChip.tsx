import type { StatusKey } from '../data/status'
import { useT } from '../i18n/i18n'
import { StatusIcon } from './icons'

// Colour + icon + word, never colour alone (PRD §9.2.4).
export function StatusChip(p: { status: StatusKey; label?: string }) {
  const { t } = useT()
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap"
      style={{ background: `var(--${p.status})`, color: `var(--${p.status}-fg)` }}
    >
      <StatusIcon status={p.status} />
      {p.label ?? t(`status.${p.status}`)}
    </span>
  )
}
