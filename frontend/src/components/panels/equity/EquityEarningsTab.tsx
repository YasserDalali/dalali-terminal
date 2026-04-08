import { useEffect, useState } from 'react'
import { fetchEquityTiingoNews, type TiingoNewsItem } from '../../../services/market/equityTiingoApi'
import { InlineBold } from './InlineBold'

const CONTENT_TABS = ['Highlights', 'Transcript', 'Documents'] as const

export function EquityEarningsTab({ symbol }: { symbol: string }) {
  const [content, setContent] = useState<(typeof CONTENT_TABS)[number]>('Highlights')
  const [news, setNews] = useState<TiingoNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [txSearch, setTxSearch] = useState('')

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const items = await fetchEquityTiingoNews(symbol, 60)
        if (!cancel) setNews(items)
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

  const highlights = news
    .map((n) => n.title || n.description || '')
    .filter(Boolean)
    .slice(0, 12)

  return (
    <div className="bb-eq-sub">
      <p className="muted bb-eq-sub__note">
        <span className="mono">{symbol}</span> — Earnings call transcripts and detailed estimates are not exposed
        through Tiingo&apos;s public news feed. Below: recent <strong>Tiingo news</strong> for highlights; SEC EDGAR
        or a vendor feed would be needed for full calls.
      </p>

      {loading ? <p className="mono muted">Loading news…</p> : null}
      {error ? (
        <p className="mono bb-eq-feedwarn" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bb-eq-earn__ctabs">
        {CONTENT_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`bb-eq-earn__ct${content === t ? ' bb-eq-earn__ct--on' : ''}`}
            onClick={() => setContent(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {content === 'Highlights' ? (
        highlights.length ? (
          <ul className="bb-eq-earn__hl">
            {highlights.map((h, i) => (
              <li key={i} className="bb-eq-earn__hli">
                <InlineBold text={h} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mono muted">No news headlines returned for this symbol.</p>
        )
      ) : content === 'Transcript' ? (
        <div className="bb-eq-earn__tx">
          <p className="mono muted">
            Transcript search is not available from the Tiingo integration. Use Highlights for headlines or wire a
            dedicated transcript provider.
          </p>
          <input
            className="bb-eq-earn__search"
            placeholder="Search (disabled)…"
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            disabled
          />
        </div>
      ) : (
        <ul className="bb-eq-earn__docs">
          {news.length ? (
            news.map((d, i) => (
              <li key={`${d.url ?? d.title}-${i}`}>
                <a
                  href={d.url ?? '#'}
                  className="bb-eq-earn__doc"
                  target="_blank"
                  rel="noreferrer"
                  title={d.publishedDate}
                >
                  {d.title ?? d.description ?? d.url ?? 'Article'}
                </a>
                {d.source ? (
                  <span className="muted mono"> · {d.source}</span>
                ) : null}
              </li>
            ))
          ) : (
            <li className="mono muted">No document links from news feed.</li>
          )}
        </ul>
      )}
    </div>
  )
}
