import { generatePath } from 'react-router'
import { normalizeEquitySymbol } from '../data/equitySymbol'
import type { ModuleId } from '../data/modules'
import { DEFAULT_EQUITY_SYMBOL } from '../services/market/marketConfig'

export const PATH = {
  markets: '/',
  equity: '/equity/:symbol',
  portfolio: '/portfolio',
  risk: '/risk',
  budget: '/budget',
  finance: '/finance',
  advisor: '/advisor',
} as const

/** Build `/equity/:symbol` using React Router param rules (encoding handled by generatePath). */
export function equityPath(symbol: string): string {
  return generatePath(PATH.equity, { symbol: normalizeEquitySymbol(symbol) })
}

export function modulePath(id: ModuleId, opts?: { equitySymbol?: string }): string {
  switch (id) {
    case 'markets':
      return PATH.markets
    case 'equity': {
      const sym = opts?.equitySymbol ?? DEFAULT_EQUITY_SYMBOL
      return equityPath(sym)
    }
    case 'portfolio':
      return PATH.portfolio
    case 'risk':
      return PATH.risk
    case 'budget':
      return PATH.budget
    case 'finance':
      return PATH.finance
    case 'advisor':
      return PATH.advisor
  }
}
