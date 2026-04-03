import type { ReactNode } from 'react'
import { BRAND_ACRONYM } from '../../data/brand'
import { StripSparkline } from '../charts/StripSparkline'

const ASSETS = [
  { name: 'ES1 INDEX', price: '5,842.25', delta: '+12.40', pct: '+0.21', up: true },
  { name: 'NQ1 INDEX', price: '20,118.50', delta: '-44.20', pct: '-0.22', up: false },
  { name: 'DM1 INDEX', price: '42,901.00', delta: '+89.00', pct: '+0.21', up: true },
  { name: 'VIX INDEX', price: '14.82', delta: '-0.35', pct: '-2.31', up: false, inverse: true },
]

const WATCHLIST = [
  { sym: 'AAPL', name: 'APPLE INC', price: '241.84', d1: '+0.42', m1: '+3.1', cap: '3.6T' },
  { sym: 'MSFT', name: 'MICROSOFT CP', price: '415.20', d1: '-0.18', m1: '+1.2', cap: '3.1T' },
  { sym: 'NVDA', name: 'NVIDIA CORP', price: '128.90', d1: '+2.10', m1: '+8.4', cap: '3.2T' },
  { sym: 'META', name: 'META PLATFORMS', price: '602.10', d1: '-1.05', m1: '+4.2', cap: '1.5T' },
]

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const

function seedFromStr(s: string) {
  let n = 0
  for (let i = 0; i < s.length; i += 1) n += s.charCodeAt(i) * (i + 1)
  return n % 1000
}

function buildStripValues(seed: number, up: boolean) {
  const n = 18
  const start = up ? 42 : 58
  const end = up ? 74 : 26
  const span = end - start
  const amp = Math.abs(span) * 0.18 + 2

  const out: number[] = []
  for (let i = 0; i < n; i += 1) {
    const t = n <= 1 ? 0 : i / (n - 1)
    const wobble = Math.sin(i * 0.9 + seed * 0.02) * Math.cos(i * 0.27 + seed * 0.04)
    const y = start + span * t + wobble * amp
    out.push(y)
  }
  return out
}

function Pill({ children, positive }: { children: ReactNode; positive: boolean }) {
  return (
    <span className={`bb-pill bb-pill--${positive ? 'up' : 'dn'}`}>
      <span className="mono">{children}</span>
    </span>
  )
}

export function MarketsOverview() {
  return (
    <div className="bb-workspace">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">MKT</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">MARKET OVERVIEW</span>
        <span className="bb-workspace__fill" />
        <label className="bb-workspace__fld">
          REGION
          <select className="bb-sel" defaultValue="US">
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="ASIA">ASIA</option>
          </select>
        </label>
      </div>

      <div className="bb-strip" aria-label="Indices">
        {ASSETS.map((a) => {
          const displayUp = a.inverse ? !a.up : a.up
          return (
            <div key={a.name} className="bb-strip__cell">
              <div className="bb-strip__sym">{a.name}</div>
              <div className="bb-strip__px mono">{a.price}</div>
              <div className="bb-strip__ch">
                <Pill positive={displayUp}>{a.delta}</Pill>
                <Pill positive={displayUp}>{a.pct}</Pill>
              </div>
              <div className={`bb-strip__spark bb-strip__spark--${displayUp ? 'up' : 'dn'}`} aria-hidden>
                <StripSparkline values={buildStripValues(seedFromStr(a.name), displayUp)} up={displayUp} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bb-split">
        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">MARKET SUMMARY</span>
            <span className="bb-win__meta mono">UPD 12S</span>
          </header>
          <ul className="bb-news">
            <li className="bb-news__item bb-news__item--on">
              <button type="button" className="bb-news__line bb-news__line--hot">
                Equities firm as duration risk fades; megacap tech leads breadth recovery.
              </button>
              <p className="bb-news__body">
                Futures track higher with rate-sensitive growth outperforming defensives. Flow data
                shows systematic buying into the close; watch liquidity around key strikes.
              </p>
              <div className="bb-news__src">
                <span className="mono">62 SRC</span>
              </div>
            </li>
            <li className="bb-news__item">
              <button type="button" className="bb-news__line">
                Credit spreads unchanged; IG demand steady into month-end.
              </button>
            </li>
            <li className="bb-news__item">
              <button type="button" className="bb-news__line">
                Dollar index drifts; EM FX mixed on carry positioning.
              </button>
            </li>
          </ul>
        </section>

        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">KEY METRICS</span>
          </header>
          <div className="bb-metrics">
            <div className="bb-metrics__row">
              <span className="bb-metrics__k">ADV/DEC NYSE</span>
              <span className="bb-metrics__v mono">1.84</span>
            </div>
            <div className="bb-metrics__row">
              <span className="bb-metrics__k">PCT &gt;50DMA</span>
              <span className="bb-metrics__v mono">58.2</span>
            </div>
            <div className="bb-metrics__row">
              <span className="bb-metrics__k">HI/LO</span>
              <span className="bb-metrics__v mono">1.12</span>
            </div>
            <div className="bb-metrics__row">
              <span className="bb-metrics__k">P/C EQTY</span>
              <span className="bb-metrics__v mono">0.91</span>
            </div>
          </div>
        </section>
      </div>

      <section className="bb-win bb-win--wide">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">S&amp;P 500 HEATMAP</span>
          <button type="button" className="bb-btn">
            EXPAND
          </button>
        </header>
        <div className="bb-heat">
          <div className="bb-heat__grid">
            {['XLK', 'XLV', 'XLF', 'XLE', 'XLY', 'XLI', 'XLP', 'XLU'].map((s, i) => (
              <div
                key={s}
                className="bb-heat__tile"
                style={{
                  opacity: 0.5 + (i % 3) * 0.15,
                  background: i % 3 === 0 ? '#063206' : i % 3 === 1 ? '#3a0606' : '#222',
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="bb-heat__leg">
            <span className="mono muted">-3%</span>
            <div className="bb-heat__bar" />
            <span className="mono muted">+3%</span>
            <span className="bb-heat__attr mono">{BRAND_ACRONYM}</span>
          </div>
        </div>
      </section>

      <section className="bb-win">
        <header className="bb-win__bar bb-win__bar--tabs">
          <span className="bb-win__ttl">WATCHLIST</span>
          <div className="bb-tabs" role="tablist">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                className={`bb-tabs__t${r === '1M' ? ' bb-tabs__t--on' : ''}`}
              >
                {r}
              </button>
            ))}
          </div>
        </header>
        <div className="bb-scroll">
          <table className="bb-grid">
            <thead>
              <tr>
                <th>NAME</th>
                <th className="bb-grid__r">PX</th>
                <th className="bb-grid__r">1D</th>
                <th className="bb-grid__r">1M</th>
                <th className="bb-grid__r">MKT CAP</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((row) => (
                <tr key={row.sym}>
                  <td>
                    <div className="bb-nm">
                      <span className="bb-nm__t">{row.name}</span>
                      <span className="bb-nm__s mono">{row.sym} US</span>
                    </div>
                  </td>
                  <td className="bb-grid__r mono">{row.price}</td>
                  <td className={`bb-grid__r mono ${row.d1.startsWith('-') ? 'neg' : 'pos'}`}>
                    {row.d1}
                  </td>
                  <td className={`bb-grid__r mono ${row.m1.startsWith('-') ? 'neg' : 'pos'}`}>
                    {row.m1}
                  </td>
                  <td className="bb-grid__r mono muted">{row.cap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
