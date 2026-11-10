import type { ReactNode } from 'react'
import { useT } from '../i18n/i18n'

// Explanation tags for judges (ADR-002). One flag hides them all for real owners.
export const JUDGE_NOTES_ON = (import.meta.env.VITE_JUDGE_NOTES ?? 'on') === 'on'

export function JudgeNote(p: { d: 'D1' | 'D2' | 'D3'; children: ReactNode }) {
  const { t } = useT()
  if (!JUDGE_NOTES_ON) return null
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted">
      <span className="font-bold text-accent whitespace-nowrap" title={t('judge.label')}>{p.d}</span>
      <span>{p.children}</span>
    </p>
  )
}
