import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, bbTooltip } from './bbEchartsTheme'
import { echarts } from './initEcharts'

export function DebtRatioGauge(props: { pct: number; height?: number }) {
  const { pct, height = 112 } = props
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    const needle =
      pct > 35 ? '#f44' : pct > 25 ? '#ffcc00' : '#0f0'

    chart.setOption({
      ...bbEchartsBase,
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          splitNumber: 5,
          startAngle: 180,
          endAngle: 0,
          radius: '100%',
          center: ['50%', '75%'],
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.25, '#0f0'],
                [0.35, '#ffcc00'],
                [1, '#f44'],
              ],
            },
          },
          pointer: { length: '55%', width: 4, itemStyle: { color: needle } },
          axisTick: { distance: -10, length: 5, lineStyle: { color: '#666' } },
          splitLine: { distance: -12, length: 10, lineStyle: { color: '#666' } },
          axisLabel: { distance: -6, color: '#888', fontSize: 9 },
          detail: {
            valueAnimation: true,
            fontSize: 14,
            color: '#ddd',
            formatter: '{value}%',
            offsetCenter: [0, '22%'],
          },
          data: [{ value: pct }],
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: () => `debt ratio: ${pct.toFixed(1)}%`,
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [pct])

  return <div ref={ref} style={{ width: '100%', height }} />
}
