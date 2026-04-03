import { useEffect, useMemo, useState } from 'react'
import {
  clearPersonalStatements,
  getDefaultDemoPersonalStatements,
  loadPersonalStatements,
  makeStatementItemId,
  savePersonalStatements,
  type PersonalStatementsInput,
  type StatementItem,
} from '../../../services/storage/personalStatementsStore'

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseMoney(s: string) {
  const raw = s.replace(/,/g, '').trim()
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function ItemRow({
  kind,
  item,
  onChange,
  onRemove,
}: {
  kind: 'asset' | 'liability'
  item: StatementItem
  onChange: (patch: Partial<StatementItem>) => void
  onRemove: () => void
}) {
  return (
    <tr>
      <td>
        <input
          className="bb-inp bb-inp--text"
          type="text"
          value={item.name}
          placeholder={kind === 'asset' ? 'Asset name' : 'Liability name'}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </td>
      <td className="bb-grid__r">
        <input
          className="bb-inp bb-inp--num mono"
          type="number"
          step="0.01"
          min={0}
          value={String(item.amount)}
          onChange={(e) => onChange({ amount: parseMoney(e.target.value) })}
        />
      </td>
      <td className="bb-grid__r">
        <button type="button" className="bb-btn" onClick={onRemove}>
          REMOVE
        </button>
      </td>
    </tr>
  )
}

export function PersonalStatementsPage() {
  return (
    <div className="bb-workspace">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">FIN</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">PERSONAL STATEMENTS</span>
      </div>
      <PersonalStatementsPanel />
    </div>
  )
}

export function PersonalStatementsPanel() {
  const [data, setData] = useState<PersonalStatementsInput>(() => {
    return loadPersonalStatements() ?? getDefaultDemoPersonalStatements()
  })

  useEffect(() => {
    savePersonalStatements(data)
  }, [data])

  const totalAssets = useMemo(() => data.assets.reduce((sum, a) => sum + Math.max(0, a.amount), 0), [data.assets])
  const totalLiabilities = useMemo(
    () => data.liabilities.reduce((sum, l) => sum + Math.max(0, l.amount), 0),
    [data.liabilities],
  )
  const netWorth = totalAssets - totalLiabilities

  const addAsset = () => {
    setData((d) => ({
      ...d,
      assets: [...d.assets, { id: makeStatementItemId('a'), name: '', amount: 0 }],
    }))
  }

  const addLiability = () => {
    setData((d) => ({
      ...d,
      liabilities: [...d.liabilities, { id: makeStatementItemId('l'), name: '', amount: 0 }],
    }))
  }

  const reset = () => {
    clearPersonalStatements()
    setData(getDefaultDemoPersonalStatements())
  }

  return (
    <section className="bb-win">
      <header className="bb-win__bar">
        <span className="bb-win__ttl">NET WORTH STATEMENT</span>
        <span className="bb-stmt__hdrRight">
          <span className={`mono ${netWorth >= 0 ? 'pos' : 'neg'}`} title="Total assets minus total liabilities">
            NET WORTH {netWorth >= 0 ? '+' : ''}
            {formatUsd(netWorth)}
          </span>
          <button type="button" className="bb-btn" onClick={reset}>
            RESET
          </button>
        </span>
      </header>

      <div className="bb-stmt">
        <div className="bb-stmt__cols">
          <div className="bb-stmt__col">
            <div className="bb-stmt__subhdr">ASSETS</div>
            <table className="bb-grid bb-stmt__grid">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>NAME</th>
                  <th className="bb-grid__r" style={{ width: '25%' }}>
                    AMOUNT
                  </th>
                  <th className="bb-grid__r" style={{ width: '20%' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.assets.map((a) => (
                  <ItemRow
                    key={a.id}
                    kind="asset"
                    item={a}
                    onChange={(patch) =>
                      setData((d) => ({
                        ...d,
                        assets: d.assets.map((x) => (x.id === a.id ? { ...x, ...patch } : x)),
                      }))
                    }
                    onRemove={() => setData((d) => ({ ...d, assets: d.assets.filter((x) => x.id !== a.id) }))}
                  />
                ))}
              </tbody>
            </table>
            <div className="bb-stmt__actions">
              <button type="button" className="bb-btn" onClick={addAsset}>
                ADD ASSET
              </button>
            </div>
          </div>

          <div className="bb-stmt__col">
            <div className="bb-stmt__subhdr">LIABILITIES</div>
            <table className="bb-grid bb-stmt__grid">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>NAME</th>
                  <th className="bb-grid__r" style={{ width: '25%' }}>
                    AMOUNT
                  </th>
                  <th className="bb-grid__r" style={{ width: '20%' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.liabilities.map((l) => (
                  <ItemRow
                    key={l.id}
                    kind="liability"
                    item={l}
                    onChange={(patch) =>
                      setData((d) => ({
                        ...d,
                        liabilities: d.liabilities.map((x) => (x.id === l.id ? { ...x, ...patch } : x)),
                      }))
                    }
                    onRemove={() =>
                      setData((d) => ({
                        ...d,
                        liabilities: d.liabilities.filter((x) => x.id !== l.id),
                      }))
                    }
                  />
                ))}
              </tbody>
            </table>
            <div className="bb-stmt__actions">
              <button type="button" className="bb-btn" onClick={addLiability}>
                ADD LIABILITY
              </button>
            </div>
          </div>
        </div>

        <div className="bb-metrics bb-stmt__summary" aria-label="Net worth summary">
          <div className="bb-metrics__row">
            <span className="bb-metrics__k">TOTAL ASSETS</span>
            <span className="bb-metrics__v mono">{formatUsd(totalAssets)}</span>
          </div>
          <div className="bb-metrics__row">
            <span className="bb-metrics__k">TOTAL LIABILITIES</span>
            <span className="bb-metrics__v mono">{formatUsd(totalLiabilities)}</span>
          </div>
          <div className="bb-metrics__row">
            <span className="bb-metrics__k">NET WORTH</span>
            <span className={`bb-metrics__v mono ${netWorth >= 0 ? 'pos' : 'neg'}`}>{formatUsd(netWorth)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

