import { useMemo, useState } from 'react'
import { MOCK_EQUITY } from '../../../data/mockEquity'
import {
  MOCK_RELATION_NODES,
  RELATION_FILTERS,
  type RelationType,
} from '../../../data/equityTabMocks'

const TYPE_CLASS: Record<RelationType, string> = {
  partnership: 'bb-eq-rel__legend--p',
  subsidiary: 'bb-eq-rel__legend--s',
  competitor: 'bb-eq-rel__legend--c',
  customer: 'bb-eq-rel__legend--k',
  investor: 'bb-eq-rel__legend--i',
  ma: 'bb-eq-rel__legend--m',
}

export function EquityRelationsTab() {
  const q = MOCK_EQUITY
  const [filter, setFilter] = useState<RelationType | 'all'>('all')
  const [year, setYear] = useState(2026)
  const [selectedId, setSelectedId] = useState<string>('openai')

  const nodes = useMemo(
    () => MOCK_RELATION_NODES.filter((n) => filter === 'all' || n.type === filter),
    [filter],
  )

  const selected = MOCK_RELATION_NODES.find((n) => n.id === selectedId) ?? MOCK_RELATION_NODES[0]

  const cx = 200
  const cy = 160
  const rBase = 118

  return (
    <div className="bb-eq-sub bb-eq-rel">
      <div className="bb-eq-rel__filters">
        {RELATION_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`bb-eq-rel__f${filter === f.id ? ' bb-eq-rel__f--on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bb-eq-rel__year">
        <span className="muted mono">NETWORK YEAR</span>
        <input
          type="range"
          min={2018}
          max={2026}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bb-eq-rel__slider"
        />
        <span className="mono">{year}</span>
      </div>

      <div className="bb-eq-rel__split">
        <div className="bb-eq-rel__graph">
          <svg className="bb-eq-rel__svg" viewBox="0 0 400 320" aria-label="Relation network">
            {nodes.map((n) => {
              const rad = (n.angle * Math.PI) / 180
              const x2 = cx + Math.cos(rad) * rBase * n.dist
              const y2 = cy + Math.sin(rad) * rBase * n.dist * 0.82
              return (
                <line
                  key={`l-${n.id}`}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="#444"
                  strokeWidth="1"
                  strokeDasharray={n.status === 'Pending' ? '4 3' : undefined}
                />
              )
            })}
            {nodes.map((n) => {
              const rad = (n.angle * Math.PI) / 180
              const x = cx + Math.cos(rad) * rBase * n.dist
              const y = cy + Math.sin(rad) * rBase * n.dist * 0.82
              const on = selectedId === n.id
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className="bb-eq-rel__hit"
                  onClick={() => setSelectedId(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(n.id)
                    }
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={on ? 22 : 18}
                    fill="#111"
                    stroke={on ? 'var(--bb-orange)' : '#666'}
                    strokeWidth={on ? 2 : 1}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="9"
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.ticker ?? n.label.slice(0, 4)}
                  </text>
                </g>
              )
            })}
            <circle cx={cx} cy={cy} r={26} fill="#1a3a5c" stroke="var(--bb-orange)" strokeWidth="2" />
            <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
              {q.symbol}
            </text>
          </svg>
          <div className="bb-eq-rel__leg">
            <span>
              <span className={`bb-eq-rel__dot ${TYPE_CLASS.partnership}`} /> PRTNR
            </span>
            <span>
              <span className={`bb-eq-rel__dot ${TYPE_CLASS.subsidiary}`} /> SUB
            </span>
            <span>
              <span className={`bb-eq-rel__dot ${TYPE_CLASS.competitor}`} /> COMP
            </span>
            <span>
              <span className={`bb-eq-rel__dot ${TYPE_CLASS.investor}`} /> INV
            </span>
            <span>
              <span className={`bb-eq-rel__dot ${TYPE_CLASS.customer}`} /> CUST
            </span>
          </div>
        </div>

        <aside className="bb-eq-rel__panel">
          <div className="bb-eq-rel__ph">
            <div className="bb-eq-logo bb-eq-rel__logo">{selected.ticker?.slice(0, 2) ?? 'CO'}</div>
            <div>
              <div className="bb-eq-rel__pname">{selected.label}</div>
              {selected.ticker ? <div className="mono muted">{selected.ticker} US</div> : null}
            </div>
          </div>
          <span className={`bb-eq-rel__type ${TYPE_CLASS[selected.type]}`}>
            {selected.type.toUpperCase()}
          </span>
          <p className="bb-eq-rel__deal muted">{selected.deal}</p>
          <div className="bb-eq-rel__status">
            STATUS{' '}
            <strong
              className={
                selected.status === 'Active' ? 'pos' : selected.status === 'Pending' ? 'bb-eq-rel__pend' : 'muted'
              }
            >
              {selected.status.toUpperCase()}
            </strong>
          </div>
          <div className="bb-eq-rel__links">
            <a href="#">SEC FILING</a>
            <span className="muted">|</span>
            <a href="#">PRESS</a>
          </div>
          <button type="button" className="bb-eq-btn bb-eq-btn--pri bb-eq-rel__open">
            OPEN EQUITY →
          </button>
        </aside>
      </div>
    </div>
  )
}
