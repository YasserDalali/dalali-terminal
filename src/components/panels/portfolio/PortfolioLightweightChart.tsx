import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase, bbTooltip } from '../../charts/echarts/bbEchartsTheme'
import { echarts } from '../../charts/echarts/initEcharts'
import type { NavSeriesVisibility } from './portfolioChartUtils'
import { formatUsd } from './portfolioFormat'

export type PortfolioNavChartRow = {
  dateLabel: string
  sortKey: string
  total: number
  cash: number
  stock: number
}

export type PortfolioPerfChartRow = {
  dateLabel: string
  sortKey: string
  portPct: number
  spyPct: number | null
  qqqPct: number | null
  iwmPct: number | null
  diaPct: number | null
}

export type PortfolioBenchDef = { id: string; short: string; color: string }

type Props = {
  chartMode: 'nav' | 'perf'
  logScale: boolean
  truncated: boolean
  navRows: PortfolioNavChartRow[]
  perfRows: PortfolioPerfChartRow[]
  navLines: NavSeriesVisibility
  benchOn: Record<string, boolean>
  benchmarks: PortfolioBenchDef[]
  navYDomain?: [number, number]
  perfYDomain?: [number, number]
}

function navTooltipFormatter(
  axisIdx: number,
  navRows: PortfolioNavChartRow[],
  navLines: NavSeriesVisibility,
): string {
  const row = navRows[axisIdx]
  if (!row) return ''
  const bits = [`<div style="font-weight:600;margin-bottom:4px">${row.dateLabel}</div>`]
  if (navLines.total) bits.push(`<div>Total: <span style="color:#0f0">${formatUsd(row.total)}</span></div>`)
  if (navLines.stock) bits.push(`<div>Stock: <span style="color:#ff6600">${formatUsd(row.stock)}</span></div>`)
  if (navLines.cash) bits.push(`<div>Cash: <span style="color:#7F77DD">${formatUsd(row.cash)}</span></div>`)
  return bits.join('')
}

function perfTooltipFormatter(
  perfRow: PortfolioPerfChartRow,
  benchOn: Record<string, boolean>,
  benchmarks: PortfolioBenchDef[],
): string {
  const bits = [`<div style="font-weight:600;margin-bottom:4px">${perfRow.dateLabel}</div>`]
  bits.push(`<div>Port: <span style="color:#f44">${perfRow.portPct.toFixed(2)}%</span></div>`)
  for (const b of benchmarks) {
    if (!benchOn[b.id]) continue
    const v = perfRow[`${b.id}Pct` as keyof PortfolioPerfChartRow]
    if (typeof v === 'number')
      bits.push(`<div>${b.short}: <span style="color:${b.color}">${v.toFixed(2)}%</span></div>`)
  }
  return bits.join('')
}

