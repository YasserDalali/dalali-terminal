import { useState } from 'react'

interface AdvisorDrawerProps {
  open: boolean
  onToggle: () => void
  onClose: () => void
  activeModuleLabel: string
}

export function AdvisorDrawer({ open, onToggle, onClose, activeModuleLabel }: AdvisorDrawerProps) {
  const [input, setInput] = useState('')

  return (
    <>
      <button
        type="button"
        className="bb-help"
        onClick={onToggle}
        aria-expanded={open}
        title="Help / Chat (F1)"
      >
        HELP
      </button>

      <div
        className={`bb-modal-bg${open ? ' bb-modal-bg--open' : ''}`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="presentation"
        aria-hidden={!open}
      />

      <aside className={`bb-modal${open ? ' bb-modal--open' : ''}`} aria-hidden={!open}>
        <div className="bb-modal__titlebar">
          <span className="bb-modal__title">HELP / CHAT</span>
          <button type="button" className="bb-modal__x" onClick={onClose}>
            [X]
          </button>
        </div>
        <div className="bb-modal__sub">CTX: {activeModuleLabel.toUpperCase()}</div>
        <div className="bb-modal__body">
          <div className="bb-modal__line">
            <span className="bb-modal__prompt">&gt;</span> Streaming response area. Context from active
            function.
          </div>
        </div>
        <div className="bb-modal__footer">
          <span className="bb-modal__caret" aria-hidden>
            &gt;
          </span>
          <input
            className="bb-modal__input"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="button" className="bb-modal__send">
            GO
          </button>
        </div>
      </aside>
    </>
  )
}
