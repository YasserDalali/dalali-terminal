import { BRAND_ACRONYM } from '../data/brand'
import type { ModuleId } from '../data/modules'
import { NAV_MODULES } from '../data/modules'

interface TopBarProps {
  activeModule: ModuleId
  onModuleChange: (id: ModuleId) => void
  ibkrConnected: boolean
}

const MAIN_MENU = ['DESKTOP', 'GROUPS', 'MESSAGES', 'IB', 'WORKFLOW', 'HELP'] as const

export function TopBar({ activeModule, onModuleChange, ibkrConnected }: TopBarProps) {
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
              <button type="button" className="bb-menubar__item">
                {item}
              </button>
            </span>
          ))}
        </nav>
        <div className="bb-menubar__right">
          <span className={`bb-led${ibkrConnected ? ' bb-led--on' : ''}`} title="Data feed" />
          <span className="bb-menubar__meta">IBKR</span>
          <span className="bb-menubar__pipe" aria-hidden />
          <span className="bb-menubar__meta bb-menubar__meta--user">USER</span>
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