export function PortfolioLightweightChart(props: Props) {
  const {
    chartMode,
    logScale,
    truncated,
    navRows,
    perfRows,
    navLines,
    benchOn,
    benchmarks,
    navYDomain,
    perfYDomain,
  } = props

  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (chartMode === 'nav' && navRows.length === 0) return
    if (chartMode === 'perf' && perfRows.length === 0) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    const graphicWatermark = {
      type: 'text' as const,
      left: 'center',
      top: 'middle',
      style: {
        text: chartMode === 'nav' ? 'NAV' : 'PERF %',
        fontSize: 52,
        fill: 'rgba(55,55,55,0.14)',
        fontWeight: 'normal',
      },
      z: -1,
    }

    if (chartMode === 'nav') {
      const cats = navRows.map((r) => r.dateLabel)

      const yAxis: object = {
        type: logScale ? ('log' as const) : ('value' as const),
        scale: !truncated || !navYDomain,
        min: truncated && navYDomain ? navYDomain[0] : undefined,
        max: truncated && navYDomain ? navYDomain[1] : undefined,
        axisLine: { lineStyle: { color: '#444' } },
        splitLine: { lineStyle: { color: '#222' } },
        axisLabel: { color: '#888', formatter: (v: number) => formatUsd(v) },
        logBase: 10,
      }

      chart.setOption({
        ...bbEchartsBase,
        graphic: [graphicWatermark],
        grid: { left: 52, right: 10, top: 20, bottom: 48 },
        xAxis: {
          type: 'category',
          data: cats,
          axisLine: { lineStyle: { color: '#444' } },
          axisLabel: { color: '#888', fontSize: 9, rotate: cats.length > 14 ? 32 : 0 },
        },
        yAxis,
        dataZoom: [
          { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
          {
            type: 'slider',
            xAxisIndex: 0,
            height: 14,
            bottom: 6,
            filterMode: 'none',
            borderColor: '#444',
            handleStyle: { color: '#ff6600' },
            textStyle: { fontSize: 9, color: '#888' },
          },
        ],
        tooltip: {
          ...bbTooltip,
          trigger: 'axis',
          axisPointer: { type: 'cross', crossStyle: { color: '#555' } },
          formatter: (items: unknown) => {
            const arr = Array.isArray(items) ? items : [items]
            const idx = (arr[0] as { dataIndex?: number } | undefined)?.dataIndex
            if (idx == null) return ''
            return navTooltipFormatter(idx, navRows, navLines)
          },
        },
        series: [
          {
            type: 'line',
            name: 'Total NAV',
            show: navLines.total,
            showSymbol: false,
            data: navRows.map((r) => r.total),
            lineStyle: { width: 2, color: '#0f0' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0,255,80,0.22)' },
                { offset: 1, color: 'rgba(0,0,0,0)' },
              ]),
            },
          },
          {
            type: 'line',
            name: 'Stock',
            show: navLines.stock,
            showSymbol: false,
            data: navRows.map((r) => r.stock),
            lineStyle: { width: 2, color: '#ff6600' },
          },
          {
            type: 'line',
            name: 'Cash',
            show: navLines.cash,
            showSymbol: false,
            data: navRows.map((r) => r.cash),
            lineStyle: { width: 2, color: '#7F77DD' },
          },
        ],
      })
    } else {
      const cats = perfRows.map((r) => r.dateLabel)

      chart.setOption({
        ...bbEchartsBase,
        graphic: [graphicWatermark],
        grid: { left: 48, right: 10, top: 20, bottom: 48 },
        xAxis: {
          type: 'category',
          data: cats,
          axisLine: { lineStyle: { color: '#444' } },
          axisLabel: { color: '#888', fontSize: 9, rotate: cats.length > 14 ? 32 : 0 },
        },
        yAxis: {
          type: 'value',
          scale: !truncated || !perfYDomain,
          min: truncated && perfYDomain ? perfYDomain[0] : undefined,
          max: truncated && perfYDomain ? perfYDomain[1] : undefined,
          axisLine: { lineStyle: { color: '#444' } },
          splitLine: { lineStyle: { color: '#222' } },
          axisLabel: { color: '#888', formatter: (v: number) => `${v.toFixed(1)}%` },
        },
        dataZoom: [
          { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
          {
            type: 'slider',
            xAxisIndex: 0,
            height: 14,
            bottom: 6,
            filterMode: 'none',
            borderColor: '#444',
            handleStyle: { color: '#ff6600' },
            textStyle: { fontSize: 9, color: '#888' },
          },
        ],
        tooltip: {
          ...bbTooltip,
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: (items: unknown) => {
            const arr = Array.isArray(items) ? items : [items]
            const idx = (arr[0] as { dataIndex?: number } | undefined)?.dataIndex
            if (idx == null) return ''
            return perfTooltipFormatter(perfRows[idx]!, benchOn, benchmarks)
          },
        },
        series: (() => {
          const out: object[] = [
            {
              type: 'line',
              name: 'Portfolio %',
              showSymbol: false,
              data: perfRows.map((r) => r.portPct),
              lineStyle: { width: 2, color: '#f44' },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(255,68,68,0.28)' },
                  { offset: 1, color: 'rgba(0,0,0,0)' },
                ]),
              },
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { type: 'dashed', color: '#555' },
                data: [{ yAxis: 0 }],
                label: { formatter: '0%', fontSize: 9, color: '#888' },
              },
            },
          ]
          for (const b of benchmarks) {
            if (!benchOn[b.id]) continue
            out.push({
              type: 'line',
              name: `${b.short} %`,
              showSymbol: false,
              connectNulls: false,
              lineStyle: { width: 2, color: b.color },
              data: perfRows.map((row) => {
                const v = row[`${b.id}Pct` as keyof PortfolioPerfChartRow]
                return typeof v === 'number' && Number.isFinite(v) ? v : '-'
              }),
            })
          }
          return out
        })(),
      })
    }

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [
    benchOn,
    benchmarks,
    chartMode,
    logScale,
    navLines,
    navRows,
    navYDomain,
    perfRows,
    perfYDomain,
    truncated,
  ])

  return <div ref={wrapRef} style={{ width: '100%', height: 240, minHeight: 240 }} />
}
