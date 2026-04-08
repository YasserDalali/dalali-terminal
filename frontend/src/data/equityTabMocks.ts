/** Extended mocks for Equity sub-tabs — replace with API. */

export const FIN_SUBTABS = [
  'Key Stats',
  'Income Statement',
  'Balance Sheet',
  'Cash Flow',
  'Segments & KPIs',
  'Adjusted',
  'Ratios',
] as const

export type FinSubtab = (typeof FIN_SUBTABS)[number]

export type MockEarningsQuarter =
  | { id: string; label: string; future: true; days: number; pct: null }
  | { id: string; label: string; future?: false; pct: number; beat: boolean }

export const MOCK_EARNINGS_QUARTERS: MockEarningsQuarter[] = [
  { id: 'fq4-26', label: 'Q4 FY26', pct: null, future: true, days: 18 },
  { id: 'fq3-26', label: 'Q3 FY26', pct: 4.12, beat: true },
  { id: 'fq2-26', label: 'Q2 FY26', pct: 6.7, beat: true },
  { id: 'fq1-26', label: 'Q1 FY26', pct: 13.15, beat: true },
  { id: 'fq4-25', label: 'Q4 FY25', pct: -1.2, beat: false },
]

export const MOCK_EARNINGS_CALL = {
  title: 'MSFT FY26 Q2 Earnings Call',
  datetime: 'Wed Jan 28, 2026, 11:30 PM GMT+1',
  revenue: { est: '69.2B', actual: '70.0B', beat: '+1.20%', move1d: '+2.1%' },
  eps: { est: '3.12', actual: '3.33', beat: '+6.70%', price: '415.22' },
}

export const MOCK_EARNINGS_HIGHLIGHTS = [
  '**Azure** revenue growth reaccelerated vs prior quarter; management cited AI services attach.',
  '**Copilot** seat expansion in M365 exceeded internal plan; enterprise renewal rates stable.',
  '**Margins** held despite elevated capex; FY26 opex guidance unchanged on constant currency basis.',
  '**Gaming** hardware down YoY; content and services offset part of the decline.',
  '**Capital return**: dividend raised 10%; buyback authorization extended.',
]

export const MOCK_EARNINGS_TRANSCRIPT = [
  { speaker: 'AMY HOOD', text: 'We delivered strong Q2 results with cloud strength across segments...' },
  { speaker: 'SATYA NADELLA', text: 'Customers continue to consolidate on our AI platform. We are seeing inference workloads scale meaningfully quarter over quarter.' },
  { speaker: 'BRETT IVERSON', text: 'Operator, we will now take questions from the sell side.' },
]

export const MOCK_EARNINGS_DOCS = [
  { label: '10-Q · SEC', href: '#' },
  { label: 'Press release', href: '#' },
  { label: 'Earnings slides (PDF)', href: '#' },
]

export const MOCK_HOLDERS_INST = [
  { manager: 'Vanguard Group Inc', shares: '709M', value: '$294B', chg: '+0.8%' },
  { manager: 'BlackRock Inc', shares: '528M', value: '$219B', chg: '+0.2%' },
  { manager: 'State Street Corp', shares: '312M', value: '$129B', chg: '-0.1%' },
  { manager: 'FMR LLC', shares: '298M', value: '$124B', chg: '+1.4%' },
  { manager: 'Geode Capital', shares: '156M', value: '$65B', chg: '0.0%' },
]

export type InsiderTxn = 'Buy' | 'Sell' | 'Gift'

export const MOCK_HOLDERS_INSIDER: {
  name: string
  title: string
  txn: InsiderTxn
  shares: string
  value: string
  date: string
}[] = [
  { name: 'Satya Nadella', title: 'CEO', txn: 'Sell', shares: '78K', value: '$32.1M', date: '2025-11-14' },
  { name: 'Amy Hood', title: 'EVP CFO', txn: 'Sell', shares: '45K', value: '$18.6M', date: '2025-11-14' },
  { name: 'Brad Smith', title: 'Vice Chair', txn: 'Gift', shares: '12K', value: '—', date: '2025-09-02' },
]

export const MOCK_HOLDERS_POL = [
  { name: 'J. Smith', party: 'D' as const, chamber: 'House', txn: 'Buy', amount: '$15K–$50K', disclosed: '2025-12-01' },
  { name: 'M. Lee', party: 'R' as const, chamber: 'Senate', txn: 'Sell', amount: '$1K–$15K', disclosed: '2025-11-20' },
]

export type MockHistRow =
  | { kind: 'week'; week: string }
  | { kind: 'day'; date: string; o: string; h: string; l: string; c: string; vol: string }

