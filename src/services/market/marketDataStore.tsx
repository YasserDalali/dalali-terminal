import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { normalizeEquitySymbol } from '../../data/equitySymbol'
import type { EquityDetailModel } from '../../data/mockEquity'
import {
  DEFAULT_EQUITY_SYMBOL,
  DEFAULT_WATCHLIST,
  HEATMAP_ABS_PCT_FULL_INTENSITY,
  INDEX_STRIP,
  SECTOR_ETFS,
} from './marketConfig'
import { buildEquityDetail, sliceClosesForRange, type EquityChartRange } from './marketEquityModel'
import { fetchStooqOhlcv, type StooqOhlcvBar } from './stooqDaily'
import { tickerToStooq } from './stooqDaily'
import { formatUsd } from '../../utils/formatMoney'

/** Auto-refresh interval for market series (must match countdown in status bar). */
export const MARKET_DATA_REFRESH_INTERVAL_MS = 120_000

function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function addCalendarDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function lastTwoCloses(bars: StooqOhlcvBar[]): { prev: number; last: number } | null {
  if (bars.length < 2) return null
  return {
    prev: bars[bars.length - 2]!.close,
    last: bars[bars.length - 1]!.close,
  }
}

export type IndexStripRow = {
  id: string
  label: string
  price: string
  delta: string
  pct: string
  up: boolean
  inverse?: boolean
  sparkCloses: number[]
}

export type WatchlistRow = {
  sym: string
  name: string
  price: string
  d1: string
  m1: string
  cap: string
}

export type HeatTile = {
  sym: string
  changePct: number
  up: boolean
  intensity: number
}

type MarketDataContextValue = {
  indices: IndexStripRow[]
  watchlist: WatchlistRow[]
  heatmap: HeatTile[]
  equitySymbol: string
  setEquitySymbol: (sym: string) => void
  equityDetail: EquityDetailModel
  equityBars: StooqOhlcvBar[]
  equityChartCloses: (range: EquityChartRange) => number[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

function buildIndices(series: Record<string, StooqOhlcvBar[]>): IndexStripRow[] {
  return INDEX_STRIP.map((cfg) => {
    const bars = series[cfg.stooq] ?? []
    const t = lastTwoCloses(bars)
    if (!t) {
      return {
        id: cfg.id,
        label: cfg.label,
        price: '—',
        delta: '—',
        pct: '—',
        up: true,
        inverse: cfg.inverse,
        sparkCloses: [],
      }
    }
    const change = t.last - t.prev
    const pct = t.prev !== 0 ? (change / t.prev) * 100 : 0
    return {
      id: cfg.id,
      label: cfg.label,
      price: formatUsd(t.last),
      delta: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
      pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      up: change >= 0,
      inverse: cfg.inverse,
      sparkCloses: bars.slice(-24).map((b) => b.close),
    }
  })
}

function buildWatchlist(series: Record<string, StooqOhlcvBar[]>): WatchlistRow[] {
  return DEFAULT_WATCHLIST.map((cfg) => {
    const bars = series[cfg.stooq] ?? []
    const t = lastTwoCloses(bars)
    if (!t) {
      return {
        sym: cfg.sym,
        name: cfg.name,
        price: '—',
        d1: '—',
        m1: '—',
        cap: cfg.capHint ?? '—',
      }
    }
    const d1pct = t.prev !== 0 ? ((t.last - t.prev) / t.prev) * 100 : 0
    const i1m = Math.max(0, bars.length - 22)
    const c1m = bars[i1m]?.close ?? t.prev
    const m1pct = c1m !== 0 ? ((t.last - c1m) / c1m) * 100 : 0
    return {
      sym: cfg.sym,
      name: cfg.name,
      price: formatUsd(t.last),
      d1: `${d1pct >= 0 ? '+' : ''}${d1pct.toFixed(2)}%`,
      m1: `${m1pct >= 0 ? '+' : ''}${m1pct.toFixed(1)}%`,
      cap: cfg.capHint ?? '—',
    }
  })
}

function buildHeatmap(series: Record<string, StooqOhlcvBar[]>): HeatTile[] {
  return SECTOR_ETFS.map(({ sym, stooq }) => {
    const bars = series[stooq] ?? []
    const t = lastTwoCloses(bars)
    const pct = t && t.prev !== 0 ? ((t.last - t.prev) / t.prev) * 100 : 0
    const up = pct >= 0
    const intensity = Math.min(1, Math.abs(pct) / HEATMAP_ABS_PCT_FULL_INTENSITY)
    return { sym, changePct: pct, up, intensity }
  })
}

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [equitySymbol, setEquitySymbolState] = useState(DEFAULT_EQUITY_SYMBOL)
  const [seriesByStooq, setSeriesByStooq] = useState<Record<string, StooqOhlcvBar[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const equityStooq = useMemo(() => tickerToStooq(equitySymbol), [equitySymbol])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const symbols = new Set<string>([
      ...INDEX_STRIP.map((i) => i.stooq),
      ...DEFAULT_WATCHLIST.map((w) => w.stooq),
      ...SECTOR_ETFS.map((s) => s.stooq),
      equityStooq,
    ])

    const today = new Date()
    const d2 = formatYmd(today)
    const shallowD1 = formatYmd(addCalendarDays(today, -140))
    const deepD1 = formatYmd(addCalendarDays(today, -365 * 8))

    const settled = await Promise.allSettled(
      [...symbols].map(async (sq) => {
        const d1 = sq === equityStooq ? deepD1 : shallowD1
        const rows = await fetchStooqOhlcv(sq, d1, d2)
        return [sq, rows] as const
      }),
    )

    const next: Record<string, StooqOhlcvBar[]> = {}
    let ok = 0
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        const [sq, rows] = r.value
        next[sq] = rows
        if (rows.length >= 2) ok += 1
      }
    }
    setSeriesByStooq(next)
    setLastUpdated(new Date())
    if (ok === 0) setError('Could not load market data (check network or Stooq).')
    setLoading(false)
  }, [equityStooq])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const t = window.setInterval(() => void load(), MARKET_DATA_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [load])

  const setEquitySymbol = useCallback((sym: string) => {
    setEquitySymbolState(normalizeEquitySymbol(sym))
  }, [])

  const equityBars = seriesByStooq[equityStooq] ?? []

  const value = useMemo((): MarketDataContextValue => {
    const equityDetail = buildEquityDetail(equitySymbol, equityBars)
    return {
      indices: buildIndices(seriesByStooq),
      watchlist: buildWatchlist(seriesByStooq),
      heatmap: buildHeatmap(seriesByStooq),
      equitySymbol,
      setEquitySymbol,
      equityDetail,
      equityBars,
      equityChartCloses: (range: EquityChartRange) => sliceClosesForRange(equityBars, range),
      loading,
      error,
      lastUpdated,
      refresh: load,
    }
  }, [
    seriesByStooq,
    equitySymbol,
    equityBars,
    equityStooq,
    setEquitySymbol,
    loading,
    error,
    lastUpdated,
    load,
  ])

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(MarketDataContext)
  if (!ctx) throw new Error('useMarketData must be used within MarketDataProvider')
  return ctx
}
