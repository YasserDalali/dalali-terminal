export type NavSeriesVisibility = { total: boolean; cash: boolean; stock: boolean }

/** Y-axis domain from NAV line data — optional 5–95% truncation to hide spikes. */
export function navSeriesMinMax(
  rows: { total: number; cash: number; stock: number }[],
  truncated: boolean,
  vis: NavSeriesVisibility = { total: true, cash: true, stock: true },
): [number, number] | undefined {
  const vals: number[] = []
  for (const r of rows) {
    if (vis.total) vals.push(r.total)
    if (vis.cash) vals.push(r.cash)
    if (vis.stock) vals.push(r.stock)
  }
  const finite = vals.filter((v) => Number.isFinite(v))
  if (finite.length === 0) return undefined
  if (!truncated) {
    const lo = Math.min(...finite)
    const hi = Math.max(...finite)
    const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.02 || 1
    return [lo - pad, hi + pad]
  }
  const sorted = [...finite].sort((a, b) => a - b)
  const n = sorted.length
  const i0 = Math.max(0, Math.floor(n * 0.05))
  const i1 = Math.min(n - 1, Math.ceil(n * 0.95) - 1)
  let lo = sorted[i0]!
  let hi = sorted[i1]!
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const pad = (hi - lo) * 0.08
  return [Math.max(0, lo - pad), hi + pad]
}

/**
 * Performance % chart Y domain. Pass `keys` for visible series only so hidden benchmarks
 * do not stretch the axis.
 */
export function perfSeriesMinMax(
  rows: Record<string, unknown>[],
  truncated: boolean,
  keys: string[],
): [number, number] | undefined {
  const vals: number[] = []
  for (const r of rows) {
    for (const k of keys) {
      const v = r[k]
      if (typeof v === 'number' && Number.isFinite(v)) vals.push(v)
    }
  }
  const finite = vals.filter((v) => Number.isFinite(v))
  if (finite.length === 0) return undefined
  if (!truncated) {
    const lo = Math.min(...finite)
    const hi = Math.max(...finite)
    const pad = (hi - lo) * 0.08 || 2
    return [lo - pad, hi + pad]
  }
  const sorted = [...finite].sort((a, b) => a - b)
  const n = sorted.length
  const i0 = Math.max(0, Math.floor(n * 0.05))
  const i1 = Math.min(n - 1, Math.ceil(n * 0.95) - 1)
  let lo = sorted[i0]!
  let hi = sorted[i1]!
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const pad = (hi - lo) * 0.1
  return [lo - pad, hi + pad]
}

export function positiveScalarDomain(values: number[], truncated: boolean): [number, number] | undefined {
  const finite = values.filter((v) => Number.isFinite(v) && v > 0)
  if (finite.length === 0) return undefined
  if (!truncated) {
    const lo = Math.min(...finite)
    const hi = Math.max(...finite)
    return [lo * 0.95, hi * 1.05]
  }
  const sorted = [...finite].sort((a, b) => a - b)
  const n = sorted.length
  const i0 = Math.max(0, Math.floor(n * 0.05))
  const i1 = Math.min(n - 1, Math.ceil(n * 0.95) - 1)
  let lo = sorted[i0]!
  let hi = sorted[i1]!
  if (lo === hi) {
    lo *= 0.9
    hi *= 1.1
  }
  return [lo, hi]
}

export function navRowsForLogScale(
  rows: { dateLabel: string; sortKey: string; total: number; cash: number; stock: number }[],
): { dateLabel: string; sortKey: string; total: number; cash: number; stock: number }[] {
  const floor = (v: number) => (v > 0 ? v : 0.01)
  return rows.map((r) => ({
    ...r,
    total: floor(r.total),
    cash: floor(r.cash),
    stock: floor(r.stock),
  }))
}
