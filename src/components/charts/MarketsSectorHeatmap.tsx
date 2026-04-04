import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { HEATMAP_ABS_PCT_FULL_INTENSITY } from '../../services/market/marketConfig'
import type { HeatTile } from '../../services/market/marketDataStore'
import { bbEchartsBase } from './echarts/bbEchartsTheme'
import { echarts } from './echarts/initEcharts'

type Props = {
  tiles: HeatTile[]
  onSymClick: (sym: string) => void
}

/** Matrix-style sector heat (Apache ECharts heatmap), inspired by matrix examples on [echarts.apache.org](https://echarts.apache.org/examples/en/index.html). */
export function MarketsSectorHeatmap({ tiles, onSymClick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || tiles.length === 0) return

    const syms = tiles.map((t) => t.sym)
    const data: [number, number, number][] = tiles.map((t, x) => [
      x,
      0,
      t.unavailable || t.changePct == null ? 0 : t.changePct,
    ])

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    chart.setOption({
      ...bbEchartsBase,
      grid: { left: 8, right: 72, top: 8, bottom: 36 },
      xAxis: {
        type: 'category',
        data: syms,
        splitArea: { show: true },
        axisLabel: { color: '#aaa', fontSize: 10, rotate: syms.length > 12 ? 38 : 0 },
        axisLine: { lineStyle: { color: '#444' } },
      },
      yAxis: {
        type: 'category',
        data: ['1D %'],
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#888', fontSize: 10 },
      },
      visualMap: {
        min: -HEATMAP_ABS_PCT_FULL_INTENSITY,
        max: HEATMAP_ABS_PCT_FULL_INTENSITY,
        calculable: true,
        orient: 'vertical',
        right: 4,
        top: 'middle',
        text: [`+${HEATMAP_ABS_PCT_FULL_INTENSITY}%`, `-${HEATMAP_ABS_PCT_FULL_INTENSITY}%`],
        textStyle: { color: '#888', fontSize: 10 },
        inRange: {
          color: ['#1a3d2e', '#080808', '#4a2510'],
        },
      },
      series: [
        {
          type: 'heatmap',
          data,
          label: {
            show: true,
            color: '#eaeaea',
            fontSize: 10,
            formatter: (p: { data?: unknown[] }) => {
              const idx = p.data?.[0]
              if (typeof idx !== 'number') return ''
              const t = tiles[idx]
              if (!t) return ''
              if (t.unavailable || t.changePct == null) return `${t.sym}\n—`
              const sign = t.changePct >= 0 ? '+' : ''
              return `${t.sym}\n${sign}${t.changePct.toFixed(1)}%`
            },
          },
          emphasis: {
            itemStyle: { shadowBlur: 6, shadowColor: 'rgba(255,102,0,0.45)' },
          },
        },
      ],
    })

    chart.off('click')
    chart.on('click', (params) => {
      if (params.componentType !== 'series' || params.seriesType !== 'heatmap') return
      const x = (params.data as [number, number, number])[0]
      const sym = tiles[x]?.sym
      if (sym) onSymClick(sym)
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [onSymClick, tiles])

  return <div ref={wrapRef} style={{ width: '100%', height: 220, minHeight: 180 }} />
}
