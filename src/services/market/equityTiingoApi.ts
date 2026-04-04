import { portfolioApiUrl } from './portfolioApiUrl'

async function getBffJson(path: string): Promise<{
  ok: boolean
  error?: string
  cached?: boolean
  [k: string]: unknown
}> {
  const res = await fetch(portfolioApiUrl(path))
  let j: { ok?: boolean; error?: string; [k: string]: unknown }
  try {
    j = (await res.json()) as typeof j
  } catch {
    throw new Error(`Bad JSON (HTTP ${res.status})`)
  }
  if (!res.ok || !j.ok) {
    throw new Error((j.error as string) ?? `HTTP ${res.status}`)
  }
  return j as { ok: boolean; error?: string; cached?: boolean; [k: string]: unknown }
}

export async function fetchEquityTiingoMeta(symbol: string): Promise<unknown> {
  const sym = encodeURIComponent(symbol.trim().toUpperCase())
  const j = await getBffJson(`/api/market/tiingo/meta/${sym}`)
  return j.data
}

export async function fetchEquityFundamentalsStatements(
  symbol: string,
  opts?: { startDate?: string; endDate?: string; asReported?: boolean },
): Promise<unknown> {
  const sym = encodeURIComponent(symbol.trim().toUpperCase())
  const q = new URLSearchParams()
  if (opts?.startDate) q.set('startDate', opts.startDate)
  if (opts?.endDate) q.set('endDate', opts.endDate)
  if (opts?.asReported) q.set('asReported', 'true')
  const qs = q.toString()
  const j = await getBffJson(`/api/market/tiingo/fundamentals/${sym}/statements${qs ? `?${qs}` : ''}`)
  return j.data
}

export async function fetchEquityFundamentalsDaily(
  symbol: string,
  opts?: { startDate?: string; endDate?: string },
): Promise<unknown> {
  const sym = encodeURIComponent(symbol.trim().toUpperCase())
  const q = new URLSearchParams()
  if (opts?.startDate) q.set('startDate', opts.startDate)
  if (opts?.endDate) q.set('endDate', opts.endDate)
  const qs = q.toString()
  const j = await getBffJson(`/api/market/tiingo/fundamentals/${sym}/daily${qs ? `?${qs}` : ''}`)
  return j.data
}

export async function fetchEquityFundamentalsDefinitions(symbol: string): Promise<unknown> {
  const j = await getBffJson(
    `/api/market/tiingo/fundamentals/definitions?tickers=${encodeURIComponent(symbol.trim().toUpperCase())}`,
  )
  return j.data
}

export type TiingoNewsItem = {
  title?: string
  description?: string
  publishedDate?: string
  url?: string
  source?: string
  crawlDate?: string
}

export async function fetchEquityTiingoNews(symbol: string, limit = 40): Promise<TiingoNewsItem[]> {
  const j = await getBffJson(
    `/api/market/tiingo/news?tickers=${encodeURIComponent(symbol.trim().toUpperCase())}&limit=${limit}`,
  )
  const raw = j.data
  if (!Array.isArray(raw)) return []
  return raw as TiingoNewsItem[]
}
