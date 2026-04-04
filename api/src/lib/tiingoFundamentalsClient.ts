/** Tiingo fundamentals + news — https://api.tiingo.com/documentation/fundamentals */

import { TIINGO_API_ROOT } from './tiingoClient.js'

async function tiingoGet(token: string, path: string, query?: Record<string, string | undefined>): Promise<unknown> {
  const u = new URL(`${TIINGO_API_ROOT}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') u.searchParams.set(k, v)
    }
  }
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
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Tiingo: response was not JSON')
  }
}

/** Ticker metadata (not prices) — GET /tiingo/daily/{ticker} */
export async function fetchTiingoDailyMeta(token: string, ticker: string): Promise<unknown> {
  const sym = ticker.replace(/^\s+|\s+$/g, '').toUpperCase()
  return tiingoGet(token, `/tiingo/daily/${encodeURIComponent(sym)}`)
}

/** Quarterly / annual statements — GET /tiingo/fundamentals/{ticker}/statements */
export async function fetchTiingoFundamentalsStatements(
  token: string,
  ticker: string,
  opts: { startDate?: string; endDate?: string; asReported?: boolean },
): Promise<unknown> {
  const sym = ticker.replace(/^\s+|\s+$/g, '').toUpperCase()
  return tiingoGet(token, `/tiingo/fundamentals/${encodeURIComponent(sym)}/statements`, {
    startDate: opts.startDate,
    endDate: opts.endDate,
    asReported: opts.asReported === true ? 'true' : 'false',
    format: 'json',
  })
}

/** Daily-updated fundamental metrics — GET /tiingo/fundamentals/{ticker}/daily */
export async function fetchTiingoFundamentalsDaily(
  token: string,
  ticker: string,
  opts: { startDate?: string; endDate?: string },
): Promise<unknown> {
  const sym = ticker.replace(/^\s+|\s+$/g, '').toUpperCase()
  return tiingoGet(token, `/tiingo/fundamentals/${encodeURIComponent(sym)}/daily`, {
    startDate: opts.startDate,
    endDate: opts.endDate,
    format: 'json',
  })
}

/** Metric definitions — GET /tiingo/fundamentals/definitions */
export async function fetchTiingoFundamentalsDefinitions(
  token: string,
  tickersComma: string,
): Promise<unknown> {
  return tiingoGet(token, '/tiingo/fundamentals/definitions', {
    tickers: tickersComma.replace(/^\s+|\s+$/g, ''),
    format: 'json',
  })
}

/** News — GET /tiingo/news */
export async function fetchTiingoNews(
  token: string,
  opts: { tickers: string; limit?: number; startDate?: string; endDate?: string },
): Promise<unknown> {
  return tiingoGet(token, '/tiingo/news', {
    tickers: opts.tickers.replace(/^\s+|\s+$/g, ''),
    limit: opts.limit != null ? String(Math.min(1000, Math.max(1, opts.limit))) : '50',
    startDate: opts.startDate,
    endDate: opts.endDate,
  })
}
