import type { BusinessDay, Time, UTCTimestamp } from 'lightweight-charts'
import { isBusinessDay } from 'lightweight-charts'

/** IBKR / Flex style YYYYMMDD → Lightweight Charts business day string. */
export function flexYmdToTimeString(sortKey: string): string {
  const s = sortKey.trim()
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  return s
}

/** Stable string key for matching custom tick / crosshair labels. */
export function timeToIsoDay(t: Time): string {
  if (typeof t === 'string') return t
  if (typeof t === 'number') {
    const d = new Date((t as UTCTimestamp) * 1000)
    return d.toISOString().slice(0, 10)
  }
  if (isBusinessDay(t)) {
    const b = t as BusinessDay
    return `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`
  }
  return String(t)
}

/** Consecutive UTC calendar days as `YYYY-MM-DD` (for synthetic / index series). */
export function syntheticBusinessDaySeries(n: number, startUtc = Date.UTC(2024, 0, 1)): string[] {
  const out: string[] = []
  const d = new Date(startUtc)
  for (let i = 0; i < n; i += 1) {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    out.push(`${y}-${m}-${day}`)
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/** Category mini-charts: one bar per day starting at a fixed epoch. */
export function categoryBarTimes(count: number, baseYmd = '2020-01-01'): string[] {
  const [y, m, d0] = baseYmd.split('-').map(Number) as [number, number, number]
  const out: string[] = []
  const d = new Date(Date.UTC(y, m - 1, d0))
  for (let i = 0; i < count; i += 1) {
    const yy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    out.push(`${yy}-${mm}-${dd}`)
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
