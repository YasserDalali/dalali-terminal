/**
 * BFF routes: FRED macro, Tiingo EOD, Alpaca bars. Keys read from env; responses cached in Redis when available.
 */
import type { Express, Request, Response } from 'express'
import type { createClient } from 'redis'
import {
  fetchAlpacaStockBars,
  ALPACA_DATA_REST_DEFAULT,
} from './lib/alpacaClient.js'
import { fetchFredObservations, normalizeFredObservations } from './lib/fredClient.js'
import { MACRO_FRED_SERIES } from './lib/macroPresets.js'
import {
  fetchTiingoDailyPrices,
} from './lib/tiingoClient.js'
import {
  fetchTiingoDailyMeta,
  fetchTiingoFundamentalsDaily,
  fetchTiingoFundamentalsDefinitions,
  fetchTiingoFundamentalsStatements,
  fetchTiingoNews,
} from './lib/tiingoFundamentalsClient.js'

type RedisC = ReturnType<typeof createClient>

const TTL_FRED = Math.max(60, Number(process.env.MARKET_CACHE_TTL_FRED_SEC ?? 600))
const TTL_FRED_SNAPSHOT = Math.max(120, Number(process.env.MARKET_CACHE_TTL_FRED_SNAPSHOT_SEC ?? 900))
const TTL_TIINGO = Math.max(30, Number(process.env.MARKET_CACHE_TTL_TIINGO_SEC ?? 120))
const TTL_TIINGO_META = Math.max(300, Number(process.env.MARKET_CACHE_TTL_TIINGO_META_SEC ?? 3600))
const TTL_TIINGO_FUND = Math.max(300, Number(process.env.MARKET_CACHE_TTL_TIINGO_FUND_SEC ?? 3600))
const TTL_TIINGO_NEWS = Math.max(60, Number(process.env.MARKET_CACHE_TTL_TIINGO_NEWS_SEC ?? 600))
const TTL_ALPACA = Math.max(15, Number(process.env.MARKET_CACHE_TTL_ALPACA_SEC ?? 60))

function fredKey(): string | null {
  const k = process.env.FRED_API_KEY?.trim()
  return k || null
}

function tiingoToken(): string | null {
  const k = process.env.TIINGO_API_TOKEN?.trim()
  return k || null
}

function alpacaCreds(): { keyId: string; secret: string; restUrl: string; feed: string | undefined } | null {
  const keyId = process.env.ALPACA_API_KEY_ID?.trim()
  const secret = process.env.ALPACA_API_SECRET_KEY?.trim()
  if (!keyId || !secret) return null
  const restUrl = process.env.ALPACA_DATA_REST_URL?.trim() || ALPACA_DATA_REST_DEFAULT
  const feed = process.env.ALPACA_DATA_FEED?.trim() || undefined
  return { keyId, secret, restUrl, feed }
}

async function cacheOrRun(
  redis: RedisC,
  key: string,
  ttlSec: number,
  work: () => Promise<unknown>,
): Promise<{ cached: boolean; data: unknown }> {
  try {
    const raw = await redis.get(key)
    if (raw) {
      return { cached: true, data: JSON.parse(raw) as unknown }
    }
  } catch {
    /* serve fresh if Redis missing */
  }
  const data = await work()
  try {
    await redis.setEx(key, ttlSec, JSON.stringify(data))
  } catch {
    /* ignore */
  }
  return { cached: false, data }
}

