import { useEffect, useMemo, useState } from 'react'
import {
  fetchEquityFundamentalsDaily,
  fetchEquityFundamentalsDefinitions,
  fetchEquityTiingoNews,
  type TiingoNewsItem,
} from '../../../services/market/equityTiingoApi'
import { unwrapTiingoRecordArray } from '../../../utils/tiingoGrid'
import { InlineBold } from './InlineBold'

const SKIP_KEYS = new Set([
  'date',
  'reportDate',
  'filingDate',
  'periodEndDate',
  'endDate',
  'symbol',
  'ticker',
  'overview',
])

function buildDefinitionMap(raw: unknown): Record<string, string> {
  const rows = unwrapTiingoRecordArray(raw)
  const m: Record<string, string> = {}
  for (const r of rows) {
    const code = r.fieldName ?? r.code ?? r.metric ?? r.name ?? r.id
    const desc = r.description ?? r.label ?? r.title ?? r.longDescription
    if (code != null && desc != null) m[String(code)] = String(desc)
  }
  return m
}

function fmtCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(2)}K`
    return v.toLocaleString('en-US', { maximumFractionDigits: 6 })
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  const s = String(v)
  return s.length > 56 ? `${s.slice(0, 53)}…` : s
}

export function EquityAnalysisTab({ symbol }: { symbol: string }) {
  const [dailyRaw, setDailyRaw] = useState<unknown>(null)
  const [defsRaw, setDefsRaw] = useState<unknown>(null)
  const [news, setNews] = useState<TiingoNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const end = new Date().toISOString().slice(0, 10)
        const [dy, df, nw] = await Promise.all([
          fetchEquityFundamentalsDaily(symbol, { startDate: '2020-01-01', endDate: end }),
          fetchEquityFundamentalsDefinitions(symbol),
          fetchEquityTiingoNews(symbol, 20),
        ])
        if (!cancel) {
          setDailyRaw(dy)
          setDefsRaw(df)
          setNews(nw)
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [symbol])

  const defMap = useMemo(() => buildDefinitionMap(defsRaw), [defsRaw])

  const { asOf, metricEntries } = useMemo(() => {
    const rows = unwrapTiingoRecordArray(dailyRaw)
    if (!rows.length) return { asOf: null as string | null, metricEntries: [] as [string, unknown][] }
    const latest = rows[rows.length - 1]!
    let asOf: string | null = null
    for (const k of ['date', 'reportDate', 'endDate', 'periodEndDate']) {
      const v = latest[k]
      if (v != null) {
        asOf = String(v).slice(0, 10)
        break
      }
    }
    const metricEntries = Object.entries(latest)
      .filter(([k, v]) => !SKIP_KEYS.has(k) && v !== null && typeof v !== 'object')
      .sort(([a], [b]) => a.localeCompare(b))
    return { asOf, metricEntries }
  }, [dailyRaw])

  const shown = expanded ? metricEntries : metricEntries.slice(0, 28)
  const synthesis =
    news[0]?.title && news[0]?.description
      ? `${news[0].title}. ${news[0].description}`
      : news[0]?.title ?? news[0]?.description ?? ''

  return (
    <div className="bb-eq-sub bb-eq-an">
      <p className="muted bb-eq-sub__note">
        <span className="mono">{symbol}</span> — Street estimates and analyst grids are not available from Tiingo.
        This tab shows the latest <strong>fundamentals daily</strong> snapshot (Tiingo), metric definitions when the
        API returns them, and recent <strong>news</strong>.
      </p>

      {loading ? <p className="mono muted">Loading analysis data…</p> : null}
      {error ? (
        <p className="mono bb-eq-feedwarn" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bb-eq-an__layout">
        <div className="bb-eq-an__main">
          <h2 className="bb-eq-sec__ttl">FUNDAMENTALS DAILY (LATEST)</h2>
          {asOf ? (
            <p className="mono muted" style={{ margin: '0 0 0.5rem' }}>
              As of {asOf} · {metricEntries.length} fields
            </p>
          ) : null}
          {!metricEntries.length && !loading ? (
            <p className="mono muted">No fundamentals daily rows for this symbol.</p>
          ) : (
            <>
              <div className="bb-scroll">
                <table className="bb-eq-grid">
                  <thead>
                    <tr>
                      <th>METRIC</th>
                      <th className="bb-grid__r">VALUE</th>
                      <th>DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(([k, v]) => (
                      <tr key={k}>
                        <td className="mono">{k}</td>
                        <td className="bb-grid__r mono">{fmtCell(v)}</td>
                        <td className="muted">{defMap[k] ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {metricEntries.length > 28 ? (
                <button type="button" className="bb-eq-more bb-eq-an__more" onClick={() => setExpanded((e) => !e)}>
                  {expanded ? 'SHOW LESS ▴' : `SEE ${metricEntries.length - 28} MORE ▾`}
                </button>
              ) : null}
            </>
          )}
        </div>

        <aside className="bb-eq-an__side">
          <section className="bb-eq-side__blk">
            <h2 className="bb-eq-side__ttl">HEADLINE CONTEXT</h2>
            <div className="bb-eq-an__syn">
              {synthesis ? (
                <InlineBold text={synthesis} as="p" />
              ) : (
                <p className="mono muted">No recent headline text from Tiingo news.</p>
              )}
            </div>
          </section>
          <section className="bb-eq-side__blk">
            <h2 className="bb-eq-side__ttl">NEWS</h2>
            <ul className="bb-eq-an__rep">
              {news.length ? (
                news.map((r, i) => (
                  <li key={`${r.url ?? r.title}-${i}`} className="bb-eq-an__repi">
                    <div>
                      <a
                        href={r.url ?? '#'}
                        className="bb-eq-an__rept"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.title ?? r.description ?? 'Article'}
                      </a>
                      <div className="muted mono">
                        {r.source ?? '—'} · {r.publishedDate?.slice(0, 10) ?? '—'}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="mono muted">No news items.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
