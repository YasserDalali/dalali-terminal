import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, bbTooltip } from './bbEchartsTheme'
import { echarts } from './initEcharts'

export function TwoSlicePie(props: {
  rows: { name: string; value: number }[]
  colors: [string, string]
  formatTooltip: (v: number) => string
  height?: number
}) {
  const { rows, colors, formatTooltip, height = 116 } = props
  const ref = useRef<HTMLDivElement>(null)
  const inst = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || rows.length < 2) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    inst.current = chart

    chart.setOption({
      ...bbEchartsBase,
      series: [
        {
          type: 'pie',
          radius: ['34%', '58%'],
          data: rows.map((r, i) => ({
            name: r.name,
            value: r.value,
            itemStyle: { color: colors[i % 2]!, borderColor: '#111', borderWidth: 1 },
          })),
          label: { show: false },
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: (p: { name?: string; value?: number }) =>
          `${p.name ?? ''}: ${formatTooltip(Number(p.value ?? 0))}`,
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      inst.current = null
    }
  }, [colors, formatTooltip, rows])

  return <div ref={ref} style={{ width: '100%', height }} />
}
