import { EQUITY_CHART_RANGES } from './equityChartRanges'
import { EQUITY_PREV_CLOSE_LABEL } from './equityStatLabels'

/** Mock security — replace with API (e.g. FMP / Yahoo). */
export const MOCK_EQUITY = {
  symbol: 'MSFT',
  exchange: 'NASDAQ',
  name: 'Microsoft Corporation',
  country: 'US',
  price: 415.22,
  change: 2.84,
  changePct: 0.69,
  afterHours: { price: 414.1, change: -1.12, changePct: -0.27, time: '19:59 ET' },
  currency: 'USD',
  ranges: EQUITY_CHART_RANGES,
  stats: [
    { label: EQUITY_PREV_CLOSE_LABEL, value: '412.38' },
    { label: 'MKT CAP', value: '3.09T' },
    { label: 'OPEN', value: '413.50' },
    { label: 'P/E (TTM)', value: '36.2' },
    { label: 'DAY RANGE', value: '411.02 – 416.88' },
    { label: 'DIV YIELD', value: '0.72%' },
    { label: '52W RANGE', value: '344.79 – 468.35' },
    { label: 'EPS (TTM)', value: '11.48' },
    { label: 'VOLUME', value: '18.4M' },
  ],
  company: {
    ipo: '1986-03-13',
    ceo: 'Satya Nadella',
    employees: '228000',
    sector: 'Technology',
    industry: 'Software — Infrastructure',
    description:
      'Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide. Its segments include Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.',
  },
  analyst: {
    consensus: 'Buy',
    strongBuy: 12,
    buy: 28,
    hold: 5,
    sell: 1,
    bullishPct: 87,
    neutralPct: 11,
    bearishPct: 2,
    targetLow: 380,
    targetAvg: 520,
    targetHigh: 600,
    current: 415.22,
  },
  movement: [
    { t: 'Mar 28, 4:00 PM', line: '$412.38 ↘ 0.41% at Close', kind: 'close' as const },
    { t: 'Mar 28, 7:59 PM', line: '$414.10 ↘ 0.27% After Hours', kind: 'ah' as const },
  ],
  narrative: `Shares traded in a tight range ahead of quarter-end **rebalancing** and **options expiry**. Institutional flow remained **net positive** on large-cap software; watch **Fed speakers** and **rates** at the long end for beta to megacap tech.`,
  news: [
    { id: '1', title: 'Azure growth reaccelerates; margins in focus', source: 'Reuters', time: '2h ago' },
    { id: '2', title: 'Copilot attach rates climb across enterprise seats', source: 'Bloomberg', time: '5h ago' },
    { id: '3', title: 'EU cloud commitments: what changed for hyperscalers', source: 'FT', time: '1d ago' },
  ],
  sourcesCount: 74,
  peers: ['AAPL', 'GOOGL', 'META', 'AMZN', 'ORCL'],
}

export type EquityDetailModel = typeof MOCK_EQUITY
