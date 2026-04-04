import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, areaGradientColors } from './echarts/bbEchartsTheme'
import { echarts } from './echarts/initEcharts'
import { syntheticBusinessDaySeries } from './lightweight/timeFormat'

export function StripSparkline(props: { values: number[]; up: boolean }) {
  const { values, up } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || values.length < 2) return

    const stroke = up ? '#0f0' : '#f44'
    const [g0, g1] = areaGradientColors(up)
    const cats = syntheticBusinessDaySeries(values.length)

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    chart.setOption({
      ...bbEchartsBase,
      grid: { left: 0, right: 0, top: 2, bottom: 0 },
      xAxis: { type: 'category', data: cats, show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: { show: false },
      series: [
        {
          type: 'line',
          symbol: 'none',
          lineStyle: { width: 2, color: stroke },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: g0 },
              { offset: 1, color: g1 },
            ]),
          },
          data: values,
        },
      ],
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [up, values])

  return (
    <div className={`bb-strip__sparkInner${up ? ' bb-strip__sparkInner--up' : ' bb-strip__sparkInner--dn'}`}>
      <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 24 }} />
    </div>
  )
}
