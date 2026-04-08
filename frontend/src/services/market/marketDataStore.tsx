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
import type { DailyOhlcvBar } from './dailyBarTypes'
import { fetchTiingoDailyOhlcvFromApi } from './tiingoBffClient'
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

function lastTwoCloses(bars: DailyOhlcvBar[]): { prev: number; last: number } | null {
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
  changePct: number | null
  up: boolean
  intensity: number
  unavailable?: boolean
}

type MarketDataContextValue = {
  indices: IndexStripRow[]
  watchlist: WatchlistRow[]
  heatmap: HeatTile[]
  equitySymbol: string
  setEquitySymbol: (sym: string) => void
  equityDetail: EquityDetailModel
  equityBars: DailyOhlcvBar[]
  equityChartCloses: (range: EquityChartRange) => number[]
  loading: boolean
  error: string | null
  /** Shown when some symbols failed but others succeeded */
  partialWarning: string | null
  lastUpdated: Date | null
  refresh: () => void
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

function buildIndices(series: Record<string, DailyOhlcvBar[]>): IndexStripRow[] {
  return INDEX_STRIP.map((cfg) => {
    const bars = series[cfg.symbol] ?? []
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

function buildWatchlist(series: Record<string, DailyOhlcvBar[]>): WatchlistRow[] {
  return DEFAULT_WATCHLIST.map((cfg) => {
    const bars = series[cfg.sym] ?? []
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

function buildHeatmap(series: Record<string, DailyOhlcvBar[]>): HeatTile[] {
  return SECTOR_ETFS.map(({ sym }) => {
    const bars = series[sym] ?? []
    const t = lastTwoCloses(bars)
    if (!t) {
      return { sym, changePct: null, up: true, intensity: 0, unavailable: true }
    }
    const pct = t.prev !== 0 ? ((t.last - t.prev) / t.prev) * 100 : 0
    const up = pct >= 0
    const intensity = Math.min(1, Math.abs(pct) / HEATMAP_ABS_PCT_FULL_INTENSITY)
    return { sym, changePct: pct, up, intensity, unavailable: false }
  })
}

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [equitySymbol, setEquitySymbolState] = useState(DEFAULT_EQUITY_SYMBOL)
  const [seriesBySymbol, setSeriesBySymbol] = useState<Record<string, DailyOhlcvBar[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const equityKey = useMemo(() => normalizeEquitySymbol(equitySymbol).toUpperCase(), [equitySymbol])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPartialWarning(null)

    const symbols = new Set<string>([
      ...INDEX_STRIP.map((i) => i.symbol),
      ...DEFAULT_WATCHLIST.map((w) => w.sym),
      ...SECTOR_ETFS.map((s) => s.sym),
      equityKey,
    ])

    const today = new Date()
    const d2 = formatYmd(today)
    const shallowD1 = formatYmd(addCalendarDays(today, -140))
    const deepD1 = formatYmd(addCalendarDays(today, -365 * 8))

    const settled = await Promise.allSettled(
      [...symbols].map(async (sym) => {
        const d1 = sym === equityKey ? deepD1 : shallowD1
        const rows = await fetchTiingoDailyOhlcvFromApi(sym, d1, d2)
        return [sym, rows] as const
      }),
    )

    const next: Record<string, DailyOhlcvBar[]> = {}
    let ok = 0
    let failed = 0
    let firstErr: string | null = null
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        const [sym, rows] = r.value
        next[sym] = rows
        if (rows.length >= 2) ok += 1
        else failed += 1
      } else {
        failed += 1
        if (!firstErr) firstErr = r.reason instanceof Error ? r.reason.message : String(r.reason)
      }
    }
    setSeriesBySymbol(next)
    setLastUpdated(new Date())

    if (ok === 0) {
      setError(
        firstErr ??
          'Market data unavailable. Run the portfolio API with TIINGO_API_TOKEN, or check /api/market/tiingo.',
      )
    } else if (failed > 0) {
      setPartialWarning('Some symbols failed to load from Tiingo; rows show — where data is missing.')
    }
    setLoading(false)
  }, [equityKey])

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

  const equityBars = seriesBySymbol[equityKey] ?? []

  const equityUnavailableReason = useMemo(() => {
    if (loading) return null
    if (equityBars.length >= 2) return null
    if (error) return error
    return 'Insufficient Tiingo history for this symbol (or symbol failed to load).'
  }, [loading, error, equityBars.length])

  const value = useMemo((): MarketDataContextValue => {
    const equityDetail = buildEquityDetail(equitySymbol, equityBars, {
      loading,
      reasonUnavailable: equityUnavailableReason,
    })
    return {
      indices: buildIndices(seriesBySymbol),
      watchlist: buildWatchlist(seriesBySymbol),
      heatmap: buildHeatmap(seriesBySymbol),
      equitySymbol,
      setEquitySymbol,
      equityDetail,
      equityBars,
      equityChartCloses: (range: EquityChartRange) => sliceClosesForRange(equityBars, range),
      loading,
      error,
      partialWarning,
      lastUpdated,
      refresh: load,
    }
  }, [
    seriesBySymbol,
    equitySymbol,
    equityBars,
    equityKey,
    setEquitySymbol,
    loading,
    error,
    partialWarning,
    lastUpdated,
    load,
    equityUnavailableReason,
  ])

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(MarketDataContext)
  if (!ctx) throw new Error('useMarketData must be used within MarketDataProvider')
  return ctx
}
