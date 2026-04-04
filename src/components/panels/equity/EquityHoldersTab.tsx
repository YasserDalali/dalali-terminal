export function EquityHoldersTab({ symbol }: { symbol: string }) {
  return (
    <div className="bb-eq-sub">
      <p className="mono muted bb-eq-sub__note">
        <span className="mono">{symbol}</span> — Institutional 13F, insider Form 4, and politician-trade tables are
        not available from the Tiingo APIs wired in this app. To populate this tab, add a holders dataset (e.g. SEC
        EDGAR, SEC API, or a vendor) behind <code>/api/equity/holders</code>.
      </p>
      <div className="bb-eq-hold__top">
        <div className="bb-eq-hold__badges">
          <span className="bb-eq-hold__badge mono">DATA: NOT WIRED</span>
        </div>
      </div>
    </div>
  )
}
