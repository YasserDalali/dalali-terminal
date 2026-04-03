import { useMemo, useState } from 'react'
import { getFinancialsTableConfig } from '../../../data/financialsPerplexityMocks'
import { FIN_SUBTABS, type FinSubtab } from '../../../data/equityTabMocks'
import { FinancialSparkline } from './FinancialSparkline'

export function EquityFinancialsTab() {
  const [sub, setSub] = useState<FinSubtab>('Key Stats')
  const [period, setPeriod] = useState<'annual' | 'quarterly' | 'ttm'>('annual')

  const { columns, estimateFromIndex, rows } = useMemo(
    () => getFinancialsTableConfig(sub, period),
    [sub, period],
  )

  const colSpan = 1 + columns.length

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
              onClick={() => setPeriod(p)}
            >
              {p === 'ttm' ? 'TTM' : p === 'annual' ? 'ANNUAL' : 'QUARTERLY'}
            </button>
          ))}
        </div>
        <div className="bb-eq-sub__tools">
          <button type="button" className="bb-eq-iconbtn">
            ⋮
          </button>
          <button type="button" className="bb-eq-btn bb-eq-btn--pri">
            ↓ CSV
          </button>
        </div>
      </div>

      <p className="muted bb-eq-sub__note">
        <strong className="bb-eq-tabbody__tag">{sub.toUpperCase()}</strong> ·{' '}
        <span className="mono">{period.toUpperCase()}</span>
        {estimateFromIndex != null ? (
          <>
            {' '}
            · <span className="bb-eq-fin__est-hint">2026–2027 = EST</span>
          </>
        ) : null}{' '}
        — Perplexity-style line items (AMZN-class mock). Replace with FMP / vendor API.
      </p>

      <div className="bb-eq-fin-scroll bb-eq-fin-scroll--tall">
        <table className="bb-eq-fin">
          <thead>
            <tr>
              <th className="bb-eq-fin__lbl" />
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={`bb-eq-fin__col mono${estimateFromIndex != null && i >= estimateFromIndex ? ' bb-eq-fin__col--est' : ''}`}
                >
                  {c}
                  {estimateFromIndex != null && i >= estimateFromIndex ? (
                    <span className="bb-eq-fin__est-ic" aria-hidden>
                      {' '}
                      ○
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) =>
              row.kind === 'section' ? (
                <tr
                  key={`s-${ri}`}
                  className={`bb-eq-fin__sec${row.sub ? ' bb-eq-fin__sec--sub' : ''}`}
                >
                  <td colSpan={colSpan}>{row.label}</td>
                </tr>
              ) : (
                <tr key={`r-${ri}`} className="bb-eq-fin__row">
                  <td className={`bb-eq-fin__lbl${row.italic ? ' bb-eq-fin__lbl--it' : ''}`}>
                    <div className="bb-eq-fin__lblWrap">
                      <FinancialSparkline values={row.values} estimateFromIndex={estimateFromIndex} />
                      <span className="bb-eq-fin__lblTxt">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((v, vi) => (
                    <td
                      key={vi}
                      className={`mono bb-eq-fin__num${estimateFromIndex != null && vi >= estimateFromIndex ? ' bb-eq-fin__num--est' : ''}`}
                    >
                      {v ?? '—'}
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
