import { useState } from 'react'
import { EQUITY_CHART_RANGES, type EquityChartRange } from '../../../data/equityChartRanges'
import type { DailyOhlcvBar } from '../../../services/market/dailyBarTypes'
import { sliceOhlcvForRange } from '../../../services/market/marketEquityModel'

function fmtYmd(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) return ymd
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function fmtVol(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

export function EquityHistoricalTab({
  symbol,
  bars,
}: {
  symbol: string
  bars: DailyOhlcvBar[]
}) {
  const [range, setRange] = useState<EquityChartRange>('1M')
  const sliced = sliceOhlcvForRange(bars, range)
  const rows = [...sliced].reverse()

  return (
    <div className="bb-eq-sub">
      <p className="muted bb-eq-sub__note">
        <span className="mono">{symbol}</span> — Adj. daily OHLC from Tiingo (same series as overview chart).
      </p>
      <div className="bb-eq-sub__toolbar">
        <div className="bb-eq-range">
          {EQUITY_CHART_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`bb-eq-range__b${range === r ? ' bb-eq-range__b--on' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!rows.length ? (
        <p className="mono muted">No historical rows for this range (load Tiingo prices first).</p>
      ) : (
        <div className="bb-scroll">
          <table className="bb-eq-grid">
            <thead>
              <tr>
                <th>DATE</th>
                <th className="bb-grid__r">OPEN</th>
                <th className="bb-grid__r">HIGH</th>
                <th className="bb-grid__r">LOW</th>
                <th className="bb-grid__r">CLOSE</th>
                <th className="bb-grid__r">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dateYmd}>
                  <td className="mono">{fmtYmd(row.dateYmd)}</td>
                  <td className="bb-grid__r mono">{row.open.toFixed(2)}</td>
                  <td className="bb-grid__r mono">{row.high.toFixed(2)}</td>
                  <td className="bb-grid__r mono">{row.low.toFixed(2)}</td>
                  <td className={`bb-grid__r mono${row.close >= row.open ? ' pos' : ' neg'}`}>{row.close.toFixed(2)}</td>
                  <td className="bb-grid__r mono muted">{fmtVol(row.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
