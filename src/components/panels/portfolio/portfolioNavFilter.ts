import type { IbkrNavHistoryPoint } from '../../../services/finance/ibkrFlexTypes'

/** Default chart start if `dateFunded` missing or earlier than this floor (user: first funding 2026-03-04). */
export const DEFAULT_FUNDING_FLOOR_YMD = '20260304'

export type PortfolioTimeSpan = '7D' | '1M' | '3M' | '6M' | 'YTD' | '1Y'

export function resolveFundingStartYmd(dateFunded: string): string {
  if (!/^\d{8}$/.test(dateFunded)) return DEFAULT_FUNDING_FLOOR_YMD
  return dateFunded >= DEFAULT_FUNDING_FLOOR_YMD ? dateFunded : DEFAULT_FUNDING_FLOOR_YMD
}

function ymdToUtcDate(ymd: string): Date {
  const y = Number(ymd.slice(0, 4))
  const m = Number(ymd.slice(4, 6)) - 1
  const d = Number(ymd.slice(6, 8))
  return new Date(Date.UTC(y, m, d))
}

function dateToYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function addDaysYmd(ymd: string, days: number): string {
  const t = ymdToUtcDate(ymd).getTime() + days * 86400000
  return dateToYmd(new Date(t))
}

export function pointsSinceFunding(history: IbkrNavHistoryPoint[], fundingYmd: string): IbkrNavHistoryPoint[] {
  return [...history]
    .filter((p) => p.reportDate >= fundingYmd)
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
}

/**
 * Last report date in history (YYYYMMDD), or null.
 */
export function lastReportYmd(history: IbkrNavHistoryPoint[]): string | null {
  if (!history.length) return null
  return [...history].sort((a, b) => a.reportDate.localeCompare(b.reportDate)).at(-1)?.reportDate ?? null
}

function spanStartYmd(anchorYmd: string, span: PortfolioTimeSpan): string {
  const a = ymdToUtcDate(anchorYmd)
  if (span === '7D') return addDaysYmd(anchorYmd, -7)
  if (span === '1M') return addDaysYmd(anchorYmd, -31)
  if (span === '3M') return addDaysYmd(anchorYmd, -92)
  if (span === '6M') return addDaysYmd(anchorYmd, -184)
  if (span === '1Y') return addDaysYmd(anchorYmd, -365)
  if (span === 'YTD') {
    const y = a.getUTCFullYear()
    return `${y}0101`
  }
  return addDaysYmd(anchorYmd, -31)
}

export function filterNavBySpan(
  history: IbkrNavHistoryPoint[],
  span: PortfolioTimeSpan,
  fundingYmd: string,
): IbkrNavHistoryPoint[] {
  if (!history.length) return []
  const sorted = [...history].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const anchor = sorted[sorted.length - 1]!.reportDate
  const start = spanStartYmd(anchor, span)
  const from = start > fundingYmd ? start : fundingYmd
  return sorted.filter((p) => p.reportDate >= from)
}

export function oneDayNavMove(history: IbkrNavHistoryPoint[], fundingYmd: string): { usd: number; pct: number } | null {
  const pts = pointsSinceFunding(history, fundingYmd)
  if (pts.length < 2) return null
  const a = pts[pts.length - 2]!
  const b = pts[pts.length - 1]!
  const prev = a.total
  const last = b.total
  if (!Number.isFinite(prev) || prev === 0) return null
  return { usd: last - prev, pct: ((last - prev) / prev) * 100 }
}
