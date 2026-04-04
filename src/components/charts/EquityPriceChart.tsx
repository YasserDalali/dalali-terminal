import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import type { DailyOhlcvBar } from '../../services/market/dailyBarTypes'
import { bbEchartsBase, areaGradientColors } from './echarts/bbEchartsTheme'
import { echarts } from './echarts/initEcharts'
import { flexYmdToTimeString, syntheticBusinessDaySeries } from './lightweight/timeFormat'

function buildSyntheticCloses(params: { n: number; start: number; end: number; seed: number }) {
  const { n, start, end, seed } = params
  if (n <= 1) return [{ y: end }]
  const baseSpan = end - start
  const amp = Math.abs(baseSpan) * 0.18 + Math.abs(end) * 0.002
  const arr: { y: number }[] = []
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1)
    const wobble = Math.sin(i * 0.85 + seed * 0.01) * Math.cos(i * 0.23 + seed * 0.03)
    const trend = baseSpan * t
    arr.push({ y: start + trend + wobble * amp })
  }
  arr[0] = { y: start }
  arr[arr.length - 1] = { y: end }
  return arr
}

function isoFromBarDate(dateYmd: string): string {
  if (/^\d{8}$/.test(dateYmd)) return flexYmdToTimeString(dateYmd)
  return dateYmd.slice(0, 10)
}

export function EquityPriceChart(props: {
  prevClose: number
  price: number
  up: boolean
  seed: number
  points?: number
  closes?: number[]
  ohlcv?: DailyOhlcvBar[]
}) {
  const { prevClose, price, up, seed, points = 24, closes, ohlcv } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const stroke = up ? '#0f0' : '#f44'
    const [g0, g1] = areaGradientColors(up)
    const useCandles = ohlcv && ohlcv.length >= 2

    const graphicWatermark = {
      type: 'text' as const,
      left: 'center',
      top: 'middle',
      style: {
        text: 'DALALI',
        fontSize: 56,
        fill: 'rgba(60,60,60,0.12)',
        fontWeight: 'normal',
      },
      z: -1,
    }

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    if (useCandles) {
      const cats = ohlcv!.map((b) => isoFromBarDate(b.dateYmd))
      const candleData = ohlcv!.map((b) => [b.open, b.close, b.low, b.high])
      chart.setOption({
        ...bbEchartsBase,
        animationDuration: 400,
        graphic: [graphicWatermark],
        grid: { left: 48, right: 12, top: 16, bottom: 56 },
        xAxis: {
          type: 'category',
          data: cats,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#444' } },
          axisLabel: { color: '#888', fontSize: 9, rotate: cats.length > 40 ? 45 : 0 },
        },
        yAxis: {
          scale: true,
          axisLine: { lineStyle: { color: '#444' } },
          splitLine: { lineStyle: { color: '#222' } },
          axisLabel: { color: '#888', formatter: (v: number) => v.toFixed(2) },
        },
        dataZoom: [
          { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
          {
            type: 'slider',
            xAxisIndex: 0,
            height: 18,
            bottom: 8,
            filterMode: 'none',
            borderColor: '#444',
            handleStyle: { color: '#ff6600' },
            textStyle: { color: '#888', fontSize: 9 },
          },
        ],
        series: [
          {
            type: 'candlestick',
            name: 'OHLC',
            itemStyle: {
              color: '#14b143',
              color0: '#ef232a',
              borderColor: '#14b143',
              borderColor0: '#ef232a',
            },
            data: candleData,
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { type: 'dashed', color: '#666', width: 1 },
              data: [{ yAxis: prevClose }],
              label: { show: true, formatter: 'prev', color: '#888', fontSize: 9 },
            },
          },
        ],
      })
    } else {
      const seriesPts =
        closes && closes.length >= 2
          ? closes.map((y) => ({ y }))
          : buildSyntheticCloses({ n: points, start: prevClose, end: price, seed })
      const cats = syntheticBusinessDaySeries(seriesPts.length)
      const vals = seriesPts.map((p) => p.y)
      const vmin = Math.min(...vals, prevClose)
      const vmax = Math.max(...vals, prevClose)

      chart.setOption({
        ...bbEchartsBase,
        animationDuration: 400,
        graphic: [graphicWatermark],
        grid: { left: 44, right: 8, top: 12, bottom: 52 },
        xAxis: {
          type: 'category',
          data: cats,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#444' } },
          axisLabel: { color: '#888', fontSize: 9, show: false },
        },
        yAxis: {
          scale: true,
          min: vmin - (vmax - vmin) * 0.06,
          max: vmax + (vmax - vmin) * 0.06,
          axisLine: { lineStyle: { color: '#444' } },
          splitLine: { lineStyle: { color: '#222' } },
          axisLabel: { color: '#888', formatter: (v: number) => v.toFixed(2) },
        },
        visualMap: {
          show: false,
          min: vmin,
          max: vmax,
          dimension: 1,
          inRange: { color: [stroke, up ? '#7fdf7f' : '#ff8888'] },
        },
        dataZoom: [
          { type: 'inside', xAxisIndex: 0 },
          {
            type: 'slider',
            xAxisIndex: 0,
            height: 16,
            bottom: 6,
            borderColor: '#444',
            handleStyle: { color: '#ff6600' },
            textStyle: { color: '#888', fontSize: 9 },
          },
        ],
        series: [
          {
            type: 'line',
            smooth: 0.2,
            symbol: 'none',
            lineStyle: { width: 2, color: stroke },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: g0 },
                { offset: 1, color: g1 },
              ]),
            },
            data: vals,
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { type: 'dashed', color: '#666' },
              data: [{ yAxis: prevClose }],
              label: { formatter: 'prev', color: '#888', fontSize: 9 },
            },
          },
        ],
      })
    }

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [closes, ohlcv, points, prevClose, price, seed, up])

  return <div ref={wrapRef} className="bb-eq-chart__chart" aria-hidden="true" />
}
