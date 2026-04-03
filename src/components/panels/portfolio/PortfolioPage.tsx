import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IbkrFlexPortfolio, IbkrNavHistoryPoint, IbkrTradeRow } from '../../../services/finance/ibkrFlexTypes'
import {
  getIbkrFlexEnv,
  loadIbkrFlexPortfolio,
  loadIbkrFlexPortfolioFromFixture,
} from '../../../services/finance/ibkrFlexService'
import {
  formatPortfolioCachedAt,
  usePortfolioLifted,
} from '../../../services/portfolio/portfolioApiContext'
import {
  closestCloseOnOrBefore,
  fetchStooqDaily,
  lastTwoCloses,
  tickerToStooq,
  type StooqBar,
} from '../../../services/market/stooqDaily'
import {
  addDaysYmd,
  DEFAULT_FUNDING_FLOOR_YMD,
  filterNavBySpan,
  lastReportYmd,
  oneDayNavMove,
  resolveFundingStartYmd,
  type PortfolioTimeSpan,
} from './portfolioNavFilter'
import {
  navRowsForLogScale,
  navSeriesMinMax,
  perfSeriesMinMax,
  type NavSeriesVisibility,
} from './portfolioChartUtils'
import { FinDataTable, type FinDataTableCol } from '../../fin/FinDataTable'
import { PortfolioChartToolbar } from './PortfolioChartToolbar'
import { PortfolioLightweightChart } from './PortfolioLightweightChart'
import { PortfolioHoldingsTab } from './PortfolioHoldingsTab'
import {
  formatFlexYyyymmdd,
  formatPctSigned,
  formatUsd,
  formatUsdMoney,
  formatUsdSigned,
} from './portfolioFormat'

function formatWhenGenerated(s: string) {
  if (!s) return '—'
  const [datePart, timePart] = s.split(';')
  const d = formatFlexYyyymmdd(datePart ?? '')
  return timePart ? `${d} ${timePart}` : d
}

function tradeSortKey(t: { tradeDate: string; dateTime: string }) {
  return `${t.tradeDate};${t.dateTime}`
}

type ChartMode = 'nav' | 'perf'

const BENCHMARKS = [
  { id: 'spy' as const, label: 'S&P 500', short: 'SPY', stooq: 'spy.us', color: '#888' },
  { id: 'qqq' as const, label: 'Nasdaq 100', short: 'QQQ', stooq: 'qqq.us', color: '#378ADD' },
  { id: 'iwm' as const, label: 'Russell 2000', short: 'IWM', stooq: 'iwm.us', color: '#7F77DD' },
  { id: 'dia' as const, label: 'Dow', short: 'DIA', stooq: 'dia.us', color: '#ff6600' },
]
type BenchId = (typeof BENCHMARKS)[number]['id']

type PerfRow = {
  dateLabel: string
  sortKey: string
  portPct: number
  spyPct: number | null
  qqqPct: number | null
  iwmPct: number | null
  diaPct: number | null
}

function buildPerfRows(navPts: IbkrNavHistoryPoint[], barsById: Partial<Record<BenchId, StooqBar[]>>): PerfRow[] {
  if (!navPts.length) return []
  const first = navPts[0]!
  const baseNav = first.total
  if (!Number.isFinite(baseNav) || baseNav <= 0) return []

  return navPts.map((p) => {
    const portPct = (p.total / baseNav - 1) * 100
    const row: PerfRow = {
      dateLabel: formatFlexYyyymmdd(p.reportDate),
      sortKey: p.reportDate,
      portPct,
      spyPct: null,
      qqqPct: null,
      iwmPct: null,
      diaPct: null,
    }
    for (const b of BENCHMARKS) {
      const series = barsById[b.id]
      if (!series?.length) continue
      const b0 = closestCloseOnOrBefore(series, first.reportDate)
      const bc = closestCloseOnOrBefore(series, p.reportDate)
      if (b0 != null && b0 > 0 && bc != null) {
        if (b.id === 'spy') row.spyPct = (bc / b0 - 1) * 100
        if (b.id === 'qqq') row.qqqPct = (bc / b0 - 1) * 100
        if (b.id === 'iwm') row.iwmPct = (bc / b0 - 1) * 100
        if (b.id === 'dia') row.diaPct = (bc / b0 - 1) * 100
      }
    }
    return row
  })
}

