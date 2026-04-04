import type { EodCloseBar } from './dailyBarTypes'

export function closestCloseOnOrBefore(series: EodCloseBar[], ymd: string): number | null {
  let best: EodCloseBar | null = null
  for (const b of series) {
    if (b.dateYmd <= ymd) best = b
  }
  return best ? best.close : null
}

export function lastTwoCloses(series: EodCloseBar[]): { prev: number; last: number } | null {
  if (series.length < 2) return null
  const last = series[series.length - 1]!.close
  const prev = series[series.length - 2]!.close
  return { prev, last }
}
