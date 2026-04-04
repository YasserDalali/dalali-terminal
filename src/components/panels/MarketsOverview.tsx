import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FinDataTable, type FinDataTableCol } from '../fin/FinDataTable'
import { EquityLink } from '../EquityLink'
import { equityPath } from '../../routes/modulePaths'
import { BRAND_ACRONYM } from '../../data/brand'
import { StripSparkline } from '../charts/StripSparkline'
import {
  DEFAULT_WATCHLIST_CHART_RANGE,
  EQUITY_CHART_RANGES,
  MARKETS_CLOCK_TICK_MS,
  MARKETS_DEMO_KEY_METRICS,
  MARKETS_DEMO_METRICS_SUBTITLE,
  MARKETS_DEMO_METRICS_TITLE,
  MARKETS_DEMO_PANEL_CAPTION_STYLE,
  MARKETS_DEMO_SUMMARY_ITEMS,
  MARKETS_DEMO_SUMMARY_SUBTITLE,
  MARKETS_DEMO_SUMMARY_TITLE,
  MARKETS_ERROR_TEXT_STYLE,
  MARKETS_HEATMAP_SECTION_TITLE,
  MARKETS_PRIMARY_REGION,
  MARKETS_REFRESH_META_RECENT_SEC,
  MARKETS_REGION_SELECT_TITLE,
  MARKETS_SPARKLINE_EMPTY_STYLE,
  MARKETS_WATCHLIST_LISTING_SUFFIX,
  MARKETS_WATCHLIST_PAGE_SIZE,
} from '../../data/marketsOverviewConfig'
import {
  HEATMAP_ABS_PCT_FULL_INTENSITY,
  heatmapTileBackground,
  heatmapTileOpacity,
} from '../../services/market/marketConfig'
import { useMarketData, type WatchlistRow } from '../../services/market/marketDataStore'
import { MarketsMacroStrip } from './MarketsMacroStrip'

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
  if (sec < MARKETS_REFRESH_META_RECENT_SEC) return `UPD ${sec}S`
  return `UPD ${lastUpdated.toLocaleTimeString(undefined, { hour12: false })}`
}

