import { Area, AreaChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useId } from 'react'

function buildSeries(params: {
  n: number
  start: number
  end: number
  seed: number
}) {
  const { n, start, end, seed } = params
  if (n <= 1) return [{ x: 0, y: end }]

  const baseSpan = end - start
  const amp = Math.abs(baseSpan) * 0.18 + Math.abs(end) * 0.002

  const arr: { x: number; y: number }[] = []
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1)
    const wobble = Math.sin(i * 0.85 + seed * 0.01) * Math.cos(i * 0.23 + seed * 0.03)
    const trend = baseSpan * t
    const y = start + trend + wobble * amp
    arr.push({ x: i, y })
  }
  // Ensure endpoints match.
  arr[0] = { x: 0, y: start }
  arr[arr.length - 1] = { x: n - 1, y: end }
  return arr
}

export function EquityPriceChart(props: {
  prevClose: number
  price: number
  up: boolean
  seed: number
  points?: number
}) {
  const { prevClose, price, up, seed, points = 24 } = props
  const id = useId()
  const data = buildSeries({ n: points, start: prevClose, end: price, seed })
  const ys = data.map((d) => d.y)
  const min = Math.min(...ys)
  const max = Math.max(...ys)
  const span = max - min || 1
  const pad = span * 0.12
  const domain: [number, number] = [min - pad, max + pad]

  const fillFrom = up ? '#0a3d0a' : '#3d0a0a'
  const stroke = up ? '#0f0' : '#f44'

  return (
    <div className="bb-eq-chart__chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 8, bottom: 2, left: 8 }}>
          <defs>
            <linearGradient id={`eqFill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillFrom} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis dataKey="x" hide />
          <YAxis domain={domain} hide />
          <ReferenceLine y={prevClose} stroke="#555" strokeDasharray="4 3" />
          <Area
            type="monotone"
            dataKey="y"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#eqFill-${id})`}
            fillOpacity={1}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

