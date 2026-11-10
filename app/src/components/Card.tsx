import type { ReactNode } from 'react'

export function Card(p: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 ${p.className ?? ''}`}>
      {p.title && <h2 className="mb-3 text-lg font-bold">{p.title}</h2>}
      {p.children}
    </section>
  )
}
