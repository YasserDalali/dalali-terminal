import { BRAND_ACRONYM } from '../data/brand'
import type { ModuleId } from '../data/modules'
import { NAV_MODULES } from '../data/modules'

interface TopBarProps {
  activeModule: ModuleId
  onModuleChange: (id: ModuleId) => void
  /** True when Tiingo market data loaded successfully (see status bar). */
  feedOk: boolean
}

const MAIN_MENU = ['DESKTOP', 'GROUPS', 'MESSAGES', 'IB', 'WORKFLOW', 'HELP'] as const

export function TopBar({ activeModule, onModuleChange, feedOk }: TopBarProps) {
  return (
    <>
      <div className="bb-menubar">
        <div className="bb-menubar__logo" aria-label={BRAND_ACRONYM}>
          {BRAND_ACRONYM}
        </div>
        <nav className="bb-menubar__nav" aria-label="Main menu">
          {MAIN_MENU.map((item, i) => (
            <span key={item} className="bb-menubar__cluster">
              {i > 0 ? <span className="bb-menubar__pipe" aria-hidden /> : null}
              <button type="button" className="bb-menubar__item" disabled title="Not implemented">
                {item}
              </button>
            </span>
          ))}
        </nav>
        <div className="bb-menubar__right">
          <span
            className={`bb-led${feedOk ? ' bb-led--on' : ''}`}
            title={feedOk ? 'Market data refreshed (Tiingo)' : 'Market data unavailable or loading'}
          />
          <span className="bb-menubar__meta">Tiingo</span>
          <span className="bb-menubar__pipe" aria-hidden />
          <span className="bb-menubar__meta bb-menubar__meta--user" title="Not signed in">
            LOCAL
          </span>
        </div>
      </div>

      <div className="bb-funcbar">
        <span className="bb-funcbar__label">FUNCTION</span>
        <div className="bb-funcbar__tabs" role="tablist" aria-label="Functions">
          {NAV_MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              className={`bb-funcbar__tab${activeModule === m.id ? ' bb-funcbar__tab--active' : ''}`}
              onClick={() => onModuleChange(m.id)}
            >
              {m.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
