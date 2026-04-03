import { LineChart, Line, XAxis, YAxis } from 'recharts'

function parseY(v: string | null | undefined): number | null {
  if (v == null) return null
  const s = v.trim()
  if (!s || s === '—' || s === '-') return null

  // Strip units like B/T/M and symbols like %.
  // Keep digits, sign, dot, and exponent characters.
  const m = s.match(/-?\d*\.?\d+(?:[eE][+-]?\d+)?/)
  if (!m) return null

  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export function FinancialSparkline(props: {
  values: (string | null)[] | (string | null | undefined)[]
  estimateFromIndex: number | null
}) {
  const { values, estimateFromIndex } = props

  const chartData = values.map((v, i) => {
    const y = parseY(v)
    return {
      x: i,
      y,
      ySolid: y != null && (estimateFromIndex == null || i < estimateFromIndex) ? y : null,
      yEst: y != null && estimateFromIndex != null && i >= estimateFromIndex ? y : null,
    }
  })

  const ys = chartData.map((d) => d.y).filter((v): v is number => v != null)
  const hasEnough = ys.length >= 2

  // Keep the scale stable for small sparklines.
  const min = hasEnough ? Math.min(...ys) : 0
  const max = hasEnough ? Math.max(...ys) : 1
  const span = max - min
  const pad = span === 0 ? 1 : span * 0.12
  const yDomain = [min - pad, max + pad] as const

  const first = chartData.find((d) => d.y != null)?.y
  const last = [...chartData].reverse().find((d) => d.y != null)?.y
  const isUp = first != null && last != null ? last >= first : true

  return (
    <div className="bb-eq-fin__spark" aria-hidden="true">
      {hasEnough ? (
        <LineChart
          width={150}
          height={22}
          data={chartData}
          margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
        >
          <XAxis dataKey="x" hide />
          <YAxis domain={yDomain} hide />
          <Line
            type="monotone"
            dataKey="ySolid"
            stroke={isUp ? '#0f0' : '#f44'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          {estimateFromIndex != null ? (
            <Line
              type="monotone"
              dataKey="yEst"
              stroke="#ffcc00"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          ) : null}
        </LineChart>
      ) : null}
    </div>
  )
}

