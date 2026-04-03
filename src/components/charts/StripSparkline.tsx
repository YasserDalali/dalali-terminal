import { createChart, LineSeries, LineStyle } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { lcLastPriceOff, sparklineChartOptions } from './lightweight/terminalLightweightTheme'
import { syntheticBusinessDaySeries } from './lightweight/timeFormat'

function buildSeries(values: number[]) {
  return values.map((y, i) => ({ x: i, y }))
}

export function StripSparkline(props: { values: number[]; up: boolean }) {
  const { values, up } = props
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const stroke = up ? '#0f0' : '#f44'
    const chart = createChart(el, { ...sparklineChartOptions(), autoSize: true })
    const line = chart.addSeries(LineSeries, {
      color: stroke,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      ...lcLastPriceOff,
    })

    const data = buildSeries(values)
    const times = syntheticBusinessDaySeries(data.length)
    line.setData(times.map((time, i) => ({ time, value: data[i]!.y })))
    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [up, values])

  return (
    <div className={`bb-strip__sparkInner${up ? ' bb-strip__sparkInner--up' : ' bb-strip__sparkInner--dn'}`}>
      <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 24 }} />
    </div>
  )
}
