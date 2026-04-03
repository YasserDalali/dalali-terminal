import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { MarketDataProvider } from './services/market/marketDataStore'
import { PortfolioDataProvider } from './services/portfolio/portfolioApiContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MarketDataProvider>
        <PortfolioDataProvider>
          <App />
        </PortfolioDataProvider>
      </MarketDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
