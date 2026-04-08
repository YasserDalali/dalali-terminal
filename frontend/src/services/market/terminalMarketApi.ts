/** Calls portfolio BFF (same origin in dev via Vite proxy, or VITE_PORTFOLIO_API_BASE in prod). */
import { portfolioApiUrl as apiUrl } from './portfolioApiUrl'

export type FredMacroSnapshotOk = {
  ok: true
  cached?: boolean
  items?: Array<{
    id: string
    label: string
    latest?: { date: string; value: string }
    prior?: { date: string; value: string }
    observationCount?: number
  }>
  fetchedAt?: string
}

export type FredMacroSnapshotErr = { ok: false; error?: string }

export async function fetchFredMacroSnapshot(): Promise<FredMacroSnapshotOk | FredMacroSnapshotErr> {
  const res = await fetch(apiUrl('/api/macro/fred/snapshot'))
  const j = (await res.json()) as FredMacroSnapshotOk | FredMacroSnapshotErr
  if (!res.ok) return { ok: false, error: (j as FredMacroSnapshotErr).error ?? `HTTP ${res.status}` }
  return j
}

export type BenchmarkRow = {
  source: 'tiingo' | 'alpaca'
  symbol: string
  label: string
  last?: number
  asOf?: string
  error?: string
}

export async function fetchSpyTiingoAdj(): Promise<BenchmarkRow> {
  const symbol = 'SPY'
  try {
    const start = new Date()
    start.setDate(start.getDate() - 14)
    const startDate = start.toISOString().slice(0, 10)
    const u = `${apiUrl(`/api/market/tiingo/daily/${encodeURIComponent(symbol)}`)}?startDate=${startDate}`
    const res = await fetch(u)
    const j = (await res.json()) as {
      ok?: boolean
      error?: string
      prices?: Array<{ date: string; adjClose: number }>
    }
    if (!res.ok || !j.ok) {
      return { source: 'tiingo', symbol, label: 'SPY adj. (Tiingo)', error: j.error ?? `HTTP ${res.status}` }
    }
    const last = j.prices?.length ? j.prices[j.prices.length - 1] : undefined
    return {
      source: 'tiingo',
      symbol,
      label: 'SPY adj. (Tiingo)',
      last: last?.adjClose,
      asOf: last?.date,
    }
  } catch (e) {
    return {
      source: 'tiingo',
      symbol,
      label: 'SPY adj. (Tiingo)',
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function fetchSpyAlpacaDay(): Promise<BenchmarkRow> {
  const symbol = 'SPY'
  try {
    const params = new URLSearchParams({
      symbols: symbol,
      timeframe: '1Day',
      limit: '5',
    })
    const res = await fetch(`${apiUrl('/api/market/alpaca/bars')}?${params}`)
    const j = (await res.json()) as {
      ok?: boolean
      error?: string
      bars?: Record<string, Array<{ c: number; t: string }>>
    }
    if (!res.ok || !j.ok) {
      return { source: 'alpaca', symbol, label: 'SPY close (Alpaca)', error: j.error ?? `HTTP ${res.status}` }
    }
    const row = j.bars?.[symbol]?.length ? j.bars[symbol]![j.bars[symbol]!.length - 1] : undefined
    return {
      source: 'alpaca',
      symbol,
      label: 'SPY close (Alpaca)',
      last: row?.c,
      asOf: row?.t,
    }
  } catch (e) {
    return {
      source: 'alpaca',
      symbol,
      label: 'SPY close (Alpaca)',
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
