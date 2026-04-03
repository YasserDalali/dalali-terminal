import type { PortfolioTimeSpan } from './portfolioNavFilter'

const DATE_SEGMENTS: { id: PortfolioTimeSpan; label: string }[] = [
  { id: '7D', label: '7D' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '6M', label: '6M' },
  { id: 'YTD', label: 'YTD' },
  { id: '1Y', label: '1Y' },
]

export function PortfolioChartToolbar(props: {
  dateSpan: PortfolioTimeSpan
  onDateSpan: (s: PortfolioTimeSpan) => void
  truncated: boolean
  onTruncated: (v: boolean) => void
  logScale: boolean
  onLogScale: (v: boolean) => void
  logDisabled?: boolean
  logDisabledReason?: string
}) {
  const {
    dateSpan,
    onDateSpan,
    truncated,
    onTruncated,
    logScale,
    onLogScale,
    logDisabled,
    logDisabledReason,
  } = props

  return (
    <div className="bb-eq-sub__toolbar bb-pf-chartToolbar">
      <div className="bb-eq-sub__seg" role="group" aria-label="Date range">
        {DATE_SEGMENTS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`bb-eq-sub__segbtn${dateSpan === id ? ' bb-eq-sub__segbtn--on' : ''}`}
            onClick={() => onDateSpan(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="bb-eq-sub__tools">
        <button
          type="button"
          className={`bb-eq-sub__segbtn${truncated ? ' bb-eq-sub__segbtn--on' : ''}`}
          onClick={() => onTruncated(!truncated)}
          title="Clip Y-axis to ~5–95% band to reduce spike noise"
        >
          TRUNC
        </button>
        <button
          type="button"
          className={`bb-eq-sub__segbtn${logScale ? ' bb-eq-sub__segbtn--on' : ''}${logDisabled ? ' bb-pf-chartToolbar__btn--dis' : ''}`}
          onClick={() => !logDisabled && onLogScale(!logScale)}
          disabled={logDisabled}
          title={logDisabledReason ?? 'Logarithmic Y scale'}
        >
          LOG
        </button>
      </div>
    </div>
  )
}
