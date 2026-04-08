/** IBKR / Flex style YYYYMMDD → ISO day string for chart axes. */
export function flexYmdToTimeString(sortKey: string): string {
  const s = sortKey.trim()
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  return s
}

/** Consecutive UTC calendar days as `YYYY-MM-DD` (synthetic series / placeholders). */
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
