import { matchPath } from 'react-router-dom'
import type { ModuleId } from '../data/modules'
import { PATH } from './modulePaths'

const ORDER: { pattern: string; id: ModuleId }[] = [
  { pattern: PATH.equity, id: 'equity' },
  { pattern: PATH.portfolio, id: 'portfolio' },
  { pattern: PATH.risk, id: 'risk' },
  { pattern: PATH.budget, id: 'budget' },
  { pattern: PATH.finance, id: 'finance' },
  { pattern: PATH.advisor, id: 'advisor' },
]

/** Derive sidebar / tab active module from the current location. */
export function moduleIdFromPathname(pathname: string): ModuleId {
  for (const { pattern, id } of ORDER) {
    if (matchPath({ path: pattern, end: true }, pathname)) return id
  }
  return 'markets'
}
