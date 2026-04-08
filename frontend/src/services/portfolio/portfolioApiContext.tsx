import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { IbkrFlexPortfolio } from '../finance/ibkrFlexTypes'
import {
  fetchPortfolioFromApi,
  getIbkrFlexEnv,
  type PortfolioApiEnvelope,
  requestPortfolioSync,
} from '../finance/ibkrFlexService'

const STORAGE_KEY = 'dalali:portfolio:api-envelope'

export type PortfolioLiftedStatus = 'idle' | 'loading' | 'ok' | 'err'

export type PortfolioLiftedState = {
  data: IbkrFlexPortfolio | null
  status: PortfolioLiftedStatus
  error: string | null
  /** ISO timestamp from Redis/API — last successful IBKR→Redis write */
  cachedAt: string | null
  busy: boolean
  refresh: () => Promise<void>
}

const PortfolioLiftedContext = createContext<PortfolioLiftedState | null>(null)

function readStoredEnvelope(): PortfolioApiEnvelope | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PortfolioApiEnvelope
  } catch {
    return null
  }
}

function persistEnvelope(env: PortfolioApiEnvelope): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(env))
  } catch {
    /* quota */
  }
}

/**
 * When `VITE_USE_PORTFOLIO_API` is set, keeps portfolio polling + cache alive while navigating
 * away from the Portfolio page. Also mirrors the last envelope to sessionStorage for instant paint.
 */
export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  const { usePortfolioApi: canApi, portfolioApiBase, portfolioPollMs } = getIbkrFlexEnv()

  const storedInit = canApi ? readStoredEnvelope() : null

  const [data, setData] = useState<IbkrFlexPortfolio | null>(() => storedInit?.data ?? null)
  const [status, setStatus] = useState<PortfolioLiftedStatus>(() =>
    canApi ? (storedInit?.data ? 'ok' : 'loading') : 'idle',
  )
  const [error, setError] = useState<string | null>(() =>
    canApi && storedInit?.data && !storedInit.ok ? (storedInit.error ?? null) : null,
  )
  const [cachedAt, setCachedAt] = useState<string | null>(() => storedInit?.cachedAt ?? null)
  const [busy, setBusy] = useState(false)

  const dataRef = useRef<IbkrFlexPortfolio | null>(null)
  dataRef.current = data

  const applyEnvelope = useCallback(
    (env: PortfolioApiEnvelope) => {
      if (env.data != null) {
        setData(env.data)
        setStatus('ok')
        setError(env.ok ? null : (env.error ?? null))
        setCachedAt(env.cachedAt ?? null)
        persistEnvelope(env)
        return
      }
      setStatus((prev) => (prev === 'loading' && !dataRef.current ? 'err' : prev))
      if (env.error) setError(env.error)
      if (env.cachedAt != null) setCachedAt(env.cachedAt)
    },
    [],
  )

  useEffect(() => {
    if (!canApi) return
    let cancel = false
    const poll = async () => {
      const env = await fetchPortfolioFromApi(portfolioApiBase)
      if (cancel) return
      applyEnvelope(env)
    }
    void poll()
    const id = window.setInterval(poll, portfolioPollMs)
    return () => {
      cancel = true
      window.clearInterval(id)
    }
  }, [canApi, portfolioApiBase, portfolioPollMs, applyEnvelope])

  const refresh = useCallback(async () => {
    if (!canApi) return
    setBusy(true)
    setError(null)
    try {
      const env = await requestPortfolioSync(portfolioApiBase)
      applyEnvelope(env)
      if (env.data == null) {
        setError(env.error ?? 'Sync failed')
        setStatus(dataRef.current != null ? 'ok' : 'err')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus(dataRef.current != null ? 'ok' : 'err')
    } finally {
      setBusy(false)
    }
  }, [canApi, portfolioApiBase, applyEnvelope])

  const value = useMemo((): PortfolioLiftedState | null => {
    if (!canApi) return null
    return {
      data,
      status,
      error,
      cachedAt,
      busy,
      refresh,
    }
  }, [canApi, data, status, error, cachedAt, busy, refresh])

  return <PortfolioLiftedContext.Provider value={value}>{children}</PortfolioLiftedContext.Provider>
}

/** Non-null only when `VITE_USE_PORTFOLIO_API` is enabled (lifted cache + polling). */
export function usePortfolioLifted(): PortfolioLiftedState | null {
  return useContext(PortfolioLiftedContext)
}

export function formatPortfolioCachedAt(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  } catch {
    return iso
  }
}
