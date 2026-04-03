import { useCallback, useEffect, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import './App.css'
import { AdvisorDrawer } from './components/AdvisorDrawer'
import { SplashScreen } from './components/SplashScreen'
import { CommandLine } from './components/CommandLine'
import { EquityPage } from './components/panels/EquityPage'
import { MarketsOverview } from './components/panels/MarketsOverview'
import { ModulePlaceholder } from './components/panels/ModulePlaceholder'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { AdvisorPage } from './components/panels/advisor/AdvisorPage'
import { BudgetPage } from './components/panels/budget/BudgetPage'
import { FinancePage } from './components/panels/finance/FinancePage'
import { PortfolioPage } from './components/panels/portfolio/PortfolioPage'
import { NAV_MODULES, type ModuleId } from './data/modules'
import { normalizeEquitySymbol } from './data/equitySymbol'
import { equityHref } from './navigation/equityRoutes'
import { DEFAULT_EQUITY_SYMBOL } from './services/market/marketConfig'
import { MARKET_DATA_REFRESH_INTERVAL_MS, useMarketData } from './services/market/marketDataStore'

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const equityMatch = useMatch({ path: '/equity/:symbol', end: true })
  const equityRouteSymbol = equityMatch?.params.symbol
    ? decodeURIComponent(equityMatch.params.symbol)
    : undefined

  const { setEquitySymbol, equitySymbol, lastUpdated, error, loading } = useMarketData()
  const [splash, setSplash] = useState(true)
  const [activeModule, setActiveModule] = useState<ModuleId>('markets')
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [clockTime, setClockTime] = useState(() => formatTime(new Date()))
  const [secondsToRefresh, setSecondsToRefresh] = useState(0)

  const feedOk = lastUpdated !== null && !error

  useEffect(() => {
    const t = window.setInterval(() => {
      setClockTime(formatTime(new Date()))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const tick = () => {
      if (!lastUpdated) {
        setSecondsToRefresh(0)
        return
      }
      const elapsed = Date.now() - lastUpdated.getTime()
      const left = MARKET_DATA_REFRESH_INTERVAL_MS - elapsed
      setSecondsToRefresh(Math.max(0, Math.ceil(left / 1000)))
    }
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [lastUpdated])

  const toggleAdvisor = useCallback(() => setAdvisorOpen((o) => !o), [])
  const closeAdvisor = useCallback(() => setAdvisorOpen(false), [])
  const endSplash = useCallback(() => setSplash(false), [])

  useEffect(() => {
    if (!equityRouteSymbol) return
    setEquitySymbol(normalizeEquitySymbol(equityRouteSymbol))
  }, [equityRouteSymbol, setEquitySymbol])

  const resolvedModule: ModuleId = equityRouteSymbol ? 'equity' : activeModule

  const handleModuleChange = useCallback(
    (id: ModuleId) => {
      setActiveModule(id)
      if (id === 'equity') {
        const sym = equityRouteSymbol ?? equitySymbol ?? DEFAULT_EQUITY_SYMBOL
        navigate(equityHref(sym))
      } else if (location.pathname.startsWith('/equity/')) {
        navigate('/', { replace: true })
      }
    },
    [navigate, location.pathname, equityRouteSymbol, equitySymbol],
  )

  const activeLabel = NAV_MODULES.find((m) => m.id === resolvedModule)?.label ?? ''

  return (
    <>
      {splash ? <SplashScreen onDone={endSplash} /> : null}
      <div className="bb-app">
      <TopBar activeModule={resolvedModule} onModuleChange={handleModuleChange} feedOk={feedOk && !loading} />

      <div className="bb-body">
        <Sidebar activeModule={resolvedModule} onModuleChange={handleModuleChange} />

        <main className="bb-main">
          {resolvedModule === 'markets' ? (
            <MarketsOverview />
          ) : resolvedModule === 'equity' ? (
            <EquityPage />
          ) : resolvedModule === 'advisor' ? (
            <AdvisorPage />
          ) : resolvedModule === 'budget' ? (
            <BudgetPage />
          ) : resolvedModule === 'finance' ? (
            <FinancePage />
          ) : resolvedModule === 'portfolio' ? (
            <PortfolioPage />
          ) : (
            <ModulePlaceholder moduleId={resolvedModule} />
          )}
        </main>
      </div>

      <CommandLine />

      <StatusBar
        sessionLabel="NYSE · REGULAR (REF)"
        baseCurrency="USD"
        secondsToRefresh={secondsToRefresh}
        clockTime={clockTime}
        lastDataRefresh={lastUpdated ? formatTime(lastUpdated) : '—'}
        feedOk={feedOk && !loading}
      />

      <AdvisorDrawer
        open={advisorOpen}
        onToggle={toggleAdvisor}
        onClose={closeAdvisor}
        activeModuleLabel={activeLabel}
      />
    </div>
    </>
  )
}
