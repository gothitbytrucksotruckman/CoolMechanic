import { screen } from '@testing-library/react'
import { createMockSource } from '../src/data/mockSource'
import { renderApp } from './render'

test.each([['/', 'Ringkasan'], ['/aturan', 'Aturan Keamanan'], ['/arsitektur', 'Arsitektur'], ['/demo', 'Kontrol Demo']])
('route %s renders inside the shell', async (path, heading) => {
  renderApp(createMockSource(), path)
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy()
})

test('header shows the SIMULATED source badge and the nav never links /demo', async () => {
  renderApp(createMockSource())
  expect(await screen.findByText('SIMULASI')).toBeTruthy()
  const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
  expect(hrefs.some((h) => h?.includes('demo'))).toBe(false)
})
