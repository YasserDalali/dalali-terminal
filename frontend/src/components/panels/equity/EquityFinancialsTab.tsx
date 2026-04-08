import { useEffect, useMemo, useState } from 'react'
import { FIN_SUBTABS, type FinSubtab } from '../../../data/equityTabMocks'
import {
  fetchEquityFundamentalsDaily,
  fetchEquityFundamentalsStatements,
} from '../../../services/market/equityTiingoApi'
import { filterGridBySubtab, statementsToMetricGrid, type MetricGrid } from '../../../utils/tiingoGrid'
import { FinancialSparkline } from './FinancialSparkline'

export function EquityFinancialsTab({ symbol }: { symbol: string }) {
  const [sub, setSub] = useState<FinSubtab>('Key Stats')
  const [period, setPeriod] = useState<'annual' | 'quarterly' | 'ttm'>('annual')
  const [statementRaw, setStatementRaw] = useState<unknown>(null)
  const [dailyRaw, setDailyRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const end = new Date().toISOString().slice(0, 10)
        const start = '2018-01-01'
        const [st, dy] = await Promise.all([
          fetchEquityFundamentalsStatements(symbol, {
            startDate: start,
            endDate: end,
            asReported: period === 'annual',
          }),
          fetchEquityFundamentalsDaily(symbol, { startDate: start, endDate: end }),
        ])
        if (!cancel) {
          setStatementRaw(st)
          setDailyRaw(dy)
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [symbol, period])

  const statementGrid = useMemo(() => statementsToMetricGrid(statementRaw), [statementRaw])
  const dailyGrid = useMemo(() => statementsToMetricGrid(dailyRaw), [dailyRaw])

  const activeGrid: MetricGrid = useMemo(() => {
    if (sub === 'Key Stats' || sub === 'Ratios') {
      const g = dailyGrid
      if (sub === 'Ratios') {
        return {
          columns: g.columns,
          rows: g.rows.filter((r) =>
            /ratio|margin|return|yield|pe|pb|roe|roa|debt|eps|growth|fcf|ebitda|multiple/i.test(
              r.label,
            ),
          ),
        }
      }
      return g
    }
    if (sub === 'Income Statement') return filterGridBySubtab(statementGrid, 'income')
    if (sub === 'Balance Sheet') return filterGridBySubtab(statementGrid, 'balance')
    if (sub === 'Cash Flow') return filterGridBySubtab(statementGrid, 'cash')
    if (sub === 'Segments & KPIs') {
      return {
        columns: statementGrid.columns,
        rows: statementGrid.rows.filter((r) =>
          /segment|kpi|geograph|product|business|division|region/i.test(r.label),
        ),
      }
    }
    if (sub === 'Adjusted') {
      return {
        columns: statementGrid.columns,
        rows: statementGrid.rows.filter((r) => /adjusted|non-?gap|pro forma|normali[sz]/i.test(r.label)),
      }
    }
    return statementGrid
  }, [sub, statementGrid, dailyGrid])

  return (
    <div className="bb-eq-sub">
      <div className="bb-eq-sub__subtabs">
        {FIN_SUBTABS.map((s) => (
          <button
            key={s}
            type="button"
            className={`bb-eq-sub__st${sub === s ? ' bb-eq-sub__st--on' : ''}`}
            onClick={() => setSub(s)}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bb-eq-sub__toolbar">
        <div className="bb-eq-sub__seg">
          {(['annual', 'quarterly', 'ttm'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`bb-eq-sub__segbtn${period === p ? ' bb-eq-sub__segbtn--on' : ''}`}
              onClick={() => {
                setPeriod(p)
                /* TTM maps to asReported false quarterly-style in Tiingo */
              }}
              title={p === 'ttm' ? 'Uses latest revised fundamentals window (asReported=false)' : undefined}
            >
              {p === 'ttm' ? 'TTM' : p === 'annual' ? 'ANNUAL' : 'QUARTERLY'}
            </button>
          ))}
        </div>
      </div>

      <p className="muted bb-eq-sub__note">
        <strong className="bb-eq-tabbody__tag">{sub.toUpperCase()}</strong> ·{' '}
        <span className="mono">{symbol}</span> — Tiingo fundamentals API via portfolio BFF (statements + daily).
        {period === 'annual' ? ' Annual view uses asReported-style request where supported.' : ''}
      </p>

      {loading ? <p className="mono muted">Loading fundamentals…</p> : null}
      {error ? (
        <p className="mono bb-eq-feedwarn" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && activeGrid.rows.length === 0 ? (
        <p className="mono muted">
          No rows for this view. The ticker may lack fundamentals coverage, or Tiingo returned an empty payload /
          rate limit.
        </p>
      ) : null}

      {!loading && activeGrid.columns.length > 0 && activeGrid.rows.length > 0 ? (
        <div className="bb-eq-fin-scroll bb-eq-fin-scroll--tall">
          <table className="bb-eq-fin">
            <thead>
              <tr>
                <th className="bb-eq-fin__lbl" />
                {activeGrid.columns.map((c, i) => (
                  <th key={i} className="bb-eq-fin__col mono">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeGrid.rows.map((row, ri) => (
                <tr key={`${row.label}-${ri}`} className="bb-eq-fin__row">
                  <td className="bb-eq-fin__lbl">
                    <div className="bb-eq-fin__lblWrap">
                      {row.values.filter((v) => v !== '—').length >= 2 ? (
                        <FinancialSparkline values={row.values} estimateFromIndex={null} />
                      ) : null}
                      <span className="bb-eq-fin__lblTxt">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="mono bb-eq-fin__num">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
