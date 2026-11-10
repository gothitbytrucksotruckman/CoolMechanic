import { fireEvent, screen } from '@testing-library/react'
import { createMockSource } from '../src/data/mockSource'
import type { DataSource } from '../src/data/types'
import { Demo } from '../src/pages/Demo'
import { renderWithSource } from './render'

test('banner says demo control is simulated', async () => {
  renderWithSource(<Demo />, createMockSource(), '/demo')
  expect(await screen.findByText(/Demo control — simulated/)).toBeTruthy()
})

test('Review Focus 1: a second trigger on a busy machine shows the reason', async () => {
  const ds = createMockSource()
  renderWithSource(<Demo />, ds, '/demo')
  fireEvent.change(await screen.findByLabelText('Mesin'), { target: { value: 'm-01' } })
  fireEvent.click(screen.getByRole('button', { name: /condenser_blocked$/ }))
  fireEvent.click(screen.getByRole('button', { name: /electrical_part_fault/ }))
  expect(await screen.findByText('Mesin sedang punya kasus terbuka')).toBeTruthy()
})

test('reset needs a confirm click', async () => {
  const ds = createMockSource(); ds.demo!.advance(5)
  const before = ds.now()
  renderWithSource(<Demo />, ds, '/demo')
  fireEvent.click(await screen.findByRole('button', { name: 'Reset' }))
  expect(ds.now()).toBe(before)
  fireEvent.click(screen.getByRole('button', { name: 'Ya, reset' }))
  expect(ds.now()).not.toBe(before)
})

test('without demo controls the page explains why', async () => {
  const { demo: _omit, ...real } = createMockSource()
  renderWithSource(<Demo />, real as DataSource, '/demo')
  expect(await screen.findByText('Kontrol demo hanya tersedia untuk data simulasi')).toBeTruthy()
})
