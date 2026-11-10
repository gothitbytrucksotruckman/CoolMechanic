import { JudgeNote } from '../components/JudgeNote'
import arch from '../data/architecture.json'
import { useT } from '../i18n/i18n'

type Layer = 'machine' | 'site' | 'cloud' | 'people'
type Item = { id: string; layer: string; name_id: string; name_en: string; huawei: boolean; status: string }
const LAYERS: Layer[] = ['machine', 'site', 'cloud', 'people']
const ITEMS = arch as Item[]

function FlowArrow(p: { label: string }) {
  return (
    <div data-testid="arch-flow" className="flex items-center gap-3 py-1 pl-6 text-sm text-muted">
      <svg aria-hidden="true" width="16" height="32" viewBox="0 0 16 32" className="shrink-0">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="2" />
        <polygon points="2,22 14,22 8,31" fill="currentColor" />
      </svg>
      <span>{p.label}</span>
    </div>
  )
}

// Four layers, top to bottom, with what flows between them. Statuses come from architecture.json (ADR-006).
export function Architecture() {
  const { t, lang } = useT()
  const connected = ITEMS.filter((i) => i.status === 'connected').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('page.architecture')}</h1>
      <p className="max-w-3xl text-muted">{t('arch.intro', { n: connected, total: ITEMS.length })}</p>

      <figure className="max-w-4xl">
        <div>
          {LAYERS.map((layer, li) => (
            <div key={layer}>
              <section data-testid="arch-layer" className="rounded-card border border-line bg-surface p-4" aria-label={t(`arch.layer.${layer}`)}>
                <h2 className="mb-1 font-bold">{li + 1}. {t(`arch.layer.${layer}`)}</h2>
                <p className="mb-3 text-sm text-muted">{t(`arch.where.${layer}`)}</p>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ITEMS.filter((i) => i.layer === layer).map((i) => {
                    const on = i.status === 'connected'
                    return (
                      <li key={i.id} className="flex flex-col gap-2 rounded-lg border-2 p-3"
                        style={{ borderColor: on ? 'var(--aman-fg)' : 'var(--border)', borderStyle: on ? 'solid' : 'dashed' }}>
                        <span className="font-semibold">{lang === 'id' ? i.name_id : i.name_en}</span>
                        <span className="flex flex-wrap items-center gap-2 text-xs">
                          {on ? (
                            <span data-testid="arch-connected" className="rounded-full px-2 py-0.5 font-bold" style={{ background: 'var(--aman)', color: 'var(--aman-fg)' }}>✓ {t('arch.connected')}</span>
                          ) : (
                            <span data-testid="arch-planned" className="rounded-full border border-dashed border-line px-2 py-0.5 font-semibold text-muted">{t('arch.planned')}</span>
                          )}
                          {i.huawei && <span className="rounded-full border border-line px-2 py-0.5 font-semibold">Huawei</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
              {li < LAYERS.length - 1 && <FlowArrow label={t(`arch.flow.${layer}`)} />}
            </div>
          ))}
        </div>
        <figcaption className="mt-3 text-sm text-muted">{t('arch.caption')}</figcaption>
      </figure>

      <JudgeNote d="D1">{t('arch.judge')}</JudgeNote>
    </div>
  )
}
