import { useT } from '../i18n/i18n'

export function ErrorCard(p: { error: Error }) {
  const { t } = useT()
  return (
    <div role="alert" className="rounded-card border p-4" style={{ borderColor: 'var(--bahaya-fg)', background: 'var(--bahaya)', color: 'var(--bahaya-fg)' }}>
      <p className="font-bold">{t('error.title')}</p>
      <p className="text-sm">{p.error.message}</p>
    </div>
  )
}