type PfMainTab = 'overview' | 'holdings'

export function PortfolioPage() {
  const { token, queryId, fixtureUrl, usePortfolioApi, portfolioApiBase, portfolioPollMs } = getIbkrFlexEnv()
  const canApi = usePortfolioApi
  // Browser Flex uses /ibkr-flex — only exists in Vite dev; production must use portfolio API (Render) or fixture.
  const canLiveDirect = import.meta.env.DEV && Boolean(token && queryId) && !canApi
  const canFixture = Boolean(fixtureUrl) && !canApi

  const lifted = usePortfolioLifted()
  const isLifted = lifted != null

  const [localStatus, setLocalStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [localError, setLocalError] = useState<string | null>(null)
  const [localData, setLocalData] = useState<IbkrFlexPortfolio | null>(null)

  const data = isLifted ? lifted.data : localData
  const status = isLifted ? lifted.status : localStatus
  const error = isLifted ? lifted.error : localError
  const cachedAt = isLifted ? lifted.cachedAt : null

  const dataRef = useRef<IbkrFlexPortfolio | null>(null)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const [pfTab, setPfTab] = useState<PfMainTab>('overview')
  const [timeSpan, setTimeSpan] = useState<PortfolioTimeSpan>('YTD')
  const [chartMode, setChartMode] = useState<ChartMode>('nav')
  const [truncated, setTruncated] = useState(false)
  const [logScale, setLogScale] = useState(false)

  const [navLines, setNavLines] = useState<NavSeriesVisibility>({ total: true, stock: true, cash: true })
  const [benchOn, setBenchOn] = useState<Record<BenchId, boolean>>({
    spy: true,
    qqq: false,
    iwm: false,
    dia: false,
  })

  const [benchSeries, setBenchSeries] = useState<Partial<Record<BenchId, StooqBar[]>>>({})
  const [symSeries, setSymSeries] = useState<Record<string, number[]>>({})
  const [sym1d, setSym1d] = useState<Record<string, { pct: number }>>({})
  const [marketNote, setMarketNote] = useState<string | null>(null)

  const refreshLifted = lifted?.refresh

  const sync = useCallback(async () => {
    if (refreshLifted) {
      await refreshLifted()
      return
    }
    setLocalError(null)
    setLocalStatus('loading')
    try {
      if (canLiveDirect) {
        const portfolio = await loadIbkrFlexPortfolio(token, queryId)
        setLocalData(portfolio)
        setLocalStatus('ok')
      } else if (canFixture) {
        const portfolio = await loadIbkrFlexPortfolioFromFixture(fixtureUrl)
        setLocalData(portfolio)
        setLocalStatus('ok')
      } else {
        throw new Error(
          'Production needs VITE_USE_PORTFOLIO_API=1 and VITE_PORTFOLIO_API_BASE (your Render API). Local dev can use IBKR tokens + /ibkr-flex proxy, or VITE_IBKR_FLEX_FIXTURE_URL.',
        )
      }
    } catch (e) {
      setLocalData(null)
      setLocalError(e instanceof Error ? e.message : String(e))
      setLocalStatus('err')
    }
  }, [canFixture, canLiveDirect, fixtureUrl, queryId, refreshLifted, token])

  const fundingYmd = useMemo(
    () => (data ? resolveFundingStartYmd(data.account.dateFunded) : DEFAULT_FUNDING_FLOOR_YMD),
    [data],
  )

  const filteredNav = useMemo(() => {
    if (!data?.navHistory.length) return []
    return filterNavBySpan(data.navHistory, timeSpan, fundingYmd)
  }, [data?.navHistory, timeSpan, fundingYmd])

  const sortedTrades = useMemo(() => {
    if (!data?.trades.length) return []
    return [...data.trades].sort((a, b) => tradeSortKey(b).localeCompare(tradeSortKey(a)))
  }, [data?.trades])

  const tradeColumns = useMemo((): FinDataTableCol<IbkrTradeRow>[] => {
    return [
      {
        key: 'd',
        header: 'Date',
        cell: (t) => <span className="mono">{formatFlexYyyymmdd(t.tradeDate)}</span>,
        searchText: (t) => `${t.tradeDate} ${t.symbol} ${t.description}`,
      },
      {
        key: 'tm',
        header: 'Time',
        cell: (t) => {
          const [, timePart] = t.dateTime.split(';')
          return <span className="mono">{timePart ?? '—'}</span>
        },
        searchText: (t) => t.dateTime,
      },
      {
        key: 'sym',
        header: 'Symbol',
        cell: (t) => <span className="mono">{t.symbol}</span>,
        searchText: (t) => t.symbol,
      },
      { key: 'bs', header: 'B/S', cell: (t) => t.buySell, searchText: (t) => t.buySell },
      {
        key: 'qty',
        header: 'Qty',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => t.quantity,
        searchText: (t) => String(t.quantity),
      },
      {
        key: 'px',
        header: 'Price',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => formatUsd(t.tradePrice),
      },
      {
        key: 'proc',
        header: 'Proceeds',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => formatUsd(t.proceeds),
      },
      {
        key: 'net',
        header: 'Net cash',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => formatUsd(t.netCash),
      },
      {
        key: 'comm',
        header: 'Comm',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => formatUsd(t.ibCommission),
      },
      {
        key: 'real',
        header: 'Real P&L',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => (
          <span className={t.fifoPnlRealized >= 0 ? 'pos' : 'neg'}>{formatUsdSigned(t.fifoPnlRealized)}</span>
        ),
      },
      {
        key: 'mtm',
        header: 'MTM P&L',
        className: 'bb-grid__r mono',
        thClassName: 'bb-grid__r',
        cell: (t) => <span className={t.mtmPnl >= 0 ? 'pos' : 'neg'}>{formatUsdSigned(t.mtmPnl)}</span>,
      },
    ]
  }, [])

  const cn = data?.changeInNav
  const settledCash = data?.cashSummary?.endingSettledCash ?? 0

  const fairCostPositions = useMemo(() => {
    if (!data?.positions.length) return 0
    return data.positions.reduce((s, p) => s + p.costBasisMoney, 0)
  }, [data?.positions])

  const fairCostTotal = useMemo(() => settledCash + fairCostPositions, [settledCash, fairCostPositions])

  const totalValue = cn?.endingValue ?? data?.latestEquity?.total ?? null

  const totalReturn = useMemo(() => {
    if (totalValue == null || !Number.isFinite(fairCostTotal) || fairCostTotal <= 0) {
      return { usd: null as number | null, pct: null as number | null }
    }
    const usd = totalValue - fairCostTotal
    return { usd, pct: (usd / fairCostTotal) * 100 }
  }, [fairCostTotal, totalValue])

  const oneD = useMemo(() => {
    if (!data?.navHistory.length) return null
    return oneDayNavMove(data.navHistory, fundingYmd)
  }, [data?.navHistory, fundingYmd])

  const navChartRowsRaw = useMemo(() => {
    return filteredNav.map((p) => ({
      dateLabel: formatFlexYyyymmdd(p.reportDate),
      sortKey: p.reportDate,
      total: p.total,
      cash: p.cash,
      stock: p.stock,
    }))
  }, [filteredNav])

  const navChartRows = useMemo(() => {
    if (chartMode === 'nav' && logScale) return navRowsForLogScale(navChartRowsRaw)
    return navChartRowsRaw
  }, [chartMode, logScale, navChartRowsRaw])

  const perfChartRows = useMemo(() => buildPerfRows(filteredNav, benchSeries), [filteredNav, benchSeries])

  const navYDomain = useMemo(
    () => (chartMode === 'nav' ? navSeriesMinMax(navChartRows, truncated, navLines) : undefined),
    [chartMode, navChartRows, truncated, navLines],
  )

  const perfDomainKeys = useMemo(() => {
    const keys: string[] = ['portPct']
    for (const b of BENCHMARKS) {
      if (benchOn[b.id]) keys.push(`${b.id}Pct`)
    }
    return keys
  }, [benchOn])

  const perfYDomain = useMemo(
    () =>
      chartMode === 'perf' && perfDomainKeys.length
        ? perfSeriesMinMax(perfChartRows as Record<string, unknown>[], truncated, perfDomainKeys)
        : undefined,
    [chartMode, perfChartRows, truncated, perfDomainKeys],
  )

  const perfLegend = useMemo(() => {
    if (!perfChartRows.length) return null
    const last = perfChartRows[perfChartRows.length - 1]!
    return last
  }, [perfChartRows])

  useEffect(() => {
    if (!data?.navHistory.length) {
      setBenchSeries({})
      setSymSeries({})
      setSym1d({})
      setMarketNote(null)
      return
    }
    let cancel = false
    const lastY = lastReportYmd(data.navHistory) ?? data.statement.toDate
    if (!/^\d{8}$/.test(lastY)) return
    const fund = resolveFundingStartYmd(data.account.dateFunded)
    const sparkFrom = addDaysYmd(lastY, -400)

    ;(async () => {
      try {
        const nextBench: Partial<Record<BenchId, StooqBar[]>> = {}
        await Promise.all(
          BENCHMARKS.map(async (b) => {
            try {
              const bars = await fetchStooqDaily(b.stooq, fund, lastY)
              if (!cancel) nextBench[b.id] = bars
            } catch {
              /* skip benchmark */
            }
          }),
        )
        if (cancel) return
        setBenchSeries(nextBench)
        const symbols = [...new Set(data.positions.map((p) => p.symbol))].filter(Boolean)
        const nextSeries: Record<string, number[]> = {}
        const next1d: Record<string, { pct: number }> = {}
        await Promise.all(
          symbols.map(async (sym) => {
            try {
              const bars = await fetchStooqDaily(tickerToStooq(sym), sparkFrom, lastY)
              if (cancel) return
              nextSeries[sym] = bars.map((b) => b.close)
              const pair = lastTwoCloses(bars)
              if (pair && pair.prev > 0) {
                next1d[sym] = { pct: ((pair.last - pair.prev) / pair.prev) * 100 }
              }
            } catch {
              /* skip symbol */
            }
          }),
        )
        if (cancel) return
        setSymSeries(nextSeries)
        setSym1d(next1d)
        setMarketNote(null)
      } catch {
        if (!cancel) {
          setBenchSeries({})
          setSymSeries({})
          setSym1d({})
          setMarketNote('Benchmark / 1D data unavailable (network or Stooq). NAV-only charts still work.')
        }
      }
    })()

    return () => {
      cancel = true
    }
  }, [data])

  return (
    <div className="bb-workspace bb-fin-page bb-pf-page">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">PF</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">PORTFOLIO</span>
      </div>

      <section className="bb-win bb-ibkr-flex">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">IBKR FLEX · PORTFOLIO</span>
          <span className="bb-ibkr-flex__barRight">
            {canApi ? (
              <span
                className="bb-win__meta mono"
                title="When the portfolio API last wrote this snapshot to Redis (after a successful IBKR Flex pull)"
              >
                Last sync {formatPortfolioCachedAt(cachedAt)}
              </span>
            ) : null}
            <button
              type="button"
              className="bb-btn"
              disabled={
                (isLifted
                  ? lifted.busy || (lifted.status === 'loading' && !lifted.data)
                  : status === 'loading') ||
                (!canApi && !canLiveDirect && !canFixture)
              }
              title={
                canApi
                  ? 'Optional: POST /api/portfolio/sync — IBKR→Redis immediately. Background polling keeps running when you switch tabs.'
                  : undefined
              }
              onClick={() => void sync()}
            >
              {isLifted && lifted.busy
                ? 'REFRESHING…'
                : status === 'loading'
                  ? canApi
                    ? 'LOADING…'
                    : 'SYNCING…'
                  : canApi
                    ? 'REFRESH NOW'
                    : 'SYNC FLEX'}
            </button>
          </span>
        </header>

        <div className="bb-ibkr-flex__body">
          {canApi ? (
            <p className="bb-fin-mutedHint">
              Data stays warm while you use other modules: polling and Redis cache run at the app root. The server
              refreshes IBKR Flex on a timer and stores JSON in Redis; the client pulls{' '}
              <span className="mono">GET /api/portfolio</span> every <span className="mono">{Math.round(portfolioPollMs / 1000)}s</span>.
              A copy of the last response is kept in <span className="mono">sessionStorage</span> for a fast return to
              this tab. Use Refresh for an immediate <span className="mono">POST /api/portfolio/sync</span> (also writes Redis).
              {portfolioApiBase ? (
                <>
                  {' '}
                  · API base <span className="mono">{portfolioApiBase}</span>
                </>
              ) : (
                ' · same-origin /api (Vite proxy)'
              )}
              .
            </p>
          ) : null}

          {!canApi && !canLiveDirect && !canFixture ? (
            <p className="bb-fin-mutedHint">
              Add <span className="mono">VITE_USE_PORTFOLIO_API=1</span> and run the portfolio API + Redis, or{' '}
              <span className="mono">IBKR_FLEX_TOKEN</span> + <span className="mono">IBKR_FLEX_QUERY_ID</span> in{' '}
              <span className="mono">.env</span>, or <span className="mono">VITE_IBKR_FLEX_FIXTURE_URL</span> for a local XML
              under <span className="mono">public/</span>.
            </p>
          ) : null}

          {canFixture && !canLiveDirect ? (
            <p className="bb-fin-mutedHint">
              Fixture: <span className="mono">{fixtureUrl}</span>
            </p>
          ) : null}

          {error ? (
            <div className="bb-fin-warning" role="alert">
              {error}
            </div>
          ) : null}

          {status === 'idle' && !data && !canApi ? (
            <p className="bb-fin-mutedHint">Press SYNC FLEX to load NAV, holdings, trades, and benchmarks.</p>
          ) : null}

          {canApi && status === 'loading' && !data ? (
            <p className="bb-fin-mutedHint">Loading portfolio from API…</p>
          ) : null}

          {marketNote ? <p className="bb-fin-mutedHint">{marketNote}</p> : null}

          {data ? (
            <div className="bb-equity bb-pf-eqShell">
              <nav className="bb-eq-tabs bb-pf-eqTabs" aria-label="Portfolio sections">
                {(
                  [
                    ['overview', 'OVERVIEW'],
                    ['holdings', 'HOLDINGS'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`bb-eq-tabs__t${pfTab === id ? ' bb-eq-tabs__t--on' : ''}`}
                    onClick={() => setPfTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {pfTab === 'holdings' ? (
                <div className="bb-eq-tabwrap">
                  <PortfolioHoldingsTab data={data} fundingYmd={fundingYmd} sym1d={sym1d} symSeries={symSeries} />
                </div>
              ) : (
                <div className="bb-eq-tabwrap">
                  <div className="bb-pf-kpiBar">
                    <div className="bb-pf-kpiBar__item">
                      <div className="bb-pf-kpiBar__val mono">{totalValue != null ? formatUsdMoney(totalValue) : '—'}</div>
                      <div className="bb-pf-kpiBar__lbl">
                        Total Value · {data.positions.length} holding{data.positions.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="bb-pf-kpiBar__sep" aria-hidden />
                    <div className="bb-pf-kpiBar__item">
                      <div
                        className={`bb-pf-kpiBar__val mono ${(totalReturn.usd ?? 0) >= 0 ? 'bb-pf-kpiBar__val--up' : 'bb-pf-kpiBar__val--dn'}`}
                      >
                        {totalReturn.usd != null ? formatUsdSigned(totalReturn.usd) : '—'}
                      </div>
                      <div
                        className={`bb-pf-kpiBar__sub ${(totalReturn.pct ?? 0) >= 0 ? 'bb-pf-kpiBar__sub--up' : 'bb-pf-kpiBar__sub--dn'}`}
                      >
                        Total Returns {totalReturn.pct != null ? formatPctSigned(totalReturn.pct) : '—'}
                      </div>
                      <div className="bb-pf-kpiBar__lbl muted" style={{ marginTop: 4 }}>
                        vs fair cost (cash + position cost)
                      </div>
                    </div>
                    <div className="bb-pf-kpiBar__sep" aria-hidden />
                    <div className="bb-pf-kpiBar__item">
                      <div
                        className={`bb-pf-kpiBar__val mono ${(oneD?.usd ?? 0) >= 0 ? 'bb-pf-kpiBar__val--up' : 'bb-pf-kpiBar__val--dn'}`}
                      >
                        {oneD ? formatUsdSigned(oneD.usd) : '—'}
                      </div>
                      <div
                        className={`bb-pf-kpiBar__sub ${(oneD?.pct ?? 0) >= 0 ? 'bb-pf-kpiBar__sub--up' : 'bb-pf-kpiBar__sub--dn'}`}
                      >
                        1D Returns {oneD ? formatPctSigned(oneD.pct) : '—'}
                      </div>
                    </div>
                    <div className="bb-pf-kpiBar__sep" aria-hidden />
                    <div className="bb-pf-kpiBar__item">
                      <div className="bb-pf-kpiBar__val mono">n/a</div>
                      <div className="bb-pf-kpiBar__lbl">Annualised (IRR)</div>
                    </div>
                  </div>

                  <div className="bb-fin-metricsGrid bb-fin-grid--3 bb-pf-kpis">
                    <div className="bb-fin-metric bb-pf-metricCard">
                      <div className="bb-fin-metric__k">Balance (settled cash)</div>
                      <div className="bb-fin-metric__v mono">{data.cashSummary ? formatUsd(data.cashSummary.endingSettledCash) : '—'}</div>
                    </div>
                    <div className="bb-fin-metric bb-pf-metricCard">
                      <div className="bb-fin-metric__k">Fair cost (cash + cost basis)</div>
                      <div className="bb-fin-metric__v mono">{formatUsd(fairCostTotal)}</div>
                      <div className="bb-fin-mutedHint bb-pf-metricHint">
                        Settled cash + Σ position cost (summary) — principal deployed
                      </div>
                    </div>
                    <div className="bb-fin-metric bb-pf-metricCard">
                      <div className="bb-fin-metric__k">Securities value (mark)</div>
                      <div className="bb-fin-metric__v mono">
                        {data.latestEquity
                          ? formatUsd(
                              data.latestEquity.stock +
                                data.latestEquity.options +
                                data.latestEquity.bonds +
                                data.latestEquity.funds,
                            )
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <p className="bb-fin-mutedHint bb-pf-meta mono">
                    {data.account.name} · {data.account.accountId} · funding floor {formatFlexYyyymmdd(fundingYmd)} ·
                    statement {formatFlexYyyymmdd(data.statement.fromDate)} → {formatFlexYyyymmdd(data.statement.toDate)} ·
                    generated {formatWhenGenerated(data.statement.whenGenerated)}
                  </p>

                  <div className="bb-fin-divider" />

                  {cn ? (
                    <>
                      <div className="bb-fin-subttl bb-pf-subttl">Period performance (statement range)</div>
                      <div className="bb-fin-grid bb-fin-grid--2 bb-pf-performance">
                        <div className="bb-fin-card">
                          <div className="bb-fin-card__title">NAV movement</div>
                          <div className="bb-fin-kv">
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">starting value</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsd(cn.startingValue)}</span>
                            </div>
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">ending value</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsd(cn.endingValue)}</span>
                            </div>
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">deposits / withdrawals</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsdSigned(cn.depositsWithdrawals)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bb-fin-card">
                          <div className="bb-fin-card__title">Attribution (IBKR)</div>
                          <div className="bb-fin-kv">
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">MTM</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsdSigned(cn.mtm)}</span>
                            </div>
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">dividends</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsdSigned(cn.dividends)}</span>
                            </div>
                            <div className="bb-fin-kv__row">
                              <span className="bb-fin-kv__k">commissions</span>
                              <span className="bb-fin-kv__v mono bb-grid__r">{formatUsdSigned(cn.commissions)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bb-fin-divider" />
                    </>
                  ) : null}

                  <PortfolioChartToolbar
                    dateSpan={timeSpan}
                    onDateSpan={setTimeSpan}
                    truncated={truncated}
                    onTruncated={setTruncated}
                    logScale={logScale}
                    onLogScale={setLogScale}
                    logDisabled={chartMode === 'perf'}
                    logDisabledReason="Log scale applies to NAV levels only (positive axis)"
                  />

                  <div className="bb-pf-chartHdr">
                    <div className="bb-pf-chartHdr__left">
                      {chartMode === 'nav' ? (
                        <span className="bb-pf-chartHdr__legend" style={{ fontSize: 12 }}>
                          Portfolio NAV <span className="muted">(levels)</span>
                        </span>
                      ) : (
                        <span className="bb-pf-chartHdr__legend" style={{ fontSize: 12 }}>
                          Performance <span className="muted">(% vs start of range)</span>
                        </span>
                      )}
                    </div>
                    <div className="bb-pf-chartHdr__modes">
                      <button
                        type="button"
                        className={`bb-pf-chip ${chartMode === 'nav' ? 'bb-pf-chip--on' : ''}`}
                        onClick={() => setChartMode('nav')}
                      >
                        NAV
                      </button>
                      <button
                        type="button"
                        className={`bb-pf-chip ${chartMode === 'perf' ? 'bb-pf-chip--on' : ''}`}
                        onClick={() => setChartMode('perf')}
                      >
                        Performance %
                      </button>
                    </div>
                  </div>

                  <div className="bb-pf-seriesToggles" aria-label="Chart series">
                    {chartMode === 'nav' ? (
                      <>
                        <span className="bb-pf-seriesToggles__lbl">Show</span>
                        {(
                          [
                            ['total', 'Total NAV', navLines.total] as const,
                            ['stock', 'Stock', navLines.stock] as const,
                            ['cash', 'Cash', navLines.cash] as const,
                          ] as const
                        ).map(([k, label, on]) => (
                          <button
                            key={k}
                            type="button"
                            className={`bb-pf-chip bb-pf-chip--sm${on ? ' bb-pf-chip--on' : ''}`}
                            onClick={() => setNavLines((v) => ({ ...v, [k]: !v[k] }))}
                          >
                            {label}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <span className="bb-pf-seriesToggles__lbl">Benchmarks</span>
                        {BENCHMARKS.map((b) => {
                          const pct =
                            perfLegend?.[`${b.id}Pct` as keyof PerfRow] ??
                            null
                          const hasSeries = Boolean(benchSeries[b.id]?.length)
                          return (
                            <button
                              key={b.id}
                              type="button"
                              title={hasSeries ? b.label : 'No data'}
                              className={`bb-pf-chip bb-pf-chip--sm${benchOn[b.id] ? ' bb-pf-chip--on' : ''}`}
                              disabled={!hasSeries}
                              onClick={() => setBenchOn((o) => ({ ...o, [b.id]: !o[b.id] }))}
                            >
                              {b.short}
                              {typeof pct === 'number' ? (
                                <span className={`mono ${pct >= 0 ? 'pos' : 'neg'}`} style={{ marginLeft: 4 }}>
                                  {formatPctSigned(pct)}
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                        {perfLegend ? (
                          <span className="bb-pf-chartHdr__legend" style={{ marginLeft: 8 }}>
                            <span className="bb-pf-chartHdr__swatch bb-pf-chartHdr__swatch--port" /> Port
                            <span className={`bb-pf-chartHdr__pct ${perfLegend.portPct >= 0 ? 'pos' : 'neg'}`}>
                              {formatPctSigned(perfLegend.portPct)}
                            </span>
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>

                  {navChartRows.length > 0 ? (
                    <div className="bb-pf-chart">
                      <PortfolioLightweightChart
                        chartMode={chartMode}
                        logScale={logScale}
                        truncated={truncated}
                        navRows={navChartRows}
                        perfRows={perfChartRows}
                        navLines={navLines}
                        benchOn={benchOn}
                        benchmarks={BENCHMARKS.map((b) => ({ id: b.id, short: b.short, color: b.color }))}
                        navYDomain={navYDomain}
                        perfYDomain={perfYDomain}
                      />
                    </div>
                  ) : (
                    <p className="bb-fin-mutedHint">No equity-by-date rows for this span.</p>
                  )}

                  <div className="bb-fin-divider" />

                  <FinDataTable
                    className="bb-pf-finTable"
                    title={<span className="bb-eq-sec__ttl">Trade history</span>}
                    rows={sortedTrades}
                    columns={tradeColumns}
                    rowKey={(t) => `${t.tradeID}-${t.dateTime}-${t.symbol}`}
                    pageSize={20}
                    searchPlaceholder="Search trades…"
                    emptyText="No trades in this statement."
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
