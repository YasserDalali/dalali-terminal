/** Stooq-backed symbols for markets + equity watch defaults. */

export type IndexStripConfig = {
  id: string
  /** Header label in the strip */
  label: string
  stooq: string
  inverse?: boolean
}

export const INDEX_STRIP: IndexStripConfig[] = [
  { id: 'spx', label: 'SPX INDEX', stooq: '^spx' },
  { id: 'ndx', label: 'NDX INDEX', stooq: '^ndx' },
  { id: 'dji', label: 'DJI INDEX', stooq: '^dji' },
  { id: 'vix', label: 'VIX INDEX', stooq: '^vix', inverse: true },
]

export type WatchlistConfig = {
  sym: string
  name: string
  /** Optional display when fundamentals are not from feed */
  capHint?: string
  stooq: string
}

export const DEFAULT_WATCHLIST: WatchlistConfig[] = [
  { sym: 'AAPL', name: 'APPLE INC', capHint: '3.6T', stooq: 'aapl.us' },
  { sym: 'MSFT', name: 'MICROSOFT CP', capHint: '3.1T', stooq: 'msft.us' },
  { sym: 'NVDA', name: 'NVIDIA CORP', capHint: '3.2T', stooq: 'nvda.us' },
  { sym: 'META', name: 'META PLATFORMS', capHint: '1.5T', stooq: 'meta.us' },
]

export const SECTOR_ETFS: { sym: string; stooq: string }[] = [
  { sym: 'XLK', stooq: 'xlk.us' },
  { sym: 'XLV', stooq: 'xlv.us' },
  { sym: 'XLF', stooq: 'xlf.us' },
  { sym: 'XLE', stooq: 'xle.us' },
  { sym: 'XLY', stooq: 'xly.us' },
  { sym: 'XLI', stooq: 'xli.us' },
  { sym: 'XLP', stooq: 'xlp.us' },
  { sym: 'XLU', stooq: 'xlu.us' },
]

export const DEFAULT_EQUITY_SYMBOL = 'MSFT'

export type EquityListingMeta = {
  name: string
  exchange: string
  country: string
  peers: string[]
}

/** Static listing text; prices come from Stooq. */
export const EQUITY_LISTING: Record<string, EquityListingMeta> = {
  AAPL: {
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['MSFT', 'GOOGL', 'META', 'AMZN', 'DELL'],
  },
  MSFT: {
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['AAPL', 'GOOGL', 'META', 'AMZN', 'ORCL'],
  },
  NVDA: {
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['AMD', 'AVGO', 'INTC', 'QCOM', 'MSFT'],
  },
  META: {
    name: 'Meta Platforms Inc.',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['GOOGL', 'SNAP', 'PINS', 'MSFT', 'AMZN'],
  },
  GOOGL: {
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['META', 'MSFT', 'AMZN', 'NFLX', 'DIS'],
  },
  AMZN: {
    name: 'Amazon.com Inc.',
    exchange: 'NASDAQ',
    country: 'US',
    peers: ['WMT', 'TGT', 'META', 'MSFT', 'GOOGL'],
  },
  ORCL: {
    name: 'Oracle Corporation',
    exchange: 'NYSE',
    country: 'US',
    peers: ['MSFT', 'SAP', 'CRM', 'NOW', 'IBM'],
  },
  VOO: {
    name: 'Vanguard S&P 500 ETF',
    exchange: 'NYSE',
    country: 'US',
    peers: ['SPY', 'IVV', 'SPLG', 'VTI', 'VO'],
  },
}
