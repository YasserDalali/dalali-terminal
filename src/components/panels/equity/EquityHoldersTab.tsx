import { useState } from 'react'
import {
  MOCK_HOLDERS_INST,
  MOCK_HOLDERS_INSIDER,
  MOCK_HOLDERS_POL,
} from '../../../data/equityTabMocks'

type HolderSub = 'institutional' | 'insiders' | 'politicians'

export function EquityHoldersTab() {
  const [sub, setSub] = useState<HolderSub>('institutional')

  return (
    <div className="bb-eq-sub">
      <div className="bb-eq-hold__top">
        <div className="bb-eq-hold__tabs">
          {(
            [
              ['institutional', 'INSTITUTIONAL'],
              ['insiders', 'INSIDERS'],
              ['politicians', 'POLITICIANS'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`bb-eq-hold__tab${sub === id ? ' bb-eq-hold__tab--on' : ''}`}
              onClick={() => setSub(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="bb-eq-hold__badges">
          <span className="bb-eq-hold__badge mono">1,247 FILINGS</span>
          <span className="bb-eq-hold__badge mono">REPORTED VAL $2.1T</span>
        </div>
      </div>
      <div className="bb-eq-hold__bar">
        <input className="bb-eq-hold__search" type="search" placeholder="Find institutional holders..." />
        <button type="button" className="bb-eq-btn bb-eq-btn--pri">
          ↓ DL
        </button>
      </div>

      {sub === 'institutional' ? (
        <div className="bb-scroll">
          <table className="bb-eq-grid">
            <thead>
              <tr>
                <th>MANAGER</th>
                <th className="bb-grid__r">SHARES</th>
                <th className="bb-grid__r">VALUE</th>
                <th className="bb-grid__r">CHG</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HOLDERS_INST.map((r) => (
                <tr key={r.manager}>
                  <td>{r.manager}</td>
                  <td className="bb-grid__r mono">{r.shares}</td>
                  <td className="bb-grid__r mono">{r.value}</td>
                  <td className={`bb-grid__r mono${r.chg.startsWith('-') ? ' neg' : ' pos'}`}>{r.chg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : sub === 'insiders' ? (
        <div className="bb-scroll">
          <table className="bb-eq-grid">
            <thead>
              <tr>
                <th>NAME</th>
                <th>TITLE</th>
                <th>TXN</th>
                <th className="bb-grid__r">SHARES</th>
                <th className="bb-grid__r">VALUE</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HOLDERS_INSIDER.map((r) => (
                <tr key={`${r.name}-${r.date}`}>
                  <td>{r.name}</td>
                  <td className="muted">{r.title}</td>
                  <td>
                    <span
                      className={`bb-eq-txn${
                        r.txn === 'Buy'
                          ? ' bb-eq-txn--buy'
                          : r.txn === 'Sell'
                            ? ' bb-eq-txn--sell'
                            : ' bb-eq-txn--gift'
                      }`}
                    >
                      {r.txn.toUpperCase()}
                    </span>
                  </td>
                  <td className="bb-grid__r mono">{r.shares}</td>
                  <td className="bb-grid__r mono">{r.value}</td>
                  <td className="mono">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bb-scroll">
          <table className="bb-eq-grid">
            <thead>
              <tr>
                <th>NAME</th>
                <th>PARTY</th>
                <th>CHAMBER</th>
                <th>TXN</th>
                <th className="bb-grid__r">AMOUNT</th>
                <th>DISCLOSED</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HOLDERS_POL.map((r) => (
                <tr key={`${r.name}-${r.disclosed}`}>
                  <td>{r.name}</td>
                  <td>
                    <span className={`bb-eq-party${r.party === 'D' ? ' bb-eq-party--d' : ' bb-eq-party--r'}`}>
                      {r.party}
                    </span>
                  </td>
                  <td>{r.chamber}</td>
                  <td>{r.txn}</td>
                  <td className="bb-grid__r mono">{r.amount}</td>
                  <td className="mono">{r.disclosed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
