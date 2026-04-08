/** US tickers for Tiingo (via portfolio API). Index strip uses liquid ETF proxies. */

export type IndexStripConfig = {
  id: string
  /** Header label in the strip */
  label: string
  /** Tiingo / API symbol */
  symbol: string
  inverse?: boolean
}

export const INDEX_STRIP: IndexStripConfig[] = [
  { id: 'spx', label: 'S&P 500', symbol: 'SPY' },
  { id: 'ndx', label: 'NASDAQ 100', symbol: 'QQQ' },
  { id: 'dji', label: 'DOW', symbol: 'DIA' },
  { id: 'vix', label: 'VIX', symbol: 'VIX', inverse: true },
]

export type WatchlistConfig = {
  sym: string
  name: string
  /** Optional display when fundamentals are not from feed */
  capHint?: string
}

export const DEFAULT_WATCHLIST: WatchlistConfig[] = [
  { sym: 'AAPL', name: 'APPLE INC', capHint: '3.6T' },
  { sym: 'MSFT', name: 'MICROSOFT CP', capHint: '3.1T' },
  { sym: 'NVDA', name: 'NVIDIA CORP', capHint: '3.2T' },
  { sym: 'META', name: 'META PLATFORMS', capHint: '1.5T' },
]

/** Daily move (±%) at which heatmap tile saturation reaches full intensity; legend uses the same scale. */
export const HEATMAP_ABS_PCT_FULL_INTENSITY = 3

export function heatmapTileOpacity(intensity: number): number {
  return 0.45 + intensity * 0.48
}

export function heatmapTileBackground(up: boolean, intensity: number): string {
  if (up) {
    return `rgb(6, ${38 + Math.round(intensity * 100)}, 12)`
  }
  return `rgb(${42 + Math.round(intensity * 100)}, 8, 8)`
}

export const SECTOR_ETFS: { sym: string }[] = [
  { sym: 'XLK' },
  { sym: 'XLV' },
  { sym: 'XLF' },
  { sym: 'XLE' },
  { sym: 'XLY' },
  { sym: 'XLI' },
  { sym: 'XLP' },
  { sym: 'XLU' },
]

export const DEFAULT_EQUITY_SYMBOL = 'MSFT'

export type EquityListingMeta = {
  name: string
  exchange: string
  country: string
  peers: string[]
}

/** Static listing; prices from Tiingo via API. */
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
