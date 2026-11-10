import { screen } from '@testing-library/react'
import { createMockSource } from '../src/data/mockSource'
import { MachineDetail } from '../src/pages/MachineDetail'
import { Overview } from '../src/pages/Overview'
import { SafetyRules } from '../src/pages/SafetyRules'
import { renderWithSource } from './render'

function fixture() {
  const ds = createMockSource(); ds.demo!.trigger('electrical_part_fault', 'm-04'); ds.demo!.advance(10)
  return ds
}

test('overview counts come from data', async () => {
  renderWithSource(<Overview />, fixture())
  expect((await screen.findByTestId('count-teknisi')).textContent).toBe('1')
  expect(screen.getByTestId('count-aman').textContent).toBe('4')
  expect(screen.getAllByTestId('machine-card')[0].textContent).toContain('Kulkas Minuman')  // attention first
})

test('overview shows the case feed and resolved vs dispatched counts', async () => {
  renderWithSource(<Overview />, fixture())
  expect((await screen.findByTestId('count-dispatched')).textContent).toBe('1')
  expect(screen.getByTestId('count-resolved').textContent).toBe('0')
  expect(screen.getAllByTestId('feed-item').length).toBeGreaterThan(0)
})

test('machine detail shows profile, sensor health and case history', async () => {
  renderWithSource(<MachineDetail />, fixture(), '/mesin/m-04')
  expect(await screen.findByText('Merek D UF-400')).toBeTruthy()
  expect(screen.getByTestId('sensor-health').textContent).toContain('5/5')
  expect(screen.getAllByTestId('case-row')).toHaveLength(1)
  expect(screen.getAllByTestId('sensor-chart')).toHaveLength(5)
})

test('unknown machine id shows an empty state', async () => {
  renderWithSource(<MachineDetail />, fixture(), '/mesin/m-99')
  expect(await screen.findByText('Mesin tidak ditemukan')).toBeTruthy()
})

test('a probe gap in the chart window is labelled "sensor lepas"', async () => {
  const ds = createMockSource()
  renderWithSource(<MachineDetail />, ds, '/mesin/m-01') // m-01 discharge dropout is 3h before start: inside the 3h window edge
  expect(await screen.findByText(/sensor lepas/)).toBeTruthy()
})

test('safety page shows every stored rule and global rule, read-only', async () => {
  renderWithSource(<SafetyRules />, createMockSource())
  expect(await screen.findAllByTestId('rule-row')).toHaveLength(10)
  expect(screen.getAllByTestId('global-rule')).toHaveLength(3)
  expect(screen.queryAllByRole('button')).toHaveLength(0)
})

test('safety page text comes from the stored rules', async () => {
  renderWithSource(<SafetyRules />, createMockSource())
  const rows = await screen.findAllByTestId('rule-row')
  const deny = rows.find((r) => r.textContent?.includes('Motor kipas rusak'))!
  expect(deny.textContent).toContain('langsung ke teknisi')
  expect(rows.some((r) => r.textContent?.includes('Sikat debu dari bagian luar kisi-kisi dengan sikat kering.'))).toBe(true)
})

test('overview with no cases shows an empty state, not fake rows', async () => {
  renderWithSource(<Overview />, createMockSource())
  expect(await screen.findByText('Belum ada kasus')).toBeTruthy()
  expect(screen.queryAllByTestId('feed-item')).toHaveLength(0)
})
