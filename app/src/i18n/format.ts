import type { Lang } from './i18n'

const TZ = 'Asia/Jakarta' // all seed sites are WIB; per-site timezone when a non-WIB site exists

export function fmtTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' WIB'
}

export function fmtDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' WIB'
}