export function registerExternalMarketRoutes(app: Express, getRedis: () => Promise<RedisC>): void {
  app.get('/api/macro/fred/observations', async (req: Request, res: Response) => {
    const apiKey = fredKey()
    if (!apiKey) {
      res.status(503).json({ ok: false, error: 'FRED_API_KEY not configured' })
      return
    }
    const series_id = String(req.query.series_id ?? '').trim()
    if (!series_id) {
      res.status(400).json({ ok: false, error: 'series_id is required' })
      return
    }
    const observation_start = req.query.observation_start
      ? String(req.query.observation_start)
      : undefined
    const observation_end = req.query.observation_end
      ? String(req.query.observation_end)
      : undefined
    const limitRaw = req.query.limit != null ? Number(req.query.limit) : undefined
    const limit =
      limitRaw != null && Number.isFinite(limitRaw) ? Math.min(10_000, Math.max(1, Math.floor(limitRaw))) : undefined

    const cacheKey = `dalali:ext:fred:obs:${series_id}:${observation_start ?? ''}:${observation_end ?? ''}:${limit ?? ''}`

    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_FRED, async () => {
        const raw = await fetchFredObservations(apiKey, {
          series_id,
          observation_start,
          observation_end,
          limit,
        })
        return { observations: normalizeFredObservations(raw) }
      })
      res.json({ ok: true, cached, series_id, ...((data as object) ?? {}) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/macro/fred/snapshot', async (_req: Request, res: Response) => {
    const apiKey = fredKey()
    if (!apiKey) {
      res.status(503).json({ ok: false, error: 'FRED_API_KEY not configured' })
      return
    }
    const cacheKey = 'dalali:ext:fred:snapshot:v1'
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_FRED_SNAPSHOT, async () => {
        const items = await Promise.all(
          MACRO_FRED_SERIES.map(async (preset) => {
            const raw = await fetchFredObservations(apiKey, {
              series_id: preset.id,
              limit: 8,
            })
            const obs = normalizeFredObservations(raw)
            const latest = obs.length ? obs[obs.length - 1] : undefined
            const prior = obs.length > 1 ? obs[obs.length - 2] : undefined
            return {
              id: preset.id,
              label: preset.label,
              latest,
              prior,
              observationCount: obs.length,
            }
          }),
        )
        return { items, fetchedAt: new Date().toISOString() }
      })
      res.json({ ok: true, cached, ...(data as object) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/daily/:symbol', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const symbol = decodeURIComponent(req.params.symbol ?? '').trim()
    if (!symbol) {
      res.status(400).json({ ok: false, error: 'symbol is required' })
      return
    }
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined
    const cacheKey = `dalali:ext:tiingo:daily:${symbol.toUpperCase()}:${startDate ?? ''}:${endDate ?? ''}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO, async () => {
        const prices = await fetchTiingoDailyPrices(token, symbol, { startDate, endDate })
        return { symbol: symbol.toUpperCase(), prices }
      })
      res.json({ ok: true, cached, ...(data as object) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/meta/:symbol', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const symbol = decodeURIComponent(req.params.symbol ?? '').trim()
    if (!symbol) {
      res.status(400).json({ ok: false, error: 'symbol is required' })
      return
    }
    const cacheKey = `dalali:ext:tiingo:meta:${symbol.toUpperCase()}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO_META, async () =>
        fetchTiingoDailyMeta(token, symbol),
      )
      res.json({ ok: true, cached, symbol: symbol.toUpperCase(), data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/fundamentals/:symbol/statements', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const symbol = decodeURIComponent(req.params.symbol ?? '').trim()
    if (!symbol) {
      res.status(400).json({ ok: false, error: 'symbol is required' })
      return
    }
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined
    const asReported = String(req.query.asReported ?? '') === '1' || String(req.query.asReported ?? '') === 'true'
    const cacheKey = `dalali:ext:tiingo:fund:stmt:${symbol.toUpperCase()}:${startDate ?? ''}:${endDate ?? ''}:${asReported}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO_FUND, async () =>
        fetchTiingoFundamentalsStatements(token, symbol, { startDate, endDate, asReported }),
      )
      res.json({ ok: true, cached, symbol: symbol.toUpperCase(), data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/fundamentals/:symbol/daily', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const symbol = decodeURIComponent(req.params.symbol ?? '').trim()
    if (!symbol) {
      res.status(400).json({ ok: false, error: 'symbol is required' })
      return
    }
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined
    const cacheKey = `dalali:ext:tiingo:fund:daily:${symbol.toUpperCase()}:${startDate ?? ''}:${endDate ?? ''}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO_FUND, async () =>
        fetchTiingoFundamentalsDaily(token, symbol, { startDate, endDate }),
      )
      res.json({ ok: true, cached, symbol: symbol.toUpperCase(), data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/fundamentals/definitions', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const tickers = String(req.query.tickers ?? '').trim()
    if (!tickers) {
      res.status(400).json({ ok: false, error: 'tickers is required (comma-separated)' })
      return
    }
    const cacheKey = `dalali:ext:tiingo:fund:def:${tickers}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO_FUND, async () =>
        fetchTiingoFundamentalsDefinitions(token, tickers),
      )
      res.json({ ok: true, cached, data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/tiingo/news', async (req: Request, res: Response) => {
    const token = tiingoToken()
    if (!token) {
      res.status(503).json({ ok: false, error: 'TIINGO_API_TOKEN not configured' })
      return
    }
    const tickers = String(req.query.tickers ?? '').trim()
    if (!tickers) {
      res.status(400).json({ ok: false, error: 'tickers is required' })
      return
    }
    const limitRaw = req.query.limit != null ? Number(req.query.limit) : 50
    const limit = Number.isFinite(limitRaw) ? Math.min(1000, Math.max(1, Math.floor(limitRaw))) : 50
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined
    const cacheKey = `dalali:ext:tiingo:news:${tickers}:${limit}:${startDate ?? ''}:${endDate ?? ''}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_TIINGO_NEWS, async () =>
        fetchTiingoNews(token, { tickers, limit, startDate, endDate }),
      )
      res.json({ ok: true, cached, data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })

  app.get('/api/market/alpaca/bars', async (req: Request, res: Response) => {
    const cred = alpacaCreds()
    if (!cred) {
      res.status(503).json({ ok: false, error: 'ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY not configured' })
      return
    }
    const symbols = String(req.query.symbols ?? '').trim()
    if (!symbols) {
      res.status(400).json({ ok: false, error: 'symbols is required' })
      return
    }
    const timeframe = String(req.query.timeframe ?? '1Day').trim() || '1Day'
    const limitRaw = req.query.limit != null ? Number(req.query.limit) : 100
    const limit =
      Number.isFinite(limitRaw) ? Math.min(10_000, Math.max(1, Math.floor(limitRaw))) : 100
    const start = req.query.start ? String(req.query.start) : undefined
    const end = req.query.end ? String(req.query.end) : undefined

    const cacheKey = `dalali:ext:alpaca:bars:${symbols}:${timeframe}:${limit}:${start ?? ''}:${end ?? ''}:${cred.feed ?? ''}`
    try {
      const redis = await getRedis()
      const { cached, data } = await cacheOrRun(redis, cacheKey, TTL_ALPACA, async () => {
        const body = await fetchAlpacaStockBars(cred.keyId, cred.secret, cred.restUrl, {
          symbols,
          timeframe,
          limit,
          start,
          end,
          feed: cred.feed,
        })
        return body
      })
      res.json({ ok: true, cached, ...(data as object) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(502).json({ ok: false, error: msg })
    }
  })
}
