/** IB Flex lacks GICS; map tickers to display sectors for portfolio charts. */
export function equitySectorForSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase()
  if (s === 'QQQ') return 'Technology / Growth'
  if (s === 'VOO') return 'US Broad Market'
  if (s === 'UAE') return 'Middle East'
  if (s === 'SPY') return 'US Broad Market'
  return 'Other equity'
}
