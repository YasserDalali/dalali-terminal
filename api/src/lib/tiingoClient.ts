/** Tiingo REST — https://api.tiingo.com/documentation/general/connecting */

export const TIINGO_API_ROOT = 'https://api.tiingo.com'

export type TiingoDailyQuery = {
  startDate?: string
  endDate?: string
  /** When true, request only columns needed for EOD charting. */
  resampleFreq?: string
}

export function buildTiingoDailyPricesUrl(ticker: string, query: TiingoDailyQuery): URL {
  const sym = ticker.replace(/^\s+|\s+$/g, '').toUpperCase()
  const u = new URL(`${TIINGO_API_ROOT}/tiingo/daily/${encodeURIComponent(sym)}/prices`)
  if (query.startDate) u.searchParams.set('startDate', query.startDate)
  if (query.endDate) u.searchParams.set('endDate', query.endDate)
  if (query.resampleFreq) u.searchParams.set('resampleFreq', query.resampleFreq)
  return u
}

export type TiingoPriceRow = {
  date: string
  close: number
  adjClose: number
  high?: number
  low?: number
  open?: number
  volume?: number
}

export async function fetchTiingoDailyPrices(
  token: string,
  ticker: string,
  query: TiingoDailyQuery,
): Promise<TiingoPriceRow[]> {
  const u = buildTiingoDailyPricesUrl(ticker, query)
  const res = await fetch(u.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Tiingo ${res.status}: ${text.slice(0, 500)}`)
  }
  const body = JSON.parse(text) as unknown
  if (!Array.isArray(body)) {
    throw new Error('Tiingo: expected array of prices')
  }
  return body as TiingoPriceRow[]
}
