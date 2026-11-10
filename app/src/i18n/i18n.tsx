import { createContext, useContext, useState, type ReactNode } from 'react'
import en from './en.json'
import id from './id.json'

export type Lang = 'id' | 'en'
type Dict = { [k: string]: string | Dict }
const DICTS: Record<Lang, Dict> = { id, en }

function lookup(d: Dict, key: string): string | undefined {
  let cur: string | Dict | undefined = d
  for (const part of key.split('.')) cur = typeof cur === 'object' ? cur[part] : undefined
  return typeof cur === 'string' ? cur : undefined
}

interface I18n { t: (key: string, vars?: Record<string, string | number>) => string; lang: Lang; setLang(l: Lang): void }
const Ctx = createContext<I18n | null>(null)

export function I18nProvider(p: { children: ReactNode; initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(p.initial ?? 'id')
  const t: I18n['t'] = (key, vars) => {
    // Missing EN falls back to ID; the raw key only shows if ID is missing too (a bug a test should catch).
    let s = lookup(DICTS[lang], key) ?? lookup(DICTS.id, key) ?? key
    for (const [k, v] of Object.entries(vars ?? {})) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }
  return <Ctx.Provider value={{ t, lang, setLang }}>{p.children}</Ctx.Provider>
}

export function useT(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useT must be used inside I18nProvider')
  return v
}
