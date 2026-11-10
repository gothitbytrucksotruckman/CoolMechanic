import { screen } from '@testing-library/react'
import { createMockSource } from '../src/data/mockSource'
import { Overview } from '../src/pages/Overview'
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

test('overview with no cases shows an empty state, not fake rows', async () => {
  renderWithSource(<Overview />, createMockSource())
  expect(await screen.findByText('Belum ada kasus')).toBeTruthy()
  expect(screen.queryAllByTestId('feed-item')).toHaveLength(0)
})
