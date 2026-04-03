import { MOCK_EQUITY, type EquityDetailModel } from '../../data/mockEquity'
import { EQUITY_LISTING } from './marketConfig'
import type { StooqOhlcvBar } from './stooqDaily'

export type EquityChartRange = EquityDetailModel['ranges'][number]

function formatVol(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

function ymdToLabel(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) return ymd
  const y = Number(ymd.slice(0, 4))
  const m = Number(ymd.slice(4, 6)) - 1
  const d = Number(ymd.slice(6, 8))
  const dt = new Date(y, m, d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildStats(sym: string, bars: StooqOhlcvBar[]): EquityDetailModel['stats'] {
  if (bars.length < 2) return MOCK_EQUITY.stats
  const last = bars[bars.length - 1]!
  const prev = bars[bars.length - 2]!
  const yearTail = bars.slice(-252)
  const hi52 = Math.max(...yearTail.map((b) => b.high), last.high)
  const lo52 = Math.min(...yearTail.map((b) => b.low), last.low)

  const live = [
    { label: 'PREV CLOSE' as const, value: prev.close.toFixed(2) },
    { label: 'OPEN' as const, value: last.open.toFixed(2) },
    { label: 'DAY RANGE' as const, value: `${last.low.toFixed(2)} – ${last.high.toFixed(2)}` },
    { label: 'VOLUME' as const, value: formatVol(last.volume) },
    { label: '52W RANGE' as const, value: `${lo52.toFixed(2)} – ${hi52.toFixed(2)}` },
  ]

  if (sym === 'MSFT') {
    const mockByLabel = Object.fromEntries(MOCK_EQUITY.stats.map((s) => [s.label, s.value])) as Record<string, string>
    const order = MOCK_EQUITY.stats.map((s) => s.label)
    const merged = order.map((label) => {
      const hit = live.find((x) => x.label === label)
      if (hit) return { label, value: hit.value }
      return { label, value: mockByLabel[label] ?? '—' }
    })
    return merged
  }

  return [
    { label: 'PREV CLOSE', value: prev.close.toFixed(2) },
    { label: 'MKT CAP', value: '—' },
    { label: 'OPEN', value: last.open.toFixed(2) },
    { label: 'P/E (TTM)', value: '—' },
    { label: 'DAY RANGE', value: `${last.low.toFixed(2)} – ${last.high.toFixed(2)}` },
    { label: 'DIV YIELD', value: '—' },
    { label: '52W RANGE', value: `${lo52.toFixed(2)} – ${hi52.toFixed(2)}` },
    { label: 'EPS (TTM)', value: '—' },
    { label: 'VOLUME', value: formatVol(last.volume) },
  ]
}

function buildMovement(bars: StooqOhlcvBar[]): EquityDetailModel['movement'] {
  if (bars.length < 2) return MOCK_EQUITY.movement
  const prev = bars[bars.length - 2]!
  const last = bars[bars.length - 1]!
  const pct = prev.close !== 0 ? ((last.close - prev.close) / prev.close) * 100 : 0
  const t = `${ymdToLabel(last.dateYmd)}, 4:00 PM`
  const line = `$${last.close.toFixed(2)} ${pct >= 0 ? '↗' : '↘'} ${Math.abs(pct).toFixed(2)}% vs prior close`
  return [{ t, line, kind: 'close' as const }]
}

/** Closes for the price chart for the selected range. */
export function sliceClosesForRange(bars: StooqOhlcvBar[], range: EquityChartRange): number[] {
  if (bars.length === 0) return []
  const lastYmd = bars[bars.length - 1]!.dateYmd
  const year = lastYmd.slice(0, 4)

  switch (range) {
    case '1D':
      return bars.slice(-2).map((b) => b.close)
    case '5D':
      return bars.slice(-5).map((b) => b.close)
    case '1M':
      return bars.slice(-22).map((b) => b.close)
    case '6M':
      return bars.slice(-126).map((b) => b.close)
    case '1Y':
      return bars.slice(-252).map((b) => b.close)
    case '5Y':
      return bars.slice(-252 * 5).map((b) => b.close)
    case 'YTD': {
      const ytd = bars.filter((b) => b.dateYmd.startsWith(year)).map((b) => b.close)
      return ytd.length >= 2 ? ytd : bars.slice(-22).map((b) => b.close)
    }
    case 'MAX':
    default:
      return bars.map((b) => b.close)
  }
}

/** Merge Stooq daily series with static copy where the feed has no fundamentals. */
export function buildEquityDetail(symbol: string, bars: StooqOhlcvBar[]): EquityDetailModel {
  const sym = symbol.trim().toUpperCase()
  const listing = EQUITY_LISTING[sym]

  if (bars.length < 2) {
    if (sym === 'MSFT') return { ...MOCK_EQUITY }
    return {
      ...MOCK_EQUITY,
      symbol: sym,
      name: listing?.name ?? sym,
      exchange: listing?.exchange ?? '—',
      country: listing?.country ?? 'US',
      peers: listing?.peers ?? MOCK_EQUITY.peers,
      company: {
        ...MOCK_EQUITY.company,
        description: `${listing?.name ?? sym} — insufficient price history from data source.`,
      },
    }
  }

  const prev = bars[bars.length - 2]!
  const last = bars[bars.length - 1]!
  const change = last.close - prev.close
  const changePct = prev.close !== 0 ? (change / prev.close) * 100 : 0

  const base =
    sym === 'MSFT'
      ? MOCK_EQUITY
      : {
          ...MOCK_EQUITY,
          company: {
            ipo: '—',
            ceo: '—',
            employees: '—',
            sector: '—',
            industry: '—',
            description: `${listing?.name ?? sym} — profile data not wired for this symbol.`,
          },
          analyst: {
            ...MOCK_EQUITY.analyst,
            consensus: 'Hold',
            strongBuy: 2,
            buy: 8,
            hold: 12,
            sell: 3,
            bullishPct: 40,
            neutralPct: 45,
            bearishPct: 15,
            targetLow: last.close * 0.85,
            targetAvg: last.close * 1.05,
            targetHigh: last.close * 1.2,
          },
          narrative: `**${listing?.name ?? sym}** — Daily prices from Stooq; narrative and some fundamentals are placeholders until a fundamentals API is connected.`,
          news: MOCK_EQUITY.news.map((n, i) => ({ ...n, id: `${sym}-${i}` })),
          sourcesCount: 0,
        }

  return {
    ...base,
    symbol: sym,
    name: listing?.name ?? base.name,
    exchange: listing?.exchange ?? base.exchange,
    country: listing?.country ?? base.country,
    peers: listing?.peers ?? base.peers,
    price: last.close,
    change,
    changePct,
    afterHours: {
      price: last.close,
      change: 0,
      changePct: 0,
      time: 'Daily EOD',
    },
    stats: buildStats(sym, bars),
    analyst: { ...base.analyst, current: last.close },
    movement: buildMovement(bars),
  }
}
