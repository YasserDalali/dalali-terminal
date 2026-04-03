export type ModuleId =
  | 'markets'
  | 'equity'
  | 'portfolio'
  | 'risk'
  | 'budget'
  | 'finance'
  | 'advisor'

export interface NavModule {
  id: ModuleId
  label: string
  short: string
  color: string
  tabKey: string
}

export const NAV_MODULES: NavModule[] = [
  { id: 'markets', label: 'Markets', short: 'MKT', color: '#1D9E75', tabKey: 'markets' },
  { id: 'equity', label: 'Equity', short: 'EQ', color: '#D85A30', tabKey: 'equity' },
  { id: 'portfolio', label: 'Portfolio', short: 'PF', color: '#378ADD', tabKey: 'portfolio' },
  { id: 'risk', label: 'Risk', short: 'RSK', color: '#E24B4A', tabKey: 'risk' },
  { id: 'budget', label: 'Budget', short: 'BDG', color: '#BA7517', tabKey: 'budget' },
  { id: 'finance', label: 'Finance', short: 'FIN', color: '#7F77DD', tabKey: 'finance' },
  { id: 'advisor', label: 'Advisor', short: 'AI', color: '#639922', tabKey: 'advisor' },
]
