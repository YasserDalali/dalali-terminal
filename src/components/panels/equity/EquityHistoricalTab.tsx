import { useState } from 'react'
import { MOCK_EQUITY } from '../../../data/mockEquity'
import { MOCK_HISTORICAL } from '../../../data/equityTabMocks'

export function EquityHistoricalTab() {
  const [range, setRange] = useState<(typeof MOCK_EQUITY.ranges)[number]>('1M')

  return (
    <div className="bb-eq-sub">
      <div className="bb-eq-sub__toolbar">
        <div className="bb-eq-range">
          {MOCK_EQUITY.ranges.map((r) => (
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
        <div className="bb-eq-sub__tools">
          <button type="button" className="bb-eq-iconbtn" title="Calendar">
            CAL
          </button>
          <button type="button" className="bb-eq-iconbtn">
            ⋮
          </button>
          <button type="button" className="bb-eq-btn bb-eq-btn--pri">
            ↓ CSV
          </button>
        </div>
      </div>

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
            {MOCK_HISTORICAL.map((row, i) =>
              row.kind === 'week' ? (
                <tr key={`w-${i}`} className="bb-eq-hist__week">
                  <td colSpan={6}>{row.week}</td>
                </tr>
              ) : (
                <tr key={row.date}>
                  <td className="mono">{row.date}</td>
                  <td className="bb-grid__r mono">{row.o}</td>
                  <td className="bb-grid__r mono">{row.h}</td>
                  <td className="bb-grid__r mono">{row.l}</td>
                  <td
                    className={`bb-grid__r mono${parseFloat(row.c) >= parseFloat(row.o) ? ' pos' : ' neg'}`}
                  >
                    {row.c}
                  </td>
                  <td className="bb-grid__r mono muted">{row.vol}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
