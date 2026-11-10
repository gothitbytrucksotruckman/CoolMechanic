import type { Dispatch } from '../../../contract/schemas'
import { fmtDateTime } from '../i18n/format'
import { useT } from '../i18n/i18n'

// The technician message exactly as stored (ADR-008). The UI never rebuilds it.
export function WorkOrderPreview(p: { dispatch: Dispatch }) {
  const { t, lang } = useT()
  const d = p.dispatch
  return (
    <div>
      <p className="mb-2 text-sm text-muted">
        {t(`channel.${d.channel}`)} · <span className="num">{fmtDateTime(d.sent_at, lang)}</span> · {t(`delivery.${d.delivery_status}`)}
      </p>
      <pre data-testid="work-order" className="whitespace-pre-wrap rounded-card border border-line bg-bg p-4 font-sans text-sm leading-relaxed">{d.message_text}</pre>
    </div>
  )
}
