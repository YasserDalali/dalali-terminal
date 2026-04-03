import { EQUITY_CHART_RANGES, type EquityChartRange } from './equityChartRanges'

/** Primary listing region shown in markets UI (Stooq watchlist is US-listed). */
export const MARKETS_PRIMARY_REGION = { code: 'US' as const, label: 'US' as const }

/** Appended after the ticker in the watchlist name column (e.g. "AAPL US"). */
export const MARKETS_WATCHLIST_LISTING_SUFFIX = ' US'

export const MARKETS_REGION_SELECT_TITLE =
  'Watchlist and indices use US-listed Stooq symbols only'

export const MARKETS_CLOCK_TICK_MS = 1000

/** Below this many seconds since last refresh, show "UPD Ns" instead of clock time. */
export const MARKETS_REFRESH_META_RECENT_SEC = 90

export const MARKETS_WATCHLIST_PAGE_SIZE = 10

export const DEFAULT_WATCHLIST_CHART_RANGE: EquityChartRange = '1M'

export const MARKETS_ERROR_TEXT_STYLE = {
  margin: '0.5rem 0 0',
  fontSize: '0.85rem',
} as const

export type DemoMarketNewsItem = {
  line: string
  body?: string
  source?: string
  hot?: boolean
}

export const MARKETS_DEMO_SUMMARY_TITLE = 'MARKET SUMMARY · DEMO'
export const MARKETS_DEMO_SUMMARY_SUBTITLE = 'Placeholder copy only — not wired to a news feed.'
export const MARKETS_DEMO_SUMMARY_ITEMS: DemoMarketNewsItem[] = [
  {
    line: 'Equities firm as duration risk fades; megacap tech leads breadth recovery.',
    body: 'Futures track higher with rate-sensitive growth outperforming defensives. Flow data shows systematic buying into the close; watch liquidity around key strikes.',
    source: 'DEMO',
    hot: true,
  },
  {
    line: 'Credit spreads unchanged; IG demand steady into month-end.',
  },
  {
    line: 'Dollar index drifts; EM FX mixed on carry positioning.',
  },
]

export const MARKETS_DEMO_METRICS_TITLE = 'KEY METRICS · DEMO'
export const MARKETS_DEMO_METRICS_SUBTITLE =
  'Sample numbers for layout — not live breadth or options data.'

export type DemoKeyMetricRow = { key: string; value: string }

export const MARKETS_DEMO_KEY_METRICS: DemoKeyMetricRow[] = [
  { key: 'ADV/DEC NYSE', value: '1.84' },
  { key: 'PCT >50DMA', value: '58.2' },
  { key: 'HI/LO', value: '1.12' },
  { key: 'P/C EQTY', value: '0.91' },
]

export const MARKETS_HEATMAP_SECTION_TITLE = 'S&P 500 HEATMAP'

export const MARKETS_SPARKLINE_EMPTY_STYLE = {
  fontSize: '0.7rem',
  alignSelf: 'center' as const,
}

export const MARKETS_DEMO_PANEL_CAPTION_STYLE = {
  margin: '0.35rem 0.75rem',
  fontSize: '0.75rem',
} as const

export { EQUITY_CHART_RANGES }
