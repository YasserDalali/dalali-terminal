import { createChart, LineSeries, LineStyle } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { lcLastPriceOff, sparklineChartOptions } from '../../charts/lightweight/terminalLightweightTheme'
import { syntheticBusinessDaySeries } from '../../charts/lightweight/timeFormat'

function parseY(v: string | null | undefined): number | null {
  if (v == null) return null
  const s = v.trim()
  if (!s || s === '—' || s === '-') return null
  const m = s.match(/-?\d*\.?\d+(?:[eE][+-]?\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export function FinancialSparkline(props: {
  values: (string | null)[] | (string | null | undefined)[]
  estimateFromIndex: number | null
}) {
  const { values, estimateFromIndex } = props
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const ys = values.map((v) => parseY(v ?? null))
    const finite = ys.filter((v): v is number => v != null)
    if (finite.length < 2) return

    const times = syntheticBusinessDaySeries(values.length)
    const first = ys.find((v) => v != null)
    const last = [...ys].reverse().find((v) => v != null)
    const isUp = first != null && last != null ? last >= first : true
    const mainColor = isUp ? '#0f0' : '#f44'

    const chart = createChart(el, { ...sparklineChartOptions(), autoSize: true })
    const solid = chart.addSeries(LineSeries, {
      color: mainColor,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      ...lcLastPriceOff,
    })
    const est = chart.addSeries(LineSeries, {
      color: '#ffcc00',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      ...lcLastPriceOff,
    })

    const split = estimateFromIndex ?? values.length
    solid.setData(
      times
        .map((time, i) => ({ time, value: i < split ? ys[i]! : undefined }))
        .filter((d): d is { time: string; value: number } => d.value != null),
    )
    if (estimateFromIndex != null && estimateFromIndex < values.length) {
      est.setData(
        times
          .map((time, i) => ({ time, value: i >= split ? ys[i]! : undefined }))
          .filter((d): d is { time: string; value: number } => d.value != null),
      )
    } else {
      est.setData([])
    }

    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [estimateFromIndex, values])

  const ys = values.map((v) => parseY(v ?? null))
  const hasEnough = ys.filter((v) => v != null).length >= 2

  return (
    <div className="bb-eq-fin__spark" aria-hidden="true">
      {hasEnough ? <div ref={wrapRef} style={{ width: 150, height: 22 }} /> : null}
    </div>
  )
}
