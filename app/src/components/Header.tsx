import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { useSourceData } from '../data/useSourceData'
import { fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { SourceBadge } from './SourceBadge'

function initialTheme(): 'light' | 'dark' {
  try { const s = localStorage.getItem('cm-theme'); if (s === 'light' || s === 'dark') return s } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function Header() {
  const { t, lang, setLang } = useT()
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('cm-theme', theme) } catch { /* storage blocked */ }
  }, [theme])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const { data } = useSourceData(async (ds) => {
    const now = ds.now()
    const [m] = await ds.listMachines()
    const [latest] = m ? await ds.getReadings(m.id, now, now) : []
    return { now, provenance: latest?.provenance }
  }, [])

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 font-semibold ${isActive ? 'bg-bg text-accent' : 'text-text hover:bg-bg'}`

  return (
    <header className="border-b border-line bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only">{t('app.skip')}</a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="text-xl font-bold">{t('app.name')}</span>
        <nav className="flex flex-wrap gap-1" aria-label={t('nav.label')}>
          <NavLink to="/" end className={link}>{t('nav.overview')}</NavLink>
          <NavLink to="/arsitektur" className={link}>{t('nav.architecture')}</NavLink>
          <NavLink to="/aturan" className={link}>{t('nav.rules')}</NavLink>
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          {data?.provenance && <SourceBadge provenance={data.provenance} />}
          <span className="text-muted num">{t('header.updated')}: {data ? fmtTime(data.now, lang) : t('header.no_data')}</span>
          <div role="group" aria-label={t('header.lang')} className="flex overflow-hidden rounded-lg border border-line">
            {(['id', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 font-bold uppercase ${lang === l ? 'bg-accent text-surface' : ''}`}>{l}</button>
            ))}
          </div>
          <button type="button" className="rounded-lg border border-line px-2.5 py-1.5 font-semibold"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? t('header.theme_light') : t('header.theme_dark')}
          </button>
        </div>
      </div>
    </header>
  )
}
