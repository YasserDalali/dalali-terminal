import { useEffect, useRef } from 'react'
import type { EChartsType } from 'echarts/core'
import { bbEchartsBase } from '../../charts/echarts/bbEchartsTheme'
import { echarts } from '../../charts/echarts/initEcharts'
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
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const ys = values.map((v) => parseY(v ?? null))
    const finite = ys.filter((v): v is number => v != null)
    if (finite.length < 2) return

    const cats = syntheticBusinessDaySeries(values.length)
    const first = ys.find((v) => v != null)
    const last = [...ys].reverse().find((v) => v != null)
    const isUp = first != null && last != null ? last >= first : true
    const mainColor = isUp ? '#0f0' : '#f44'
    const split = estimateFromIndex ?? values.length

    const solidData = cats.map((_, i) => {
      if (i >= split) return '-'
      const y = ys[i]
      return y == null ? '-' : y
    })
    const estData = cats.map((_, i) => {
      if (i < split) return '-'
      const y = ys[i]
      return y == null ? '-' : y
    })

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    chart.setOption({
      ...bbEchartsBase,
      grid: { left: 0, right: 0, top: 1, bottom: 0 },
      xAxis: { type: 'category', data: cats, show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: { show: false },
      series: [
        {
          type: 'line',
          name: 'actual',
          symbol: 'none',
          lineStyle: { width: 2, color: mainColor },
          connectNulls: false,
          data: solidData,
        },
        ...(estimateFromIndex != null
          ? [
              {
                type: 'line' as const,
                name: 'est',
                symbol: 'none',
                lineStyle: { width: 2, color: '#ffcc00', type: 'dashed' as const },
                connectNulls: false,
                data: estData,
              },
            ]
          : []),
      ],
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
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
