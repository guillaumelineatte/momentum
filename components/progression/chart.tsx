'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import type { PointSerie } from '@/lib/data/progression'

export function ProgressionChart({
  donnees,
  unite,
  pointDepart,
}: {
  donnees: PointSerie[]
  unite: string
  pointDepart?: number
}) {
  if (donnees.length === 0) {
    return <div className="chart-empty">Pas encore assez de données pour cette période.</div>
  }

  const valeurs = donnees.map((d) => d.valeur)
  const min = Math.min(...valeurs, pointDepart ?? Infinity)
  const max = Math.max(...valeurs, pointDepart ?? -Infinity)
  const marge = Math.max((max - min) * 0.15, 1)

  return (
    <>
      {pointDepart != null && (
        <div className="chart-legend-note"><i /> Point de départ : {pointDepart} {unite}</div>
      )}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={donnees} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(182,167,172,.8)', fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5).replace('-', '/')}
              axisLine={{ stroke: 'rgba(255,255,255,.1)' }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[min - marge, max + marge]}
              tick={{ fill: 'rgba(182,167,172,.8)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{ background: '#2a1119', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#b6a7ac' }}
              formatter={(value) => [`${value} ${unite}`, '']}
              labelFormatter={(v) => v}
            />
            {pointDepart != null && (
              <ReferenceLine y={pointDepart} stroke="var(--gold)" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            <Line
              type="monotone"
              dataKey="valeur"
              stroke="var(--coral-bright)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--coral-bright)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
