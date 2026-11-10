import type { Case, CaseEvent, CaseEventType } from '../../../contract/schemas'
import { fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { EVENT } from '../i18n/labels'

type Step = 'sense' | 'diagnose' | 'guide' | 'verify' | 'dispatch'
type Cell = { kind: 'done'; ts: string; detail: string } | { kind: 'na'; text: string } | { kind: 'pending' }

// Sense → Diagnose → Guide → Verify → Dispatch, read left to right with timestamps (PRD §9.2.2).
export function CaseTimeline(p: { case: Case; events: CaseEvent[] }) {
  const { t, lang } = useT()
  const first = (...types: CaseEventType[]) => p.events.find((e) => types.includes(e.type))
  const last = (...types: CaseEventType[]) => [...p.events].reverse().find((e) => types.includes(e.type))
  const deny = p.case.safety_status === 'deny'

  const cell = (e: CaseEvent | undefined, detail?: string): Cell | undefined => e && { kind: 'done', ts: e.ts_utc, detail: detail ?? EVENT[e.type][lang] }
  const verdict = last('verify_pass', 'verify_fail')
  const steps: Record<Step, Cell> = {
    sense: cell(first('alert')) ?? { kind: 'pending' },
    diagnose: cell(first('safety_check'), t(`safety.${p.case.safety_status}`)) ?? { kind: 'pending' },
    guide: deny ? { kind: 'na', text: t('timeline.skipped_deny') } : cell(last('step_done') ?? first('step_shown')) ?? { kind: 'pending' },
    verify: deny ? { kind: 'na', text: t('timeline.not_needed') } : cell(verdict ?? first('verify_start')) ?? { kind: 'pending' },
    dispatch: cell(first('dispatched')) ?? (p.case.state === 'RESOLVED' ? { kind: 'na', text: t('timeline.not_needed') } : { kind: 'pending' }),
  }

  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label={t('timeline.label')}>
      {(Object.keys(steps) as Step[]).map((k, i) => {
        const c = steps[k]
        const border = c.kind === 'done' ? 'var(--accent)' : 'var(--border)'
        return (
          <li key={k} data-testid={`step-${k}`} className="rounded-card border-2 bg-surface p-3" style={{ borderColor: border, borderStyle: c.kind === 'pending' ? 'dashed' : 'solid' }}>
            <p className="text-xs font-bold uppercase text-muted">{i + 1}. {t(`timeline.${k}`)}</p>
            {c.kind === 'done' && <><p className="num text-lg font-bold">{fmtTime(c.ts, lang)}</p><p className="text-sm">{c.detail}</p></>}
            {c.kind === 'na' && <p className="mt-1 text-sm text-muted">{c.text}</p>}
            {c.kind === 'pending' && <p className="mt-1 text-sm text-muted">{t('timeline.pending')}</p>}
          </li>
        )
      })}
    </ol>
  )
}
