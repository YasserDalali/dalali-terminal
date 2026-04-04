interface StatusBarProps {
  sessionLabel: string
  baseCurrency: string
  /** Seconds until the next scheduled market data refresh (0 if unknown). */
  secondsToRefresh: number
  /** Wall clock (HH:MM:SS), shown on the right. */
  clockTime: string
  /** When market data was last successfully refreshed; shown as DATA time. */
  lastDataRefresh: string
  /** True when Tiingo (via portfolio API) returned data and no hard error. */
  feedOk: boolean
}

export function StatusBar({
  sessionLabel,
  baseCurrency,
  secondsToRefresh,
  clockTime,
  lastDataRefresh,
  feedOk,
}: StatusBarProps) {
  return (
    <footer className="bb-status" role="contentinfo">
      <span className="bb-status__cell muted" title="Adj. end-of-day from Tiingo (portfolio API), not live DMA">
        DATA <span className="bb-status__hl">Tiingo</span>
      </span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell">
        <span className={`bb-led bb-led--sm${feedOk ? ' bb-led--on' : ''}`} aria-hidden />
        REFRESH <span className="bb-status__hl">{lastDataRefresh}</span>
      </span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell bb-status__cell--session">{sessionLabel}</span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell">
        CCY <span className="bb-status__hl">{baseCurrency}</span>
      </span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell" title="Seconds until next auto-refresh of market data">
        NEXT <span className="bb-status__hl">{secondsToRefresh}S</span>
      </span>
      <span className="bb-status__fill" />
      <span className="bb-status__cell bb-status__cell--time">{clockTime}</span>
    </footer>
  )
}
