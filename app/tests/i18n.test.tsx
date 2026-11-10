import { render, screen } from '@testing-library/react'
import { I18nProvider, useT } from '../src/i18n/i18n'
import en from '../src/i18n/en.json'
import id from '../src/i18n/id.json'

// Review Focus 5
test('missing EN key falls back to the ID string', () => {
  const Probe = () => <span>{useT().t('test.only_in_id')}</span>
  render(<I18nProvider initial="en"><Probe /></I18nProvider>)
  expect(screen.getByText('Hanya ada di ID')).toBeTruthy()
})

test('EN is used when the key exists', () => {
  const Probe = () => <span>{useT().t('status.aman')}</span>
  render(<I18nProvider initial="en"><Probe /></I18nProvider>)
  expect(screen.getByText('OK')).toBeTruthy()
})

const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])

test('every EN key also exists in ID', () => {
  const idKeys = new Set(keys(id))
  expect(keys(en).filter((k) => !idKeys.has(k))).toEqual([])
})

test('EN is complete: every ID key except test fixtures has an EN string', () => {
  const enKeys = new Set(keys(en))
  expect(keys(id).filter((k) => !k.startsWith('test.') && !enKeys.has(k))).toEqual([])
})
