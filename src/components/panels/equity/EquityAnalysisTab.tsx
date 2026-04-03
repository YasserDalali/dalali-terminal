import { useMemo, useState } from 'react'
import { MOCK_EQUITY } from '../../../data/mockEquity'
import {
  MOCK_ANALYSIS_SYNTHESIS,
  MOCK_ANALYST_RATINGS,
  MOCK_RESEARCH_REPORTS,
} from '../../../data/equityTabMocks'
import { InlineBold } from './InlineBold'

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function EquityAnalysisTab() {
  const q = MOCK_EQUITY
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? MOCK_ANALYST_RATINGS : MOCK_ANALYST_RATINGS.slice(0, 3)

  const track = useMemo(() => {
    const { targetLow, targetHigh, current } = q.analyst
    const span = targetHigh - targetLow
    const p = span > 0 ? ((current - targetLow) / span) * 100 : 50
    return { pct: Math.min(100, Math.max(0, p)), ...q.analyst }
  }, [q.analyst])

  return (
    <div className="bb-eq-sub bb-eq-an">
      <div className="bb-eq-an__strip">
        <span className="bb-eq-an__cons">CONSENSUS {q.analyst.consensus.toUpperCase()}</span>
        <span className="mono muted">
          BULL {q.analyst.bullishPct}% · NEU {q.analyst.neutralPct}% · BEAR {q.analyst.bearishPct}%
        </span>
        <span className="bb-eq-an__sb mono">STRONG BUY {q.analyst.strongBuy}</span>
        <span className="mono">BUY {q.analyst.buy}</span>
        <span className="mono">HOLD {q.analyst.hold}</span>
        <span className="mono">SELL {q.analyst.sell}</span>
      </div>

      <div className="bb-eq-an__layout">
        <div className="bb-eq-an__main">
          <h2 className="bb-eq-sec__ttl">ANALYST RATINGS</h2>
          <div className="bb-scroll">
            <table className="bb-eq-grid">
              <thead>
                <tr>
                  <th>FIRM</th>
                  <th>ANALYST</th>
                  <th>RATING</th>
                  <th className="bb-grid__r">52W TGT</th>
                  <th className="bb-grid__r">UPSIDE</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.firm}-${r.date}`}>
                    <td>{r.firm}</td>
                    <td className="muted">{r.analyst}</td>
                    <td>
                      <span
                        className={`bb-eq-rat${r.rating === 'Hold' ? ' bb-eq-rat--hold' : r.rating === 'Buy' ? ' bb-eq-rat--buy' : ' bb-eq-rat--op'}`}
                      >
                        {r.rating.toUpperCase()}
                      </span>
                    </td>
                    <td className="bb-grid__r mono">
                      <strong>{r.target}</strong>{' '}
                      <span className="muted">from {r.targetPrev}</span>
                    </td>
                    <td className={`bb-grid__r mono${r.upside.startsWith('+') ? ' pos' : ' neg'}`}>
                      {r.upside}
                    </td>
                    <td className="mono muted">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {MOCK_ANALYST_RATINGS.length > 3 ? (
            <button type="button" className="bb-eq-more bb-eq-an__more" onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'SHOW LESS ▴' : `SEE ${MOCK_ANALYST_RATINGS.length - 3} MORE ▾`}
            </button>
          ) : null}

          <h2 className="bb-eq-sec__ttl">52W PRICE TARGET</h2>
          <div className="bb-eq-pt bb-eq-an__pt">
            <div className="bb-eq-pt__track">
              <span className="bb-eq-pt__lab bb-eq-pt__lab--l mono">${track.targetLow}</span>
              <span className="bb-eq-pt__lab bb-eq-pt__lab--m mono">${track.targetAvg}</span>
              <span className="bb-eq-pt__lab bb-eq-pt__lab--h mono">${track.targetHigh}</span>
              <div className="bb-eq-pt__rail">
                <div className="bb-eq-pt__fill" style={{ width: `${track.pct}%` }} />
                <span className="bb-eq-pt__cur" style={{ left: `${track.pct}%` }} title="Last" />
              </div>
            </div>
            <div className="bb-eq-pt__now mono">LAST {formatUsd(q.price)}</div>
          </div>
        </div>

        <aside className="bb-eq-an__side">
          <section className="bb-eq-side__blk">
            <h2 className="bb-eq-side__ttl">AI SYNTHESIS</h2>
            <div className="bb-eq-an__syn">
              <InlineBold text={MOCK_ANALYSIS_SYNTHESIS} as="p" />
            </div>
          </section>
          <section className="bb-eq-side__blk">
            <h2 className="bb-eq-side__ttl">RESEARCH</h2>
            <ul className="bb-eq-an__rep">
              {MOCK_RESEARCH_REPORTS.map((r) => (
                <li key={r.title} className="bb-eq-an__repi">
                  <span className="bb-eq-an__fav" aria-hidden />
                  <div>
                    <div className="bb-eq-an__rept">{r.title}</div>
                    <div className="muted mono">
                      {r.author} · {r.date}
                    </div>
                  </div>
                  <button type="button" className="bb-eq-btn">
                    VIEW
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
