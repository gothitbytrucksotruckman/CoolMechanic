export function EmptyState(p: { title: string; reason: string }) {
  return (
    <div className="rounded-card border border-dashed border-line p-6 text-center">
      <p className="font-semibold">{p.title}</p>
      <p className="text-sm text-muted">{p.reason}</p>
    </div>
  )
}
