/** Daily OHLCV from Stooq (via dev proxy `/stooq-proxy` to avoid CORS). */

function stooqPath(query: string): string {
  const path = `/q/d/l/?${query}`
  return import.meta.env.DEV ? `/stooq-proxy${path}` : `https://stooq.com${path}`
}

export interface StooqBar {
  dateYmd: string
  close: number
}

export interface StooqOhlcvBar {
  dateYmd: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function parseOhlcvCsv(text: string): StooqOhlcvBar[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 1) return []
  if (/no data/i.test(lines[0] ?? '')) return []
  if (lines.length < 2) return []
  const out: StooqOhlcvBar[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',')
    const dateRaw = parts[0]?.trim()
    if (!dateRaw) continue
    const ymd = dateRaw.replace(/-/g, '')
    if (!/^\d{8}$/.test(ymd)) continue
    const open = Number(parts[1]?.trim())
    const high = Number(parts[2]?.trim())
    const low = Number(parts[3]?.trim())
    const closeRaw = parts[4]?.trim() ?? parts[1]?.trim()
    const volRaw = parts[5]?.trim()
    const close = Number(closeRaw)
    if (!Number.isFinite(close)) continue
    const volume = volRaw != null && volRaw !== '' ? Number(volRaw) : 0
    out.push({
      dateYmd: ymd,
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : close,
      low: Number.isFinite(low) ? low : close,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    })
  }
  return out.sort((a, b) => a.dateYmd.localeCompare(b.dateYmd))
}

export async function fetchStooqOhlcv(stooqSymbol: string, d1Ymd: string, d2Ymd: string): Promise<StooqOhlcvBar[]> {
  const qs = new URLSearchParams({ s: stooqSymbol.toLowerCase(), i: 'd', d1: d1Ymd, d2: d2Ymd })
  const url = stooqPath(qs.toString())
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Stooq ${res.status}`)
  return parseOhlcvCsv(await res.text())
}

export async function fetchStooqDaily(symbolUs: string, d1Ymd: string, d2Ymd: string): Promise<StooqBar[]> {
  const rows = await fetchStooqOhlcv(symbolUs, d1Ymd, d2Ymd)
  return rows.map((r) => ({ dateYmd: r.dateYmd, close: r.close }))
}

/** Map equity ticker → Stooq symbol (US). */
export function tickerToStooq(symbol: string): string {
  const s = symbol.trim().toUpperCase()
  return `${s.toLowerCase()}.us`
}

export function closestCloseOnOrBefore(series: StooqBar[], ymd: string): number | null {
  let best: StooqBar | null = null
  for (const b of series) {
    if (b.dateYmd <= ymd) best = b
  }
  return best ? best.close : null
}

export function lastTwoCloses(series: StooqBar[]): { prev: number; last: number } | null {
  if (series.length < 2) return null
  const last = series[series.length - 1]!.close
  const prev = series[series.length - 2]!.close
  return { prev, last }
}
