import { useEffect, useRef } from 'react'
import type { HeatTile } from '../../services/market/marketDataStore'

type Props = {
  tiles: HeatTile[]
  onSymClick: (sym: string) => void
}

const TRADING_VIEW_SCRIPT_SRC =
  'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'

const TRADING_VIEW_CONFIG = {
  dataSource: 'SPX500',
  blockSize: 'market_cap_basic',
  blockColor: 'change',
  grouping: 'sector',
  locale: 'en',
  symbolUrl: '',
  colorTheme: 'dark',
  exchanges: [],
  hasTopBar: false,
  isDataSetEnabled: false,
  isZoomEnabled: true,
  hasSymbolTooltip: true,
  isMonoSize: false,
  width: '100%',
  height: '100%',
}

export function MarketsSectorHeatmap(_props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const existingWidget = container.querySelector('.tradingview-widget-container__widget')
    if (!existingWidget) return

    const script = document.createElement('script')
    script.src = TRADING_VIEW_SCRIPT_SRC
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify(TRADING_VIEW_CONFIG)
    existingWidget.appendChild(script)

    return () => {
      script.remove()
      existingWidget.innerHTML = ''
    }
  }, [])

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ width: '100%', height: 220 }}>
      <div className="tradingview-widget-container__widget" style={{ width: '100%', height: '100%' }} />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/heatmap/stock/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Stock Heatmap</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  )
}
