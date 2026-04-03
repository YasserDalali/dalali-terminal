import { useMemo, useState } from 'react'
import { EQUITY_TABS, type EquityTab } from '../../data/equityTabs'
import { EquityLink } from '../EquityLink'
import { useMarketData } from '../../services/market/marketDataStore'
import { formatUsd } from '../../utils/formatMoney'
import { EquityAnalysisTab } from './equity/EquityAnalysisTab'
import { EquityEarningsTab } from './equity/EquityEarningsTab'
import { EquityFinancialsTab } from './equity/EquityFinancialsTab'
import { EquityHistoricalTab } from './equity/EquityHistoricalTab'
import { EquityHoldersTab } from './equity/EquityHoldersTab'
import { EquityRelationsTab } from './equity/EquityRelationsTab'
import { InlineBold } from './equity/InlineBold'
import { EquityPriceChart } from '../charts/EquityPriceChart'

export function EquityPage() {
  const { equityDetail: q, equityChartCloses } = useMarketData()
  const [tab, setTab] = useState<EquityTab>('Overview')
  const [range, setRange] = useState<(typeof q.ranges)[number]>('1D')

  const up = q.change >= 0
  const ahUp = q.afterHours.change >= 0

  const targetTrack = useMemo(() => {
    const { targetLow, targetHigh, current } = q.analyst
    const span = targetHigh - targetLow
    const p = span > 0 ? ((current - targetLow) / span) * 100 : 50
    return { pct: Math.min(100, Math.max(0, p)), ...q.analyst }
  }, [q.analyst])

  const prevClose = useMemo(() => {
    const raw = q.stats.find((s) => s.label === 'PREV CLOSE')?.value
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : q.price - q.change
  }, [q.stats, q.price, q.change])

  const priceSeed = useMemo(() => {
    const s = q.symbol
    let n = 0
    for (let i = 0; i < s.length; i += 1) n += s.charCodeAt(i) * (i + 1)
    return n % 1000
  }, [q.symbol])

  return (
    <div className="bb-equity">
      <header className="bb-eq-head">
        <div className="bb-eq-head__brand">
          <div className="bb-eq-logo" aria-hidden>
            {q.symbol.slice(0, 2)}
          </div>
          <div className="bb-eq-head__titles">
            <h1 className="bb-eq-head__name">{q.name}</h1>
            <div className="bb-eq-head__badges">
              <span className="bb-eq-badge bb-eq-badge--sym">{q.symbol}</span>
              <span className="bb-eq-badge">{q.exchange}</span>
              <span className="bb-eq-badge">{q.country}</span>
            </div>
          </div>
        </div>
        <div className="bb-eq-head__acts">
          <button type="button" className="bb-eq-btn" disabled title="Not implemented">
            FOLLOW
          </button>
          <button type="button" className="bb-eq-btn bb-eq-btn--pri" disabled title="Not implemented">
            PRICE ALERT
          </button>
        </div>
      </header>

      <nav className="bb-eq-tabs" aria-label="Equity sections">
        {EQUITY_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`bb-eq-tabs__t${tab === t ? ' bb-eq-tabs__t--on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {tab === 'Overview' ? (
        <div className="bb-eq-layout">
          <div className="bb-eq-main">
            <section className="bb-eq-priceblk">
              <div className="bb-eq-priceblk__row">
                <span className={`bb-eq-px mono${up ? ' pos' : ' neg'}`}>{formatUsd(q.price)}</span>
                <span className={`mono bb-eq-ch ${up ? 'pos' : 'neg'}`}>
                  {up ? '+' : ''}
                  {formatUsd(q.change)} ({up ? '+' : ''}
                  {q.changePct.toFixed(2)}%)
                </span>
              </div>
              <div className="bb-eq-ah">
                <span className="muted">AH </span>
                <span className={`mono ${ahUp ? 'pos' : 'neg'}`}>
                  {formatUsd(q.afterHours.price)} ({ahUp ? '+' : ''}
                  {q.afterHours.changePct.toFixed(2)}%)
                </span>
                <span className="muted"> · {q.afterHours.time}</span>
              </div>
              <div className="bb-eq-range">
                {q.ranges.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`bb-eq-range__b${range === r ? ' bb-eq-range__b--on' : ''}`}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
                <span className="bb-eq-range__fill" />
                <button type="button" className="bb-eq-iconbtn" disabled title="Not implemented">
                  CMP
                </button>
              </div>
            </section>

            <section className="bb-eq-chart" aria-label="Price chart">
              <div className="bb-eq-chart__mock">
                <div className="bb-eq-chart__grid" />
                <EquityPriceChart
                  prevClose={prevClose}
                  price={q.price}
                  up={up}
                  seed={priceSeed}
                  closes={equityChartCloses(range)}
                />
                <div className="bb-eq-chart__prev mono">
                  {Number.isFinite(prevClose) ? prevClose.toFixed(2) : q.price - q.change} PREV CLOSE
                </div>
              </div>
              <div
                className="bb-eq-vol"
                aria-hidden
                title="Decorative bars only — volume from feed not shown here"
              >
                <span className="bb-eq-vol__lbl">VOL</span>
                <div className="bb-eq-vol__bars">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span
                      key={i}
                      className={`bb-eq-vol__b${i % 3 === 0 ? ' bb-eq-vol__b--dn' : ' bb-eq-vol__b--up'}`}
                      style={{ height: `${20 + ((i * 7) % 55)}%` }}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="bb-eq-kstats" aria-label="Key statistics">
              <h2 className="bb-eq-sec__ttl">KEY STATISTICS</h2>
              <div className="bb-eq-kstats__grid">
                {q.stats.map((s) => (
                  <div key={s.label} className="bb-eq-kstats__cell">
                    <div className="bb-eq-kstats__k muted">{s.label}</div>
                    <div className="bb-eq-kstats__v mono">{s.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bb-eq-move">
              <h2 className="bb-eq-sec__ttl">NOTABLE PRICE MOVEMENT</h2>
              <ul className="bb-eq-move__list">
                {q.movement.map((m, i) => (
                  <li key={i} className="bb-eq-move__item">
                    <span className={`bb-eq-move__dot${m.kind === 'ah' ? ' bb-eq-move__dot--ah' : ''}`} />
                    <div>
                      <div className="bb-eq-move__t muted mono">{m.t}</div>
                      <div className="bb-eq-move__ln mono">{m.line}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bb-eq-narr">
                <InlineBold text={q.narrative} as="p" />
                <div className="bb-eq-narr__src mono muted">{q.sourcesCount} SOURCES</div>
              </div>
            </section>

            <section className="bb-eq-news">
              <h2 className="bb-eq-sec__ttl">STORIES &amp; ANALYSIS</h2>
              <div className="bb-eq-news__scroll">
                {q.news.map((n) => (
                  <article key={n.id} className="bb-eq-news__card">
                    <div className="bb-eq-news__thumb" aria-hidden />
                    <div className="bb-eq-news__body">
                      <h3 className="bb-eq-news__h">{n.title}</h3>
                      <div className="bb-eq-news__meta muted">
                        {n.source} · {n.time}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="bb-eq-side" aria-label="Company and analysts">
            <section className="bb-eq-side__blk">
              <h2 className="bb-eq-side__ttl">COMPANY</h2>
              <dl className="bb-eq-dl">
                <dt>SYMBOL</dt>
                <dd className="mono">{q.symbol}</dd>
                <dt>IPO</dt>
                <dd className="mono">{q.company.ipo}</dd>
                <dt>CEO</dt>
                <dd>{q.company.ceo}</dd>
                <dt>EMPLOYEES</dt>
                <dd className="mono">{q.company.employees}</dd>
                <dt>SECTOR</dt>
                <dd>{q.company.sector}</dd>
                <dt>INDUSTRY</dt>
                <dd>{q.company.industry}</dd>
                <dt>EXCHANGE</dt>
                <dd>{q.exchange}</dd>
              </dl>
              <p className="bb-eq-desc">{q.company.description}</p>
              <button type="button" className="bb-eq-more" disabled title="Not implemented">
                VIEW MORE ▾
              </button>
            </section>

            <section className="bb-eq-side__blk">
              <h2 className="bb-eq-side__ttl">ANALYST CONSENSUS</h2>
              <div className="bb-eq-cons">
                <span className="bb-eq-cons__badge">{q.analyst.consensus.toUpperCase()}</span>
                <span className="mono muted">
                  {q.analyst.strongBuy + q.analyst.buy}B · {q.analyst.hold}H · {q.analyst.sell}S
                </span>
              </div>
              <div className="bb-eq-cons__bar">
                <span
                  className="bb-eq-cons__seg bb-eq-cons__seg--bull"
                  style={{ width: `${q.analyst.bullishPct}%` }}
                />
                <span
                  className="bb-eq-cons__seg bb-eq-cons__seg--neu"
                  style={{ width: `${q.analyst.neutralPct}%` }}
                />
                <span
                  className="bb-eq-cons__seg bb-eq-cons__seg--bear"
                  style={{ width: `${q.analyst.bearishPct}%` }}
                />
              </div>
              <div className="bb-eq-cons__leg muted mono">
                BULL {q.analyst.bullishPct}% · NEU {q.analyst.neutralPct}% · BEAR {q.analyst.bearishPct}%
              </div>
            </section>

            <section className="bb-eq-side__blk">
              <h2 className="bb-eq-side__ttl">PRICE TARGET (52W)</h2>
              <div className="bb-eq-pt">
                <div className="bb-eq-pt__track">
                  <span className="bb-eq-pt__lab bb-eq-pt__lab--l mono">${targetTrack.targetLow}</span>
                  <span className="bb-eq-pt__lab bb-eq-pt__lab--m mono">${targetTrack.targetAvg}</span>
                  <span className="bb-eq-pt__lab bb-eq-pt__lab--h mono">${targetTrack.targetHigh}</span>
                  <div className="bb-eq-pt__rail">
                    <div className="bb-eq-pt__fill" style={{ width: `${targetTrack.pct}%` }} />
                    <span className="bb-eq-pt__cur" style={{ left: `${targetTrack.pct}%` }} title="Last" />
                  </div>
                </div>
                <div className="bb-eq-pt__now mono">LAST {formatUsd(q.price)}</div>
              </div>
            </section>

            <section className="bb-eq-side__blk">
              <div className="bb-eq-side__row">
                <h2 className="bb-eq-side__ttl bb-eq-side__ttl--inline">EPS VS EST.</h2>
                <span className="muted mono">12Q</span>
              </div>
              <div className="bb-eq-eps">
                {[
                  { beat: true },
                  { beat: true },
                  { beat: false },
                  { beat: true },
                  { beat: true },
                  { beat: true },
                  { beat: true },
                  { beat: false },
                ].map((b, i) => (
                  <span
                    key={i}
                    className={`bb-eq-eps__dot${b.beat ? ' bb-eq-eps__dot--beat' : ' bb-eq-eps__dot--miss'}`}
                    title={b.beat ? 'Beat' : 'Miss'}
                  />
                ))}
              </div>
            </section>

            <section className="bb-eq-side__blk">
              <h2 className="bb-eq-side__ttl">PEERS</h2>
              <div className="bb-eq-peers">
                {q.peers.map((p) => (
                  <EquityLink key={p} symbol={p} variant="pill" className="mono">
                    {p}
                  </EquityLink>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="bb-eq-tabwrap">
          <p className="mono muted" style={{ margin: '0 0 0.75rem', fontSize: '0.8rem' }}>
            Demo / mock data for this tab — not tied to the selected ticker or a live API.
          </p>
          {tab === 'Financials' && <EquityFinancialsTab />}
          {tab === 'Earnings' && <EquityEarningsTab />}
          {tab === 'Holders' && <EquityHoldersTab />}
          {tab === 'Historical' && <EquityHistoricalTab />}
          {tab === 'Analysis' && <EquityAnalysisTab />}
          {tab === 'Relations' && <EquityRelationsTab />}
        </div>
      )}
    </div>
  )
}
