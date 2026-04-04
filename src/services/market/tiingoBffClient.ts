import type { DailyOhlcvBar, EodCloseBar } from './dailyBarTypes'
import { portfolioApiUrl } from './portfolioApiUrl'

function ymdToIso(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) return ymd
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function isoDateToYmd(iso: string): string {
  const d = iso.slice(0, 10)
  return d.replace(/-/g, '')
}

type TiingoPriceRow = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjOpen?: number
  adjHigh?: number
  adjLow?: number
  adjClose?: number
}

/** Prefer adjusted OHLC for splits/dividends. */
export function mapTiingoPricesToDailyOhlcv(prices: TiingoPriceRow[]): DailyOhlcvBar[] {
  const out: DailyOhlcvBar[] = []
  for (const r of prices) {
    if (!r?.date) continue
    const close = Number.isFinite(r.adjClose) ? r.adjClose! : r.close
    if (!Number.isFinite(close)) continue
    const open = Number.isFinite(r.adjOpen) ? r.adjOpen! : r.open
    const high = Number.isFinite(r.adjHigh) ? r.adjHigh! : r.high
    const low = Number.isFinite(r.adjLow) ? r.adjLow! : r.low
    const volume = Number.isFinite(r.volume) ? r.volume : 0
    out.push({
      dateYmd: isoDateToYmd(r.date),
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : close,
      low: Number.isFinite(low) ? low : close,
      close,
      volume,
    })
  }
  return out.sort((a, b) => a.dateYmd.localeCompare(b.dateYmd))
}

export async function fetchTiingoDailyOhlcvFromApi(
  symbol: string,
  startYmd: string,
  endYmd: string,
): Promise<DailyOhlcvBar[]> {
  const sym = symbol.trim().toUpperCase()
  const startDate = ymdToIso(startYmd)
  const endDate = ymdToIso(endYmd)
  const q = new URLSearchParams({ startDate, endDate })
  const url = `${portfolioApiUrl(`/api/market/tiingo/daily/${encodeURIComponent(sym)}`)}?${q}`
  const res = await fetch(url)
  let j: { ok?: boolean; error?: string; prices?: TiingoPriceRow[] }
  try {
    j = (await res.json()) as typeof j
  } catch {
    throw new Error(`Tiingo API: invalid JSON (HTTP ${res.status})`)
  }
  if (!res.ok || !j.ok) {
    throw new Error(j.error ?? `Tiingo API HTTP ${res.status}`)
  }
  if (!Array.isArray(j.prices)) {
    throw new Error('Tiingo API: missing prices array')
  }
  return mapTiingoPricesToDailyOhlcv(j.prices)
}

export async function fetchTiingoEodCloses(
  symbol: string,
  startYmd: string,
  endYmd: string,
): Promise<EodCloseBar[]> {
  const rows = await fetchTiingoDailyOhlcvFromApi(symbol, startYmd, endYmd)
  return rows.map((r) => ({ dateYmd: r.dateYmd, close: r.close }))
}
