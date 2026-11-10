import { Outlet, createHashRouter } from 'react-router'
import { Header } from './components/Header'
import { Architecture } from './pages/Architecture'
import { CaseDetail } from './pages/CaseDetail'
import { Demo } from './pages/Demo'
import { MachineDetail } from './pages/MachineDetail'
import { Overview } from './pages/Overview'
import { SafetyRules } from './pages/SafetyRules'

function Layout() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}

// Hash routing so the static build works from any folder or host, offline (ADR-004, ADR-012).
export const routes = [
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: 'mesin/:id', Component: MachineDetail },
      { path: 'kasus/:id', Component: CaseDetail },
      { path: 'aturan', Component: SafetyRules },
      { path: 'arsitektur', Component: Architecture },
      { path: 'demo', Component: Demo }, // never linked from navigation
    ],
  },
]

export const router = createHashRouter(routes)
