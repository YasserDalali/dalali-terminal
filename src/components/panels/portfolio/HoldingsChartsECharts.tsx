import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, bbTooltip } from '../../charts/echarts/bbEchartsTheme'
import { echarts } from '../../charts/echarts/initEcharts'
import type { SankeyLink } from './portfolioHoldingsBuckets'
import { formatUsd, formatUsdMoney } from './portfolioFormat'
import { positiveScalarDomain } from './portfolioChartUtils'

const PIE_COLORS = ['#378ADD', '#ff6600', '#7F77DD', '#1D9E75', '#D85A30', '#E24B4A', '#BA7517', '#639922']

function sliceColor(i: number) {
  return PIE_COLORS[i % PIE_COLORS.length]!
}

export function HoldingsDonutChart(props: {
  rows: { name: string; value: number }[]
  navForPct: number
  height?: number
}) {
  const { rows, navForPct, height = 260 } = props
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || rows.length === 0) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    chart.setOption({
      ...bbEchartsBase,
      series: [
        {
          type: 'pie',
          radius: ['40%', '68%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 3,
            borderColor: '#111',
            borderWidth: 1,
          },
          label: {
            color: '#eaeaea',
            fontSize: 10,
            formatter: (p: { name?: string; percent?: number }) => {
              const pct = p.percent ?? 0
              if (pct < 2.5) return ''
              return `${p.name ?? ''} ${pct.toFixed(1)}%`
            },
          },
          data: rows.map((r, i) => ({
            name: r.name,
            value: r.value,
            itemStyle: { color: sliceColor(i) },
          })),
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: (p: { name?: string; value?: number }) =>
          `${p.name ?? ''}: ${formatUsdMoney(Number(p.value ?? 0))}`,
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [navForPct, rows])

  return <div ref={ref} style={{ width: '100%', height }} />
}

export function HoldingsSankeyChart(props: {
  nodes: { name: string }[]
  links: SankeyLink[]
  height: number
}) {
  const { nodes, links, height } = props
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || links.length === 0) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    const linkData = links.map((l) => ({
      source: nodes[l.source]!.name,
      target: nodes[l.target]!.name,
      value: l.value,
    }))

    chart.setOption({
      ...bbEchartsBase,
      series: [
        {
          type: 'sankey',
          left: 16,
          right: 48,
          top: 24,
          bottom: 16,
          emphasis: { focus: 'adjacency' },
          levels: [
            {
              depth: 0,
              itemStyle: { color: '#fbb4ae', borderColor: '#d48265' },
              lineStyle: { color: 'source', opacity: 0.55 },
            },
            {
              depth: 1,
              itemStyle: { color: '#b3cde3', borderColor: '#6495ed' },
              lineStyle: { color: 'source', opacity: 0.5 },
            },
            {
              depth: 2,
              itemStyle: { color: '#ccebc5', borderColor: '#7cba6a' },
              lineStyle: { color: 'source', opacity: 0.45 },
            },
            {
              depth: 3,
              itemStyle: { color: '#decbe4', borderColor: '#9b7bbd' },
              lineStyle: { color: 'source', opacity: 0.4 },
            },
          ],
          data: nodes.map((n) => ({ name: n.name })),
          links: linkData,
          lineStyle: { curveness: 0.5 },
          label: { color: '#ddd', fontSize: 10 },
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: (p: { dataType?: string; name?: string; value?: number; data?: { source?: string; target?: string } }) => {
          if (p.dataType === 'edge' && p.data) {
            return `${p.data.source} → ${p.data.target}<br/>${formatUsdMoney(p.value ?? 0)}`
          }
          return `${p.name ?? ''}: ${formatUsdMoney(p.value ?? 0)}`
        },
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [height, links, nodes])

  return <div ref={ref} style={{ width: '100%', height }} />
}

export function HoldingsSectorBarChart(props: {
  sectorBars: { name: string; value: number }[]
  height: number
}) {
  const { sectorBars, height } = props
  const ref = useRef<HTMLDivElement>(null)

  const domain = positiveScalarDomain(
    sectorBars.map((b) => b.value),
    false,
  )

  useEffect(() => {
    const el = ref.current
    if (!el || sectorBars.length === 0) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    const names = sectorBars.map((b) => b.name)

    chart.setOption({
      ...bbEchartsBase,
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        min: domain?.[0] ?? 0,
        axisLine: { lineStyle: { color: '#444' } },
        splitLine: { lineStyle: { color: '#222' } },
        axisLabel: { color: '#888', fontSize: 9, formatter: (v: number) => formatUsd(v) },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#aaa', fontSize: 10, width: 110, overflow: 'truncate' },
        inverse: true,
      },
      series: [
        {
          type: 'bar',
          data: sectorBars.map((b) => b.value),
          itemStyle: {
            borderRadius: [0, 2, 2, 0],
            color: (p: { dataIndex?: number }) => sliceColor(p.dataIndex ?? 0),
          },
          label: {
            show: true,
            position: 'right',
            color: '#ccc',
            fontSize: 10,
            formatter: (p: { value?: number }) => (Number.isFinite(p.value) ? formatUsd(p.value!) : ''),
          },
        },
      ],
      tooltip: {
        ...bbTooltip,
        formatter: (p: { name?: string; value?: number }) =>
          `${p.name ?? ''}: ${formatUsdMoney(Number(p.value ?? 0))}`,
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [domain, sectorBars])

  return <div ref={ref} style={{ width: '100%', height }} />
}
