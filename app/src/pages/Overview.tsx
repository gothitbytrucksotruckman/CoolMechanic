import { useT } from '../i18n/i18n'

export function Overview() {
  const { t } = useT()
  return <h1 className="text-2xl font-bold">{t('page.overview')}</h1>
}
