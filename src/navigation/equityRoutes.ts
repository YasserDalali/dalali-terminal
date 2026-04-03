import { normalizeEquitySymbol } from '../data/mockEquity'

export function equityHref(symbol: string): string {
  return `/equity/${encodeURIComponent(normalizeEquitySymbol(symbol))}`
}
