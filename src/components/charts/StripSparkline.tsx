import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

function buildSeries(values: number[]) {
  return values.map((y, i) => ({ x: i, y }))
}

export function StripSparkline(props: {
  values: number[]
  up: boolean
}) {
  const { values, up } = props
  const data = buildSeries(values)
  const ys = values.filter((v) => Number.isFinite(v))

  const min = ys.length ? Math.min(...ys) : 0
  const max = ys.length ? Math.max(...ys) : 1
  const span = max - min
  const pad = span === 0 ? 1 : span * 0.12

  return (
    <div className={`bb-strip__sparkInner${up ? ' bb-strip__sparkInner--up' : ' bb-strip__sparkInner--dn'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <XAxis dataKey="x" hide />
          <YAxis domain={[min - pad, max + pad]} hide />
          <Line
            type="monotone"
            dataKey="y"
            stroke={up ? '#0f0' : '#f44'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