export function MarketsOverview() {
  const navigate = useNavigate()
  const {
    indices,
    watchlist,
    heatmap,
    loading,
    error,
    partialWarning,
    lastUpdated,
    refresh,
    setEquitySymbol,
  } = useMarketData()
  const [tick, setTick] = useState(0)

  const openEquity = useCallback(
    (sym: string) => {
      setEquitySymbol(sym)
      navigate(equityPath(sym))
    },
    [navigate, setEquitySymbol],
  )

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), MARKETS_CLOCK_TICK_MS)
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
              {MARKETS_WATCHLIST_LISTING_SUFFIX}
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
        <label className="bb-workspace__fld" title={MARKETS_REGION_SELECT_TITLE}>
          REGION
          <select className="bb-sel" disabled value={MARKETS_PRIMARY_REGION.code}>
            <option value={MARKETS_PRIMARY_REGION.code}>{MARKETS_PRIMARY_REGION.label}</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mono muted" style={MARKETS_ERROR_TEXT_STYLE}>
          {error}
        </p>
      ) : null}
      {partialWarning ? (
        <p className="mono muted" style={MARKETS_ERROR_TEXT_STYLE}>
          {partialWarning}
        </p>
      ) : null}

      <div className="bb-strip" aria-label="Indices">
        {indices.map((a) => {
          const displayUp = a.inverse ? !a.up : a.up
          const hasSpark = a.sparkCloses.length >= 2
          return (
            <div key={a.id} className="bb-strip__cell">
              <div className="bb-strip__sym">{a.label}</div>
              <div className="bb-strip__px mono">{a.price}</div>
              <div className="bb-strip__ch">
                <Pill positive={displayUp}>{a.delta}</Pill>
                <Pill positive={displayUp}>{a.pct}</Pill>
              </div>
              <div
                className={`bb-strip__spark bb-strip__spark--${displayUp ? 'up' : 'dn'}`}
                aria-hidden
                title={hasSpark ? undefined : 'No intraday series; sparkline hidden'}
              >
                {hasSpark ? (
                  <StripSparkline values={a.sparkCloses} up={displayUp} />
                ) : (
                  <span className="mono muted" style={MARKETS_SPARKLINE_EMPTY_STYLE}>
                    —
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <MarketsMacroStrip />

      <div className="bb-split">
        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">{MARKETS_DEMO_SUMMARY_TITLE}</span>
            <span className="bb-win__meta mono">{formatRefreshMeta(lastUpdated, tick)}</span>
          </header>
          <p className="mono muted" style={MARKETS_DEMO_PANEL_CAPTION_STYLE}>
            {MARKETS_DEMO_SUMMARY_SUBTITLE}
          </p>
          <ul className="bb-news">
            {MARKETS_DEMO_SUMMARY_ITEMS.map((item, i) => (
              <li
                key={i}
                className={`bb-news__item${item.hot ? ' bb-news__item--on' : ''}`}
              >
                <button
                  type="button"
                  className={`bb-news__line${item.hot ? ' bb-news__line--hot' : ''}`}
                  disabled
                >
                  {item.line}
                </button>
                {item.body ? <p className="bb-news__body">{item.body}</p> : null}
                {item.source ? (
                  <div className="bb-news__src">
                    <span className="mono">{item.source}</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">{MARKETS_DEMO_METRICS_TITLE}</span>
          </header>
          <p className="mono muted" style={MARKETS_DEMO_PANEL_CAPTION_STYLE}>
            {MARKETS_DEMO_METRICS_SUBTITLE}
          </p>
          <div className="bb-metrics">
            {MARKETS_DEMO_KEY_METRICS.map((row) => (
              <div key={row.key} className="bb-metrics__row">
                <span className="bb-metrics__k">{row.key}</span>
                <span className="bb-metrics__v mono">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bb-win bb-win--wide">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">{MARKETS_HEATMAP_SECTION_TITLE}</span>
          <button type="button" className="bb-btn" disabled title="Not implemented">
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
                className={`bb-heat__tile mono${t.unavailable ? ' bb-heat__tile--na' : ''}`}
                style={
                  t.unavailable || t.changePct == null
                    ? {
                        opacity: 0.4,
                        background: 'rgba(48, 52, 58, 0.85)',
                      }
                    : {
                        opacity: heatmapTileOpacity(t.intensity),
                        background: heatmapTileBackground(t.up, t.intensity),
                      }
                }
                title={
                  t.unavailable || t.changePct == null
                    ? `${t.sym} — no data`
                    : `${t.sym} ${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%`
                }
              >
                {t.sym}
              </EquityLink>
            ))}
          </div>
          <div className="bb-heat__leg">
            <span className="mono muted">-{HEATMAP_ABS_PCT_FULL_INTENSITY}%</span>
            <div className="bb-heat__bar" />
            <span className="mono muted">+{HEATMAP_ABS_PCT_FULL_INTENSITY}%</span>
            <span className="bb-heat__attr mono">{BRAND_ACRONYM}</span>
          </div>
        </div>
      </section>

      <section className="bb-win">
        <header className="bb-win__bar bb-win__bar--tabs">
          <span className="bb-win__ttl">WATCHLIST</span>
          <div className="bb-tabs" role="tablist" title="Watchlist time range not wired to data">
            {EQUITY_CHART_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                disabled
                className={`bb-tabs__t${r === DEFAULT_WATCHLIST_CHART_RANGE ? ' bb-tabs__t--on' : ''}`}
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
          pageSize={MARKETS_WATCHLIST_PAGE_SIZE}
          searchPlaceholder="Search watchlist…"
          onRowClick={(row) => openEquity(row.sym)}
        />
      </section>
    </div>
  )
}
