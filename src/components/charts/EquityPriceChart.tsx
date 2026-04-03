import {
  AreaSeries,
  ColorType,
  createChart,
  createTextWatermark,
  LineStyle,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { lcLastPriceOff, terminalChartOptions } from './lightweight/terminalLightweightTheme'
import { syntheticBusinessDaySeries } from './lightweight/timeFormat'

function buildSeries(params: { n: number; start: number; end: number; seed: number }) {
  const { n, start, end, seed } = params
  if (n <= 1) return [{ x: 0, y: end }]

  const baseSpan = end - start
  const amp = Math.abs(baseSpan) * 0.18 + Math.abs(end) * 0.002

  const arr: { x: number; y: number }[] = []
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1)
    const wobble = Math.sin(i * 0.85 + seed * 0.01) * Math.cos(i * 0.23 + seed * 0.03)
    const trend = baseSpan * t
    const y = start + trend + wobble * amp
    arr.push({ x: i, y })
  }
  arr[0] = { x: 0, y: start }
  arr[arr.length - 1] = { x: n - 1, y: end }
  return arr
}

export function EquityPriceChart(props: {
  prevClose: number
  price: number
  up: boolean
  seed: number
  points?: number
  /** Daily closes from feed; when ≥2 points, chart follows real history for the selected range. */
  closes?: number[]
}) {
  const { prevClose, price, up, seed, points = 24, closes } = props
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const seriesPoints =
      closes && closes.length >= 2
        ? closes.map((y, x) => ({ x, y }))
        : buildSeries({ n: points, start: prevClose, end: price, seed })

    const stroke = up ? '#0f0' : '#f44'
    const topColor = up ? 'rgba(16, 255, 16, 0.28)' : 'rgba(255, 68, 68, 0.28)'

    const chart = createChart(
      el,
      terminalChartOptions({
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: '#050505' },
        },
        localization: {
          priceFormatter: (p: number) => (Number.isFinite(p) ? p.toFixed(2) : ''),
        },
        crosshair: {
          horzLine: { labelVisible: true },
          vertLine: { labelVisible: true },
        },
      }),
    )

    const pane = chart.panes()[0]
    if (pane) {
      createTextWatermark(pane, {
        horzAlign: 'center',
        vertAlign: 'center',
        lines: [{ text: 'DALALI', color: 'rgba(60,60,60,0.12)', fontSize: 56, fontStyle: '' }],
      })
    }

    const area = chart.addSeries(AreaSeries, {
      lineColor: stroke,
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      ...lcLastPriceOff,
      priceFormat: { type: 'price', minMove: 0.01, precision: 2 },
    })

    const times = syntheticBusinessDaySeries(seriesPoints.length)
    area.setData(
      times.map((time, i) => ({
        time,
        value: seriesPoints[i]!.y,
      })),
    )

    area.createPriceLine({
      price: prevClose,
      color: '#666',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'prev',
    })

    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [closes, points, prevClose, price, seed, up])

  return <div ref={wrapRef} className="bb-eq-chart__chart" aria-hidden="true" />
}
