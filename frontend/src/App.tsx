import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router-dom'
import './App.css'
import { AdvisorDrawer } from './components/AdvisorDrawer'
import { SplashScreen } from './components/SplashScreen'
import { CommandLine } from './components/CommandLine'
import { EquityPage } from './components/panels/EquityPage'
import { MarketsOverview } from './components/panels/MarketsOverview'
import { ModulePlaceholder } from './components/panels/ModulePlaceholder'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { AdvisorPage } from './components/panels/advisor/AdvisorPage'
import { BudgetPage } from './components/panels/budget/BudgetPage'
import { FinancePage } from './components/panels/finance/FinancePage'
import { PortfolioPage } from './components/panels/portfolio/PortfolioPage'
import { NAV_MODULES, type ModuleId } from './data/modules'
import { modulePath } from './routes/modulePaths'
import { moduleIdFromPathname } from './routes/resolveModule'
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

  const { equitySymbol, lastUpdated, error, loading } = useMarketData()
  const [splash, setSplash] = useState(true)
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

  const resolvedModule: ModuleId = moduleIdFromPathname(location.pathname)

  const handleModuleChange = useCallback(
    (id: ModuleId) => {
      if (id === 'equity') {
        const sym = equityRouteSymbol ?? equitySymbol ?? DEFAULT_EQUITY_SYMBOL
        navigate(modulePath('equity', { equitySymbol: sym }))
      } else {
        navigate(modulePath(id))
      }
    },
    [navigate, equityRouteSymbol, equitySymbol],
  )

  const activeLabel = NAV_MODULES.find((m) => m.id === resolvedModule)?.label ?? ''

  return (
    <>
      {splash ? <SplashScreen onDone={endSplash} /> : null}
      <div className="bb-app">
      <TopBar activeModule={resolvedModule} onModuleChange={handleModuleChange} feedOk={feedOk && !loading} />

      <div className="bb-body">
        <main className="bb-main">
          <Routes>
            <Route index element={<MarketsOverview />} />
            <Route path="equity/:symbol" element={<EquityPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="risk" element={<ModulePlaceholder moduleId="risk" />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="advisor" element={<AdvisorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
