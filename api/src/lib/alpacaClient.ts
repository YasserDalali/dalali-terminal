/** Alpaca Market Data v2 — https://docs.alpaca.markets/reference/stockbars */

export const ALPACA_DATA_REST_DEFAULT = 'https://data.alpaca.markets'

export type AlpacaBar = {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
  n?: number
  vw?: number
}

export type AlpacaStockBarsResponse = {
  bars?: Record<string, AlpacaBar[]>
  next_page_token?: string | null
}

export type AlpacaStockBarsParams = {
  symbols: string
  timeframe: string
  limit?: number
  start?: string
  end?: string
  /** e.g. iex, sip — must match subscription */
  feed?: string
  adjustment?: string
}

export function buildAlpacaStockBarsUrl(baseRestUrl: string, params: AlpacaStockBarsParams): URL {
  const base = baseRestUrl.replace(/\/$/, '')
  const u = new URL(`${base}/v2/stocks/bars`)
  u.searchParams.set('symbols', params.symbols.replace(/^\s+|\s+$/g, '').toUpperCase())
  u.searchParams.set('timeframe', params.timeframe)
  if (params.limit != null) u.searchParams.set('limit', String(params.limit))
  if (params.start) u.searchParams.set('start', params.start)
  if (params.end) u.searchParams.set('end', params.end)
  if (params.feed) u.searchParams.set('feed', params.feed)
  if (params.adjustment) u.searchParams.set('adjustment', params.adjustment)
  return u
}

export async function fetchAlpacaStockBars(
  keyId: string,
  secretKey: string,
  baseRestUrl: string,
  params: AlpacaStockBarsParams,
): Promise<AlpacaStockBarsResponse> {
  const u = buildAlpacaStockBarsUrl(baseRestUrl, params)
  const res = await fetch(u.toString(), {
    headers: {
      'APCA-API-KEY-ID': keyId,
      'APCA-API-SECRET-KEY': secretKey,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Alpaca ${res.status}: ${text.slice(0, 500)}`)
  }
  return JSON.parse(text) as AlpacaStockBarsResponse
}
