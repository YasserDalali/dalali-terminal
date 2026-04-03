export const EQUITY_TABS = [
  'Overview',
  'Financials',
  'Earnings',
  'Holders',
  'Historical',
  'Analysis',
  'Relations',
] as const

export type EquityTab = (typeof EQUITY_TABS)[number]