export const MOCK_HISTORICAL: MockHistRow[] = [
  { kind: 'week', week: 'Week of Mar 24, 2026' },
  { kind: 'day', date: '2026-03-28', o: '413.20', h: '417.10', l: '411.02', c: '415.22', vol: '18.4M' },
  { kind: 'day', date: '2026-03-27', o: '410.50', h: '414.88', l: '409.10', c: '412.38', vol: '16.2M' },
  { kind: 'day', date: '2026-03-26', o: '408.00', h: '411.40', l: '406.55', c: '410.12', vol: '15.1M' },
  { kind: 'week', week: 'Week of Mar 17, 2026' },
  { kind: 'day', date: '2026-03-21', o: '405.10', h: '409.20', l: '403.00', c: '407.88', vol: '19.0M' },
  { kind: 'day', date: '2026-03-20', o: '402.40', h: '406.00', l: '401.20', c: '404.55', vol: '17.5M' },
]

export const MOCK_ANALYST_RATINGS = [
  { firm: 'Goldman Sachs', analyst: 'K. Hall', rating: 'Buy', target: '$550', targetPrev: '$520', upside: '+32.5%', date: '2026-03-01' },
  { firm: 'Morgan Stanley', analyst: 'K. Weiss', rating: 'Overperform', target: '$540', targetPrev: '$540', upside: '+30.1%', date: '2026-02-18' },
  { firm: 'JPMorgan', analyst: 'M. Jackson', rating: 'Overweight', target: '$535', targetPrev: '$500', upside: '+28.9%', date: '2026-02-05' },
  { firm: 'UBS', analyst: 'T. Garrity', rating: 'Buy', target: '$525', targetPrev: '$510', upside: '+26.4%', date: '2026-01-22' },
  { firm: 'Wells Fargo', analyst: 'A. Lim', rating: 'Hold', target: '$430', targetPrev: '$430', upside: '+3.6%', date: '2025-12-10' },
]

export const MOCK_ANALYSIS_SYNTHESIS =
  '**90.9%** of covering analysts rate MSFT **Buy** or **Overweight**. Consensus **median price target** is **$520**, implying **~25% upside** from last close. Revisions skew positive post-AI capex framework; key debate is **cloud growth durability** vs. **multiple compression** in megacap software.'

export const MOCK_RESEARCH_REPORTS = [
  { title: 'Cloud & AI: margin path through FY27', author: 'Morningstar', date: '2026-03-12' },
  { title: 'Enterprise seat growth vs. Copilot ARPU', author: 'MS Research', date: '2026-03-02' },
]

export type RelationType =
  | 'partnership'
  | 'subsidiary'
  | 'competitor'
  | 'customer'
  | 'investor'
  | 'ma'

export const RELATION_FILTERS: { id: RelationType | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'partnership', label: 'PARTNERSHIPS' },
  { id: 'subsidiary', label: 'SUBSIDIARIES' },
  { id: 'investor', label: 'INVESTORS' },
  { id: 'competitor', label: 'COMPETITORS' },
  { id: 'customer', label: 'CUSTOMERS' },
  { id: 'ma', label: 'M&A' },
]

export const MOCK_RELATION_NODES: {
  id: string
  label: string
  ticker?: string
  type: RelationType
  angle: number
  dist: number
  deal?: string
  status: 'Active' | 'Pending' | 'Expired'
}[] = [
  { id: 'openai', label: 'OpenAI', type: 'partnership', angle: -40, dist: 1, deal: '2023 strategic, multi-B', status: 'Active' },
  { id: 'nvda', label: 'NVIDIA', ticker: 'NVDA', type: 'partnership', angle: 20, dist: 0.95, deal: 'AI infra supply', status: 'Active' },
  { id: 'goog', label: 'Alphabet', ticker: 'GOOGL', type: 'competitor', angle: 160, dist: 1, deal: 'Cloud + productivity', status: 'Active' },
  { id: 'amzn', label: 'Amazon', ticker: 'AMZN', type: 'competitor', angle: 200, dist: 0.9, deal: 'AWS vs Azure', status: 'Active' },
  { id: 'linkedin', label: 'LinkedIn', type: 'subsidiary', angle: -120, dist: 0.75, deal: 'Acquired 2016', status: 'Active' },
  { id: 'activision', label: 'Activision', type: 'subsidiary', angle: -90, dist: 0.7, deal: 'Closed 2023', status: 'Active' },
  { id: 'meta', label: 'Meta', ticker: 'META', type: 'competitor', angle: 120, dist: 1, deal: 'Ads + metaverse overlap', status: 'Active' },
]
