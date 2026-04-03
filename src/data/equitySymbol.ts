/** Normalize ticker for URLs and lookups (uppercase A–Z, 0–9, dot, hyphen). */
export function normalizeEquitySymbol(raw: string): string {
  const s = raw.replace(/[^A-Za-z0-9.-]/g, '').toUpperCase()
  return s || 'MSFT'
}
