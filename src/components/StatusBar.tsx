interface StatusBarProps {
  sessionLabel: string
  baseCurrency: string
  fxCountdownSec: number
  lastSync: string
  ibkrConnected: boolean
}

export function StatusBar({
  sessionLabel,
  baseCurrency,
  fxCountdownSec,
  lastSync,
  ibkrConnected,
}: StatusBarProps) {
  return (
    <footer className="bb-status" role="contentinfo">
      <span className="bb-status__cell">
        DMA <span className="bb-status__hl">&lt;1MS</span>
      </span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell">
        MSG <span className="bb-status__hl">0</span>
      </span>
      <span className="bb-status__sep" aria-hidden>
        |
      </span>
      <span className="bb-status__cell">
        <span className={`bb-led bb-led--sm${ibkrConnected ? ' bb-led--on' : ''}`} aria-hidden />
        SYNC <span className="bb-status__hl">{lastSync}</span>
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
      <span className="bb-status__cell">
        FX <span className="bb-status__hl">{fxCountdownSec}S</span>
      </span>
      <span className="bb-status__fill" />
      <span className="bb-status__cell bb-status__cell--time">{lastSync}</span>
    </footer>
  )
}
