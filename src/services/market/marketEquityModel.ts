import type { EquityChartRange } from '../../data/equityChartRanges'
import { MOCK_EQUITY, type EquityDetailModel } from '../../data/mockEquity'
import { EQUITY_PREV_CLOSE_LABEL } from '../../data/equityStatLabels'
import { EQUITY_LISTING } from './marketConfig'
import type { DailyOhlcvBar } from './dailyBarTypes'

export type { EquityChartRange }

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

function buildStats(_sym: string, bars: DailyOhlcvBar[]): EquityDetailModel['stats'] {
  const last = bars[bars.length - 1]!
  const prev = bars[bars.length - 2]!
  const yearTail = bars.slice(-252)
  const hi52 = Math.max(...yearTail.map((b) => b.high), last.high)
  const lo52 = Math.min(...yearTail.map((b) => b.low), last.low)

  return [
    { label: EQUITY_PREV_CLOSE_LABEL, value: prev.close.toFixed(2) },
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

function buildMovement(bars: DailyOhlcvBar[]): EquityDetailModel['movement'] {
  const prev = bars[bars.length - 2]!
  const last = bars[bars.length - 1]!
  const pct = prev.close !== 0 ? ((last.close - prev.close) / prev.close) * 100 : 0
  const t = `${ymdToLabel(last.dateYmd)}, EOD (adj.)`
  const line = `$${last.close.toFixed(2)} ${pct >= 0 ? '↗' : '↘'} ${Math.abs(pct).toFixed(2)}% vs prior close`
  return [{ t, line, kind: 'close' as const }]
}

function emptyLikeListing(sym: string, reason: string): EquityDetailModel {
  const listing = EQUITY_LISTING[sym]
  const dashStats: EquityDetailModel['stats'] = MOCK_EQUITY.stats.map((s) => ({ ...s, value: '—' }))
  return {
    ...MOCK_EQUITY,
    symbol: sym,
    name: listing?.name ?? sym,
    exchange: listing?.exchange ?? '—',
    country: listing?.country ?? 'US',
    price: Number.NaN,
    change: Number.NaN,
    changePct: Number.NaN,
    afterHours: { price: Number.NaN, change: Number.NaN, changePct: Number.NaN, time: '—' },
    stats: dashStats,
    company: {
      ipo: '—',
      ceo: '—',
      employees: '—',
      sector: '—',
      industry: '—',
      description: reason,
    },
    analyst: {
      ...MOCK_EQUITY.analyst,
      current: Number.NaN,
      targetLow: Number.NaN,
      targetAvg: Number.NaN,
      targetHigh: Number.NaN,
    },
    movement: [],
    narrative: reason,
    news: [],
    sourcesCount: 0,
    peers: listing?.peers ?? [],
  }
}

/** Closes for the price chart for the selected range (adj. close). */
export function sliceClosesForRange(bars: DailyOhlcvBar[], range: EquityChartRange): number[] {
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

/** Full OHLCV rows for the selected range (for historical price table). */
export function sliceOhlcvForRange(bars: DailyOhlcvBar[], range: EquityChartRange): DailyOhlcvBar[] {
  if (bars.length === 0) return []
  const lastYmd = bars[bars.length - 1]!.dateYmd
  const year = lastYmd.slice(0, 4)
  switch (range) {
    case '1D':
      return bars.slice(-2)
    case '5D':
      return bars.slice(-5)
    case '1M':
      return bars.slice(-22)
    case '6M':
      return bars.slice(-126)
    case '1Y':
      return bars.slice(-252)
    case '5Y':
      return bars.slice(-252 * 5)
    case 'YTD': {
      const ytd = bars.filter((b) => b.dateYmd.startsWith(year))
      return ytd.length >= 2 ? ytd : bars.slice(-22)
    }
    case 'MAX':
    default:
      return bars
  }
}

type EquityDetailOpts = {
  loading: boolean
  /** Set when `loading` is false and the feed failed or history is too short. */
  reasonUnavailable: string | null
}

/** Live Tiingo EOD (adj.) + static listing; no mock prices. */
export function buildEquityDetail(
  symbol: string,
  bars: DailyOhlcvBar[],
  opts: EquityDetailOpts,
): EquityDetailModel {
  const sym = symbol.trim().toUpperCase()

  if (opts.loading && bars.length < 2) {
    return emptyLikeListing(sym, 'Loading Tiingo prices (via portfolio API)…')
  }

  if (opts.reasonUnavailable || bars.length < 2) {
    return emptyLikeListing(
      sym,
      opts.reasonUnavailable ??
        'Not enough price history from Tiingo. Check portfolio API, TIINGO_API_TOKEN, and symbol.',
    )
  }

  const listing = EQUITY_LISTING[sym]
  const prev = bars[bars.length - 2]!
  const last = bars[bars.length - 1]!
  const change = last.close - prev.close
  const changePct = prev.close !== 0 ? (change / prev.close) * 100 : 0

  const base = {
    ...MOCK_EQUITY,
    company: {
      ipo: '—',
      ceo: '—',
      employees: '—',
      sector: '—',
      industry: '—',
      description: `${listing?.name ?? sym} — company profile not wired; prices are adj. EOD from Tiingo (via API).`,
    },
    analyst: {
      ...MOCK_EQUITY.analyst,
      consensus: 'Hold',
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      bullishPct: 0,
      neutralPct: 0,
      bearishPct: 0,
      targetLow: last.close * 0.9,
      targetAvg: last.close,
      targetHigh: last.close * 1.1,
    },
    narrative: `**${listing?.name ?? sym}** — Adj. daily prices from Tiingo. Fundamentals and analyst blocks are placeholders until wired to a fundamentals provider.`,
    news: [],
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
      time: 'Daily EOD (adj.)',
    },
    stats: buildStats(sym, bars),
    analyst: { ...base.analyst, current: last.close },
    movement: buildMovement(bars),
  }
}
