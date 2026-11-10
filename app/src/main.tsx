import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './App'
import { createDataSource } from './data'
import { DataSourceProvider } from './data/context'
import { I18nProvider } from './i18n/i18n'
import './styles/index.css'

const ds = createDataSource()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataSourceProvider value={ds}>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </DataSourceProvider>
  </StrictMode>,
)
