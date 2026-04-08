import { useEffect, useState } from 'react'
import { EquityLink } from '../../EquityLink'
import { fetchEquityTiingoMeta } from '../../../services/market/equityTiingoApi'

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Flatten Tiingo daily-meta style payload into display rows */
function metaToRows(raw: unknown): { label: string; value: string }[] {
  if (!isPlainRecord(raw)) return []
  const out: { label: string; value: string }[] = []
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out.push({ label: k, value: String(v) })
    } else if (Array.isArray(v)) {
      out.push({ label: k, value: v.length ? JSON.stringify(v).slice(0, 200) : '[]' })
    } else if (isPlainRecord(v)) {
      for (const [sk, sv] of Object.entries(v)) {
        if (sv == null || typeof sv === 'object') continue
        out.push({ label: `${k}.${sk}`, value: String(sv) })
      }
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label))
}

export function EquityRelationsTab({
  symbol,
  peers,
}: {
  symbol: string
  peers: string[]
}) {
  const [meta, setMeta] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const m = await fetchEquityTiingoMeta(symbol)
        if (!cancel) setMeta(m)
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

  const rows = metaToRows(meta)

  return (
    <div className="bb-eq-sub bb-eq-rel">
      <p className="muted bb-eq-sub__note">
        <span className="mono">{symbol}</span> — Corporate link graph (partners / M&amp;A) is not provided by Tiingo.
        Below: ticker metadata from <code>GET /tiingo/daily/{'{ticker}'}</code> via the BFF, plus peer tickers from
        the local listing (same as overview).
      </p>

      {loading ? <p className="mono muted">Loading Tiingo meta…</p> : null}
      {error ? (
        <p className="mono bb-eq-feedwarn" role="alert">
          {error}
        </p>
      ) : null}

      <section className="bb-eq-side__blk" style={{ marginBottom: '1rem' }}>
        <h2 className="bb-eq-side__ttl">RELATED TICKERS (LISTING)</h2>
        {peers.length ? (
          <div className="bb-eq-peers">
            {peers.map((p) => (
              <EquityLink key={p} symbol={p} variant="pill" className="mono">
                {p}
              </EquityLink>
            ))}
          </div>
        ) : (
          <p className="mono muted">No peer symbols on file for this ticker.</p>
        )}
      </section>

      <section className="bb-eq-side__blk">
        <h2 className="bb-eq-side__ttl">TIINGO METADATA</h2>
        {!rows.length && !loading ? (
          <p className="mono muted">Empty meta response.</p>
        ) : (
          <div className="bb-scroll">
            <table className="bb-eq-grid">
              <thead>
                <tr>
                  <th>FIELD</th>
                  <th>VALUE</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="mono">{r.label}</td>
                    <td className="muted">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
