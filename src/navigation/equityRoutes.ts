import { normalizeEquitySymbol } from '../data/equitySymbol'

export function equityHref(symbol: string): string {
  return `/equity/${encodeURIComponent(normalizeEquitySymbol(symbol))}`
}
