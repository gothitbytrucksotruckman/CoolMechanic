import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { routes } from '../src/App'
import { DataSourceProvider } from '../src/data/context'
import type { DataSource } from '../src/data/types'
import { I18nProvider } from '../src/i18n/i18n'

// Renders one page element at `path`, matched against the app's real route patterns.
export function renderWithSource(ui: ReactElement, ds: DataSource, path = '/') {
  const patterns = routes[0].children.map((r) => ({ path: r.index ? '/' : `/${r.path}`, element: ui }))
  const router = createMemoryRouter(patterns, { initialEntries: [path] })
  return render(
    <DataSourceProvider value={ds}>
      <I18nProvider><RouterProvider router={router} /></I18nProvider>
    </DataSourceProvider>,
  )
}

// Renders the whole app (layout + header) at `path`.
export function renderApp(ds: DataSource, path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <DataSourceProvider value={ds}>
      <I18nProvider><RouterProvider router={router} /></I18nProvider>
    </DataSourceProvider>,
  )
}
