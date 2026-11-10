import type { Provenance } from '../../../contract/schemas'
import { useT } from '../i18n/i18n'

// Always-visible data source label (PRD rule 2). Text comes from the data's provenance.
export function SourceBadge(p: { provenance: Provenance }) {
  const { t } = useT()
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide"
      style={{ borderColor: 'var(--waspada-fg)', color: 'var(--waspada-fg)', background: 'var(--waspada)' }}
      title={t('header.source')}
    >
      {t(`source.${p.provenance}`)}
    </span>
  )
}
