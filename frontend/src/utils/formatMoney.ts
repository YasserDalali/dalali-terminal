/** USD amount for tables and tickers (two decimal places). */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
