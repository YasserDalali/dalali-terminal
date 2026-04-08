import { useState } from 'react'

export function CommandLine() {
  const [value, setValue] = useState('')

  return (
    <div className="bb-cmd">
      <label className="bb-cmd__label" htmlFor="bb-cmd-input">
        COMMAND LINE
      </label>
      <div className="bb-cmd__row">
        <span className="bb-cmd__caret" aria-hidden>
          &gt;
        </span>
        <input
          id="bb-cmd-input"
          className="bb-cmd__input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter ticker, function, or keyword..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="bb-cmd__go">
          GO
        </button>
      </div>
    </div>
  )
}
