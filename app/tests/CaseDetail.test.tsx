import { render, screen } from '@testing-library/react'
import { SAFETY_RULES } from '../../mock/seed'
import { CaretakerSteps } from '../src/components/CaretakerSteps'
import { createMockSource } from '../src/data/mockSource'
import { I18nProvider } from '../src/i18n/i18n'
import { CaseDetail } from '../src/pages/CaseDetail'
import { renderWithSource } from './render'

const allowRule = SAFETY_RULES.find(r => r.fault_code === 'condenser_blocked')!

test('deny case renders zero steps even when the rule data contains steps', () => {
  render(<I18nProvider><CaretakerSteps safetyStatus="deny" rule={allowRule} events={[]} /></I18nProvider>)
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.getByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
})

test('Review Focus 4: missing rule is treated as deny', () => {
  render(<I18nProvider><CaretakerSteps safetyStatus="allow" rule={undefined} events={[]} /></I18nProvider>)
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.getByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
})

test.each(['electrical_part_fault', 'unknown_anomaly'] as const)('%s page: no steps, work order shown', async (sc) => {
  const ds = createMockSource(); ds.demo!.trigger(sc, 'm-04'); ds.demo!.advance(15)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect(await screen.findByText('Jangan disentuh — teknisi dipanggil')).toBeTruthy()
  expect(screen.queryAllByTestId('caretaker-step')).toHaveLength(0)
  expect(screen.getByTestId('work-order').textContent).toContain('[CoolMechanic] Order servis #case-0001')
  expect(screen.getByTestId('step-guide').textContent).toContain('dilewati: daftar larangan')
})

test('resolved case shows 4 done steps and no dispatch', async () => {
  const ds = createMockSource(); ds.demo!.trigger('condenser_blocked', 'm-01'); ds.demo!.advance(40)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect(await screen.findAllByTestId('caretaker-step')).toHaveLength(4)
  expect(screen.getByTestId('step-dispatch').textContent).toContain('tidak diperlukan')
  expect(screen.queryByTestId('work-order')).toBeNull()
  expect(screen.getByTestId('step-verify').textContent).toContain('Perbaikan berhasil')
})

test('not-fixed case shows the failed check and the work order', async () => {
  const ds = createMockSource(); ds.demo!.trigger('condenser_blocked_not_fixed', 'm-02'); ds.demo!.advance(40)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect(await screen.findAllByTestId('caretaker-step')).toHaveLength(4)
  expect(screen.getByTestId('step-verify').textContent).toContain('Perbaikan belum berhasil')
  expect(screen.getByTestId('work-order').textContent).toContain('Sudah dicoba pengelola: Cabut steker')
})

test('a case still guiding shows pending later steps', async () => {
  const ds = createMockSource(); ds.demo!.trigger('condenser_blocked', 'm-01'); ds.demo!.advance(9)
  renderWithSource(<CaseDetail />, ds, '/kasus/case-0001')
  expect((await screen.findByTestId('step-verify')).textContent).toContain('menunggu')
})

test('Review Focus 3: stale case link shows not found', async () => {
  renderWithSource(<CaseDetail />, createMockSource(), '/kasus/case-0001')
  expect(await screen.findByText('Kasus tidak ditemukan')).toBeTruthy()
})
