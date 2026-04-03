import {
  AreaSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  createTextWatermark,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type Time,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { lcLastPriceOff, terminalChartOptions } from '../../charts/lightweight/terminalLightweightTheme'
import { flexYmdToTimeString, timeToIsoDay } from '../../charts/lightweight/timeFormat'
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

function buildTooltipHtml(
  chartMode: 'nav' | 'perf',
  dateLabel: string,
  navLines: NavSeriesVisibility,
  row: PortfolioNavChartRow | null,
  perfRow: PortfolioPerfChartRow | null,
  benchOn: Record<string, boolean>,
  benchmarks: PortfolioBenchDef[],
): string {
  if (chartMode === 'nav' && row) {
    const bits: string[] = [`<div style="font-weight:600;margin-bottom:4px">${dateLabel}</div>`]
    if (navLines.total) bits.push(`<div>Total: <span style="color:#0f0">${formatUsd(row.total)}</span></div>`)
    if (navLines.stock) bits.push(`<div>Stock: <span style="color:#ff6600">${formatUsd(row.stock)}</span></div>`)
    if (navLines.cash) bits.push(`<div>Cash: <span style="color:#7F77DD">${formatUsd(row.cash)}</span></div>`)
    return bits.join('')
  }
  if (chartMode === 'perf' && perfRow) {
    const bits: string[] = [`<div style="font-weight:600;margin-bottom:4px">${dateLabel}</div>`]
    bits.push(`<div>Port: <span style="color:#f44">${perfRow.portPct.toFixed(2)}%</span></div>`)
    for (const b of benchmarks) {
      if (!benchOn[b.id]) continue
      const v = perfRow[`${b.id}Pct` as keyof PortfolioPerfChartRow]
      if (typeof v === 'number')
        bits.push(`<div>${b.short}: <span style="color:${b.color}">${v.toFixed(2)}%</span></div>`)
    }
    return bits.join('')
  }
  return ''
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

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (chartMode === 'nav' && navRows.length === 0) return
    if (chartMode === 'perf' && perfRows.length === 0) return

    el.style.position = 'relative'

    const labelByKey = new Map<string, string>()
    if (chartMode === 'nav') {
      for (const r of navRows) labelByKey.set(flexYmdToTimeString(r.sortKey), r.dateLabel)
    } else {
      for (const r of perfRows) labelByKey.set(flexYmdToTimeString(r.sortKey), r.dateLabel)
    }

    const chart = createChart(
      el,
      terminalChartOptions({
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: '#080808' },
        },
        localization: {
          dateFormat: 'dd MMM yy',
          priceFormatter: (p: number) =>
            chartMode === 'nav'
              ? formatUsd(p)
              : `${Number(p).toFixed(2)}%`,
          timeFormatter: (t: Time) => labelByKey.get(timeToIsoDay(t)) ?? '',
        },
        timeScale: {
          borderVisible: true,
          fixLeftEdge: false,
          fixRightEdge: false,
          tickMarkFormatter: (time: Time) => {
            const lbl = labelByKey.get(timeToIsoDay(time))
            if (lbl) return lbl
            return null
          },
        },
      }),
    )

    const pane = chart.panes()[0]
    if (pane) {
      createTextWatermark(pane, {
        horzAlign: 'center',
        vertAlign: 'center',
        lines: [
          {
            text: chartMode === 'nav' ? 'NAV' : 'PERF %',
            color: 'rgba(55,55,55,0.14)',
            fontSize: 52,
            fontStyle: '',
          },
        ],
      })
    }

    const tip = document.createElement('div')
    tip.style.cssText = [
      'position:absolute',
      'z-index:4',
      'display:none',
      'pointer-events:none',
      'left:0',
      'top:0',
      'max-width:220px',
      'padding:8px 10px',
      'font-size:11px',
      'line-height:1.35',
      'background:#111',
      'border:1px solid #444',
      'color:#ddd',
      'font-family:ui-monospace,monospace',
    ].join(';')
    el.appendChild(tip)

    if (chartMode === 'nav') {
      const times = navRows.map((r) => flexYmdToTimeString(r.sortKey))

      const totalArea = chart.addSeries(AreaSeries, {
        lineColor: '#0f0',
        topColor: 'rgba(16,255,16,0.22)',
        bottomColor: 'rgba(0,0,0,0)',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: 'Total NAV',
        ...lcLastPriceOff,
        priceLineVisible: false,
        lastValueVisible: true,
      })
      totalArea.setData(times.map((time, i) => ({ time, value: navRows[i]!.total })))
      totalArea.applyOptions({ visible: navLines.total })

      const stockLine = chart.addSeries(LineSeries, {
        color: '#ff6600',
        lineWidth: 2,
        title: 'Stock',
        ...lcLastPriceOff,
      })
      stockLine.setData(times.map((time, i) => ({ time, value: navRows[i]!.stock })))
      stockLine.applyOptions({ visible: navLines.stock })

      const cashLine = chart.addSeries(LineSeries, {
        color: '#7F77DD',
        lineWidth: 2,
        title: 'Cash',
        ...lcLastPriceOff,
      })
      cashLine.setData(times.map((time, i) => ({ time, value: navRows[i]!.cash })))
      cashLine.applyOptions({ visible: navLines.cash })

      const lastT = times[times.length - 1]
      if (lastT && navLines.total) {
        createSeriesMarkers(totalArea, [
          {
            time: lastT,
            position: 'inBar',
            color: '#0f0',
            shape: 'circle',
            size: 1,
          },
        ])
      }

      chart.priceScale('right').applyOptions({
        mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        autoScale: !(truncated && navYDomain),
      })
      if (truncated && navYDomain) {
        chart.priceScale('right').setVisibleRange({ from: navYDomain[0], to: navYDomain[1] })
      }
    } else {
      const times = perfRows.map((r) => flexYmdToTimeString(r.sortKey))

      const portArea = chart.addSeries(AreaSeries, {
        lineColor: '#f44',
        topColor: 'rgba(255,68,68,0.28)',
        bottomColor: 'rgba(0,0,0,0)',
        lineWidth: 2,
        title: 'Portfolio %',
        ...lcLastPriceOff,
      })
      portArea.setData(times.map((time, i) => ({ time, value: perfRows[i]!.portPct })))

      portArea.createPriceLine({
        price: 0,
        color: '#555',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '0%',
      })

      const lastT = times[times.length - 1]
      if (lastT) {
        createSeriesMarkers(portArea, [
          {
            time: lastT,
            position: 'inBar',
            color: '#f44',
            shape: 'circle',
            size: 1,
          },
        ])
      }

      for (const b of benchmarks) {
        if (!benchOn[b.id]) continue
        const line = chart.addSeries(LineSeries, {
          color: b.color,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          title: `${b.short} %`,
          ...lcLastPriceOff,
        })
        const pts: ({ time: string } | { time: string; value: number })[] = []
        for (let i = 0; i < perfRows.length; i += 1) {
          const t = times[i]!
          const v = perfRows[i]![`${b.id}Pct` as keyof PortfolioPerfChartRow]
          if (typeof v === 'number' && Number.isFinite(v)) pts.push({ time: t, value: v })
          else pts.push({ time: t })
        }
        line.setData(pts)
      }

      chart.priceScale('right').applyOptions({
        mode: PriceScaleMode.Normal,
        autoScale: !(truncated && perfYDomain),
      })
      if (truncated && perfYDomain) {
        chart.priceScale('right').setVisibleRange({ from: perfYDomain[0], to: perfYDomain[1] })
      }
    }

    chart.timeScale().fitContent()

    const rowByKeyNav = new Map<string, PortfolioNavChartRow>()
    const rowByKeyPerf = new Map<string, PortfolioPerfChartRow>()
    if (chartMode === 'nav') {
      for (const r of navRows) rowByKeyNav.set(flexYmdToTimeString(r.sortKey), r)
    } else {
      for (const r of perfRows) rowByKeyPerf.set(flexYmdToTimeString(r.sortKey), r)
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || param.point.x < 0 || param.point.y < 0 || param.time == null) {
        tip.style.display = 'none'
        return
      }
      const key = timeToIsoDay(param.time)
      const dateLabel = labelByKey.get(key) ?? key
      const html =
        chartMode === 'nav'
          ? buildTooltipHtml(
              'nav',
              dateLabel,
              navLines,
              rowByKeyNav.get(key) ?? null,
              null,
              benchOn,
              benchmarks,
            )
          : buildTooltipHtml(
              'perf',
              dateLabel,
              navLines,
              null,
              rowByKeyPerf.get(key) ?? null,
              benchOn,
              benchmarks,
            )
      if (!html) {
        tip.style.display = 'none'
        return
      }
      tip.innerHTML = html
      tip.style.display = 'block'
      const pad = 12
      let x = param.point.x + pad
      let y = param.point.y + pad
      const tw = tip.offsetWidth
      const th = tip.offsetHeight
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (x + tw > cw) x = Math.max(pad, cw - tw - pad)
      if (y + th > ch) y = Math.max(pad, ch - th - pad)
      tip.style.transform = `translate(${x}px, ${y}px)`
    })

    return () => {
      tip.remove()
      chart.remove()
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
