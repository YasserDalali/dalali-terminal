import { useCallback, useEffect, useState } from 'react'
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
import { NAV_MODULES, type ModuleId } from './data/modules'

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const [activeModule, setActiveModule] = useState<ModuleId>('markets')
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [ibkrConnected] = useState(true)
  const [lastSync, setLastSync] = useState(() => formatTime(new Date()))
  const [fxCountdown, setFxCountdown] = useState(3600)

  useEffect(() => {
    const t = window.setInterval(() => {
      setLastSync(formatTime(new Date()))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      setFxCountdown((s) => (s <= 1 ? 3600 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  const toggleAdvisor = useCallback(() => setAdvisorOpen((o) => !o), [])
  const closeAdvisor = useCallback(() => setAdvisorOpen(false), [])
  const endSplash = useCallback(() => setSplash(false), [])

  const activeLabel = NAV_MODULES.find((m) => m.id === activeModule)?.label ?? ''

  return (
    <>
      {splash ? <SplashScreen onDone={endSplash} /> : null}
      <div className="bb-app">
      <TopBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        ibkrConnected={ibkrConnected}
      />

      <div className="bb-body">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

        <main className="bb-main">
          {activeModule === 'markets' ? (
            <MarketsOverview />
          ) : activeModule === 'equity' ? (
            <EquityPage />
          ) : activeModule === 'advisor' ? (
            <AdvisorPage />
          ) : activeModule === 'budget' ? (
            <BudgetPage />
          ) : activeModule === 'finance' ? (
            <FinancePage />
          ) : (
            <ModulePlaceholder moduleId={activeModule} />
          )}
        </main>
      </div>

      <CommandLine />

      <StatusBar
        sessionLabel="NYSE · REGULAR"
        baseCurrency="USD"
        fxCountdownSec={fxCountdown}
        lastSync={lastSync}
        ibkrConnected={ibkrConnected}
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
