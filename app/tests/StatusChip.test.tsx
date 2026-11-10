import { render, screen } from '@testing-library/react'
import { StatusChip } from '../src/components/StatusChip'
import { I18nProvider } from '../src/i18n/i18n'

test.each([['aman','Aman'],['waspada','Waspada'],['bahaya','Jangan disentuh'],['teknisi','Teknisi dipanggil']] as const)
('%s shows icon and word', (s, word) => {
  const { container } = render(<I18nProvider><StatusChip status={s} /></I18nProvider>)
  expect(screen.getByText(word)).toBeTruthy(); expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})
