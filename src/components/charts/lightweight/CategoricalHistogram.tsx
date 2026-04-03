import { ColorType, createChart, HistogramSeries, type Time } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { terminalChartOptions } from './terminalLightweightTheme'
import { categoryBarTimes, timeToIsoDay } from './timeFormat'

export type CategoricalBar = { name: string; value: number }

/** Histogram with synthetic dates; axis labels come from `name` via `timeFormatter`. */
export function CategoricalHistogram(props: {
  bars: CategoricalBar[]
  barColor?: string
  /** Distinct base date so multiple instances on one page never collide. */
  baseYmd?: string
  height?: number
  className?: string
}) {
  const { bars, barColor = '#ffcc00', baseYmd = '2020-01-01', height = 110, className } = props
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || bars.length === 0) return

    const times = categoryBarTimes(bars.length, baseYmd)
    const labelByTime = new Map<string, string>()
    times.forEach((t, i) => {
      labelByTime.set(t, bars[i]?.name ?? '')
    })

    const chart = createChart(
      el,
      terminalChartOptions({
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: '#0a0a0a' },
        },
        localization: {
          timeFormatter: (t: Time) => labelByTime.get(timeToIsoDay(t)) ?? '',
          priceFormatter: (p: number) => (Number.isFinite(p) ? p.toLocaleString() : ''),
        },
        timeScale: {
          visible: true,
          borderVisible: true,
          fixLeftEdge: true,
          fixRightEdge: true,
          tickMarkFormatter: (time: Time) => labelByTime.get(timeToIsoDay(time)) ?? null,
        },
        rightPriceScale: {
          visible: true,
          scaleMargins: { top: 0.2, bottom: 0.05 },
        },
        crosshair: {
          vertLine: { labelVisible: true },
          horzLine: { labelVisible: true },
        },
      }),
    )

    const hist = chart.addSeries(HistogramSeries, {
      color: barColor,
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    hist.setData(
      times.map((time, i) => ({
        time,
        value: bars[i]!.value,
        color: barColor,
      })),
    )

    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [barColor, bars, baseYmd, height])

  return <div ref={wrapRef} className={className} style={{ width: '100%', height, minHeight: height }} />
}
