import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Provenance, Reading, Signal } from '../../../contract/schemas'
import { fmtTime } from '../i18n/format'
import { useT } from '../i18n/i18n'
import { SIGNAL } from '../i18n/labels'
import { SourceBadge } from './SourceBadge'

const COLOR: Record<Signal, string> = {
  temp_box_c: 'var(--sig-box)', temp_condenser_c: 'var(--sig-condenser)', temp_discharge_c: 'var(--sig-discharge)',
  current_rms_a: 'var(--sig-current)', vib_rms_g: 'var(--sig-vib)',
}

export interface ChartMarker { ts_utc: string; label: string; dashed?: boolean }

// One signal over time: normal band shaded, fault onset dashed, fix as a labelled marker (PRD §9.3).
export function SensorChart(p: {
  readings: Reading[]; signal: Signal; band?: { low: number; high: number }
  markers?: ChartMarker[]; provenance: Provenance; height?: number; title?: string
}) {
  const { t, lang } = useT()
  const label = SIGNAL[p.signal]
  const rows = p.readings.map((r) => ({ x: Date.parse(r.ts_utc), y: r[p.signal] }))
  const hasGap = rows.some((r) => r.y === null)
  const values = rows.flatMap((r) => (r.y === null ? [] : [r.y]))
  const lo = Math.min(...values, p.band?.low ?? Infinity), hi = Math.max(...values, p.band?.high ?? -Infinity)
  const pad = (hi - lo) * 0.1 || 1
  const tick = { fontSize: 14, fill: 'var(--muted)' }

  return (
    <figure data-testid="sensor-chart" className="rounded-card border border-line bg-surface p-3">
      <figcaption className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{p.title ?? label[lang]} <span className="text-sm text-muted">({label.unit})</span></span>
        <span className="flex items-center gap-2">
          {hasGap && <span className="text-sm font-semibold" style={{ color: 'var(--bahaya-fg)' }}>{t('chart.gap')}</span>}
          <SourceBadge provenance={p.provenance} />
        </span>
      </figcaption>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t('chart.empty')}</p>
      ) : (
        <ResponsiveContainer width="100%" height={p.height ?? 200} initialDimension={{ width: 600, height: p.height ?? 200 }}>
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="x" type="number" scale="time" domain={['dataMin', 'dataMax']} tick={tick} tickFormatter={(x: number) => fmtTime(new Date(x).toISOString(), lang).replace(' WIB', '')} minTickGap={40} />
            <YAxis tick={tick} width={48} domain={[Math.floor((lo - pad) * 10) / 10, Math.ceil((hi + pad) * 10) / 10]} />
            {p.band && <ReferenceArea y1={p.band.low} y2={p.band.high} fill="var(--band)" stroke="none" ifOverflow="extendDomain" />}
            {p.markers?.map((m) => (
              <ReferenceLine key={m.ts_utc + m.label} x={Date.parse(m.ts_utc)} stroke="var(--text)" strokeWidth={1.5} strokeDasharray={m.dashed ? '5 4' : undefined}
                label={{ value: m.label, position: 'insideTopLeft', fill: 'var(--text)', fontSize: 13, fontWeight: 600 }} />
            ))}
            <Tooltip labelFormatter={(x) => fmtTime(new Date(Number(x)).toISOString(), lang)} formatter={(v) => [`${v} ${label.unit}`, label[lang]]}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Line dataKey="y" stroke={COLOR[p.signal]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </figure>
  )
}
