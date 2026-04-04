import { useEffect, useState } from 'react'
import {
  fetchFredMacroSnapshot,
  fetchSpyAlpacaDay,
  fetchSpyTiingoAdj,
  type BenchmarkRow,
  type FredMacroSnapshotOk,
} from '../../services/market/terminalMarketApi'

function formatObservationValue(seriesId: string, raw: string): string {
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  if (seriesId === 'GDPC1') return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (seriesId === 'CPIAUCSL') return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function benchCell(row: BenchmarkRow) {
  if (row.error) {
    return (
      <div className="bb-macro-bench__cell">
        <div className="bb-macro-bench__lbl mono muted">{row.label}</div>
        <div className="bb-macro-bench__val mono muted" title={row.error}>
          —
        </div>
      </div>
    )
  }
  return (
    <div className="bb-macro-bench__cell">
      <div className="bb-macro-bench__lbl mono muted">{row.label}</div>
      <div className="bb-macro-bench__val mono" title={row.asOf ?? ''}>
        {row.last != null ? row.last.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
      </div>
    </div>
  )
}

export function MarketsMacroStrip() {
  const [macro, setMacro] = useState<FredMacroSnapshotOk | null>(null)
  const [macroErr, setMacroErr] = useState<string | null>(null)
  const [bench, setBench] = useState<{ tiingo: BenchmarkRow; alpaca: BenchmarkRow } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const snap = await fetchFredMacroSnapshot()
      if (cancelled) return
      if (snap.ok) setMacro(snap)
      else setMacroErr(snap.error ?? 'Macro snapshot failed')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [tiingo, alpaca] = await Promise.all([fetchSpyTiingoAdj(), fetchSpyAlpacaDay()])
      if (!cancelled) setBench({ tiingo, alpaca })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bb-macro-desk">
      <section className="bb-win bb-win--wide">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">MACRO — FRED</span>
          <span className="bb-win__meta mono">
            {macro?.cached ? 'cached' : ''}
            {macro?.fetchedAt ? ` · ${macro.fetchedAt.slice(0, 19)}Z` : ''}
          </span>
        </header>
        {macroErr ? (
          <p className="mono muted bb-macro-desk__err">{macroErr}</p>
        ) : !macro ? (
          <p className="mono muted">Loading FRED snapshot…</p>
        ) : (
          <div className="bb-macro-grid">
            {(macro.items ?? []).map((it) => (
              <div key={it.id} className="bb-macro-grid__cell">
                <div className="bb-macro-grid__lbl">{it.label}</div>
                <div className="bb-macro-grid__sym mono">{it.id}</div>
                <div className="bb-macro-grid__val mono" title={it.latest?.date ?? ''}>
                  {it.latest ? formatObservationValue(it.id, it.latest.value) : '—'}
                </div>
                <div className="bb-macro-grid__dt mono muted">{it.latest?.date ?? ''}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bb-win">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">BENCHMARKS — Tiingo / Alpaca</span>
          <span className="bb-win__meta mono">SPY</span>
        </header>
        {!bench ? (
          <p className="mono muted">Loading provider checks…</p>
        ) : (
          <div className="bb-macro-bench">{benchCell(bench.tiingo)}{benchCell(bench.alpaca)}</div>
        )}
      </section>
    </div>
  )
}
