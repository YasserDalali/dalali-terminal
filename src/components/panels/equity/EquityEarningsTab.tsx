import { useState } from 'react'
import {
  MOCK_EARNINGS_CALL,
  MOCK_EARNINGS_DOCS,
  MOCK_EARNINGS_HIGHLIGHTS,
  MOCK_EARNINGS_QUARTERS,
  MOCK_EARNINGS_TRANSCRIPT,
} from '../../../data/equityTabMocks'
import { InlineBold } from './InlineBold'

const CONTENT_TABS = ['Highlights', 'Transcript', 'Documents'] as const

export function EquityEarningsTab() {
  const [qid, setQid] = useState<string>(MOCK_EARNINGS_QUARTERS[1].id)
  const [content, setContent] = useState<(typeof CONTENT_TABS)[number]>('Highlights')
  const [txSearch, setTxSearch] = useState('')

  const c = MOCK_EARNINGS_CALL

  return (
    <div className="bb-eq-sub">
      <div className="bb-eq-earn__pills" role="tablist" aria-label="Quarters">
        {MOCK_EARNINGS_QUARTERS.map((q) => (
          <button
            key={q.id}
            type="button"
            role="tab"
            className={`bb-eq-earn__pill${qid === q.id ? ' bb-eq-earn__pill--on' : ''}${q.future ? ' bb-eq-earn__pill--fu' : ''}`}
            onClick={() => setQid(q.id)}
          >
            <span>{q.label}</span>
            {q.future ? (
              <span className="bb-eq-earn__badge bb-eq-earn__badge--am">IN {q.days}D</span>
            ) : q.pct != null ? (
              <span className={`bb-eq-earn__badge${q.beat ? ' bb-eq-earn__badge--ok' : ' bb-eq-earn__badge--bad'}`}>
                {q.beat ? '+' : ''}
                {q.pct.toFixed(2)}%
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <section className="bb-eq-earn__card">
        <div className="bb-eq-earn__cardhd">
          <div>
            <h2 className="bb-eq-earn__title">{c.title}</h2>
            <p className="bb-eq-earn__when muted mono">{c.datetime}</p>
          </div>
          <button type="button" className="bb-eq-earn__play">
            ▶ LISTEN
          </button>
        </div>
        <div className="bb-eq-earn__grid">
          <div className="bb-eq-earn__stat">
            <span className="muted">REV EST</span>
            <span className="mono">{c.revenue.est}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">REV ACT</span>
            <span className="mono">{c.revenue.actual}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">BEAT</span>
            <span className="mono pos">{c.revenue.beat}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">1D MOVE</span>
            <span className="mono pos">{c.revenue.move1d}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">EPS EST</span>
            <span className="mono">{c.eps.est}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">EPS ACT</span>
            <span className="mono">{c.eps.actual}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">BEAT</span>
            <span className="mono pos">{c.eps.beat}</span>
          </div>
          <div className="bb-eq-earn__stat">
            <span className="muted">PX</span>
            <span className="mono">{c.eps.price}</span>
          </div>
        </div>
      </section>

      <div className="bb-eq-earn__ctabs">
        {CONTENT_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`bb-eq-earn__ct${content === t ? ' bb-eq-earn__ct--on' : ''}`}
            onClick={() => setContent(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {content === 'Highlights' ? (
        <ul className="bb-eq-earn__hl">
          {MOCK_EARNINGS_HIGHLIGHTS.map((h, i) => (
            <li key={i} className="bb-eq-earn__hli">
              <InlineBold text={h} />
            </li>
          ))}
        </ul>
      ) : content === 'Transcript' ? (
        <div className="bb-eq-earn__tx">
          <input
            className="bb-eq-earn__search"
            placeholder="Search transcript..."
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
          />
          {MOCK_EARNINGS_TRANSCRIPT.filter(
            (b) =>
              !txSearch ||
              b.text.toLowerCase().includes(txSearch.toLowerCase()) ||
              b.speaker.toLowerCase().includes(txSearch.toLowerCase()),
          ).map((b, i) => (
            <div key={i} className="bb-eq-earn__blk">
              <div className="bb-eq-earn__sp mono">{b.speaker}</div>
              <p className="bb-eq-earn__txp">{b.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <ul className="bb-eq-earn__docs">
          {MOCK_EARNINGS_DOCS.map((d) => (
            <li key={d.label}>
              <a href={d.href} className="bb-eq-earn__doc">
                {d.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
