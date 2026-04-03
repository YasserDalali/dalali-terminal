import { useState } from 'react'
import type { ModuleId } from '../data/modules'
import { NAV_MODULES } from '../data/modules'

interface SidebarProps {
  activeModule: ModuleId
  onModuleChange: (id: ModuleId) => void
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const active = NAV_MODULES.find((m) => m.id === activeModule)

  return (
    <aside className={`bb-side${collapsed ? ' bb-side--collapsed' : ''}`}>
      <div className="bb-side__title">NAVIGATOR</div>
      <div className="bb-side__active" title={active?.label}>
        {active?.label.toUpperCase() ?? ''}
      </div>

      <nav className="bb-side__list" aria-label="Module navigation">
        {NAV_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`bb-side__row${activeModule === m.id ? ' bb-side__row--active' : ''}`}
            onClick={() => onModuleChange(m.id)}
            title={m.label}
          >
            <span className="bb-side__key">{m.short}</span>
            {!collapsed ? <span className="bb-side__name">{m.label}</span> : null}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="bb-side__toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '>>' : '<<'}
      </button>
    </aside>
  )
}
