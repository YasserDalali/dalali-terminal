import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, bbTooltip } from './bbEchartsTheme'
import { echarts } from './initEcharts'

export type CategoricalBar = { name: string; value: number }

/** Replaces legacy histogram — category axis + gradient bars (ECharts). */
export function CategoricalBarChart(props: {
  bars: CategoricalBar[]
  barColor?: string
  height?: number
  className?: string
}) {
  const { bars, barColor = '#ffcc00', height = 110, className } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || bars.length === 0) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    const names = bars.map((b) => b.name)
    chart.setOption({
      ...bbEchartsBase,
      grid: { left: 8, right: 8, top: 8, bottom: 28 },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#888', fontSize: 9, interval: 0, rotate: names.length > 6 ? 28 : 0 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#444' } },
        splitLine: { lineStyle: { color: '#222' } },
        axisLabel: { color: '#888', fontSize: 9 },
      },
      series: [
        {
          type: 'bar',
          data: bars.map((b) => b.value),
          itemStyle: {
            color: barColor,
            borderRadius: [2, 2, 0, 0],
            opacity: 0.92,
          },
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: (p: { name?: string; value?: number }) =>
          `${p.name ?? ''}: ${Number(p.value ?? 0).toLocaleString()}`,
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [barColor, bars, height])

  return <div ref={wrapRef} className={className} style={{ width: '100%', height, minHeight: height }} />
}
