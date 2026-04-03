import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FinDataTable, type FinDataTableCol } from '../fin/FinDataTable'
import { EquityLink } from '../EquityLink'
import { equityHref } from '../../navigation/equityRoutes'
import { BRAND_ACRONYM } from '../../data/brand'
import { StripSparkline } from '../charts/StripSparkline'
import { useMarketData, type WatchlistRow } from '../../services/market/marketDataStore'

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const

function Pill({ children, positive }: { children: ReactNode; positive: boolean }) {
  return (
    <span className={`bb-pill bb-pill--${positive ? 'up' : 'dn'}`}>
      <span className="mono">{children}</span>
    </span>
  )
}

function formatRefreshMeta(lastUpdated: Date | null, tick: number): string {
  void tick
  if (!lastUpdated) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
  if (sec < 90) return `UPD ${sec}S`
  return `UPD ${lastUpdated.toLocaleTimeString(undefined, { hour12: false })}`
}

export function MarketsOverview() {
  const navigate = useNavigate()
  const { indices, watchlist, heatmap, loading, error, lastUpdated, refresh, setEquitySymbol } = useMarketData()
  const [tick, setTick] = useState(0)

  const openEquity = useCallback(
    (sym: string) => {
      setEquitySymbol(sym)
      navigate(equityHref(sym))
    },
    [navigate, setEquitySymbol],
  )

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  const watchCols = useMemo((): FinDataTableCol<WatchlistRow>[] => {
    return [
      {
        key: 'nm',
        header: 'NAME',
        cell: (row) => (
          <div className="bb-nm">
            <span className="bb-nm__t">{row.name}</span>
            <span className="bb-nm__s mono">
              <EquityLink symbol={row.sym} onClick={(e) => e.stopPropagation()}>
                {row.sym}
              </EquityLink>
              {' US'}
            </span>
          </div>
        ),
        searchText: (row) => `${row.name} ${row.sym}`,
      },
      {
        key: 'px',
        header: 'PX',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (row) => row.price,
      },
      {
        key: 'd1',
        header: '1D',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (row) => {
          if (row.d1 === '—') return row.d1
          const neg = row.d1.startsWith('-')
          return <span className={neg ? 'neg' : 'pos'}>{row.d1}</span>
        },
        searchText: (row) => row.d1,
      },
      {
        key: 'm1',
        header: '1M',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (row) => {
          if (row.m1 === '—') return row.m1
          const neg = row.m1.startsWith('-')
          return <span className={neg ? 'neg' : 'pos'}>{row.m1}</span>
        },
      },
      {
        key: 'cap',
        header: 'MKT CAP',
        className: 'bb-grid__r mono muted',
        thClassName: 'bb-grid__r',
        cell: (row) => row.cap,
      },
    ]
  }, [])

  return (
    <div className="bb-workspace">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">MKT</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">MARKET OVERVIEW</span>
        <span className="bb-workspace__fill" />
        {loading ? <span className="mono muted">Loading…</span> : null}
        {error ? (
          <button type="button" className="bb-btn" onClick={() => void refresh()} title={error}>
            Retry
          </button>
        ) : null}
        <label className="bb-workspace__fld">
          REGION
          <select className="bb-sel" defaultValue="US">
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="ASIA">ASIA</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mono muted" style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
          {error}
        </p>
      ) : null}

      <div className="bb-strip" aria-label="Indices">
        {indices.map((a) => {
          const displayUp = a.inverse ? !a.up : a.up
          const spark =
            a.sparkCloses.length >= 2 ? a.sparkCloses : [displayUp ? 52 : 48, displayUp ? 54 : 46]
          return (
            <div key={a.id} className="bb-strip__cell">
              <div className="bb-strip__sym">{a.label}</div>
              <div className="bb-strip__px mono">{a.price}</div>
              <div className="bb-strip__ch">
                <Pill positive={displayUp}>{a.delta}</Pill>
                <Pill positive={displayUp}>{a.pct}</Pill>
              </div>
              <div className={`bb-strip__spark bb-strip__spark--${displayUp ? 'up' : 'dn'}`} aria-hidden>
                <StripSparkline values={spark} up={displayUp} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bb-split">
        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">MARKET SUMMARY</span>
            <span className="bb-win__meta mono">{formatRefreshMeta(lastUpdated, tick)}</span>
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
            {heatmap.map((t) => (
              <EquityLink
                key={t.sym}
                symbol={t.sym}
                unstyled
                className="bb-heat__tile mono"
                style={{
                  opacity: 0.45 + t.intensity * 0.48,
                  background: t.up
                    ? `rgb(6, ${38 + Math.round(t.intensity * 100)}, 12)`
                    : `rgb(${42 + Math.round(t.intensity * 100)}, 8, 8)`,
                }}
                title={`${t.sym} ${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%`}
              >
                {t.sym}
              </EquityLink>
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
        <FinDataTable
          rows={watchlist}
          columns={watchCols}
          rowKey={(row) => row.sym}
          pageSize={10}
          searchPlaceholder="Search watchlist…"
          onRowClick={(row) => openEquity(row.sym)}
        />
      </section>
    </div>
  )
}
