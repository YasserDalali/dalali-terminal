import type { ModuleId } from '../../data/modules'
import { NAV_MODULES } from '../../data/modules'

interface ModulePlaceholderProps {
  moduleId: ModuleId
}

/** Only modules that fall through to this placeholder (see App routing). */
const BLURBS: Partial<Record<ModuleId, string>> = {
  risk: 'Beta, VaR, stress, correlation — wire to risk function.',
}

export function ModulePlaceholder({ moduleId }: ModulePlaceholderProps) {
  const mod = NAV_MODULES.find((m) => m.id === moduleId)
  const blurb = BLURBS[moduleId] ?? 'No data loaded for this function.'

  return (
    <div className="bb-workspace">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">{mod?.short ?? '—'}</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">{(mod?.label ?? '').toUpperCase()}</span>
      </div>
      <section className="bb-win">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">WORKSPACE</span>
        </header>
        <div className="bb-empty">
          <p className="bb-empty__txt">{blurb}</p>
          <p className="bb-empty__hint muted mono">CONNECT DATA FEEDS TO POPULATE THIS PANEL.</p>
        </div>
      </section>
    </div>
  )
}
