import type { CaseEvent, SafetyRule, SafetyStatus } from '../../../contract/schemas'
import { fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { StatusIcon } from './icons'

// What the caretaker saw (ADR-003). Steps render ONLY for allow/observe with a stored rule;
// deny, unknown, or a missing rule always shows "Jangan disentuh" and zero steps (PRD rule 5).
export function CaretakerSteps(p: { safetyStatus: SafetyStatus; rule: SafetyRule | undefined; events: CaseEvent[] }) {
  const { t, lang } = useT()
  const showSteps = (p.safetyStatus === 'allow' || p.safetyStatus === 'observe') && p.rule !== undefined

  if (!showSteps) return (
    <div className="flex items-start gap-3 rounded-card border-2 p-4" style={{ borderColor: 'var(--bahaya-fg)', background: 'var(--bahaya)', color: 'var(--bahaya-fg)' }}>
      <StatusIcon status="bahaya" size={28} />
      <div>
        <p className="text-lg font-bold">Jangan disentuh — teknisi dipanggil</p>
        {lang === 'en' && <p className="font-semibold">Don't touch — a technician has been called</p>}
        <p className="text-sm">{t('case.no_steps')}</p>
      </div>
    </div>
  )

  const shown = new Map(p.events.flatMap((e) => (e.type === 'step_shown' ? [[e.payload.order, e.ts_utc] as const] : [])))
  const done = new Map(p.events.flatMap((e) => (e.type === 'step_done' ? [[e.payload.order, e.ts_utc] as const] : [])))
  const steps = p.rule!.steps.filter((s) => shown.has(s.order))

  if (steps.length === 0) return <p className="text-sm text-muted">{t('case.steps_pending')}</p>

  return (
    <ol className="space-y-2">
      {steps.map((s) => {
        const at = done.get(s.order)
        return (
          <li key={s.order} data-testid="caretaker-step" className="flex items-start gap-3 rounded-lg border border-line p-3">
            <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-bold">{s.order}</span>
            <div className="flex-1">
              <p>{lang === 'id' ? s.text_id : s.text_en}</p>
              <p className="num text-xs" style={{ color: at ? 'var(--aman-fg)' : 'var(--muted)' }}>
                {at ? `✓ ${t('case.step_done')} ${fmtTime(at, lang)}` : t('case.step_waiting')}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
