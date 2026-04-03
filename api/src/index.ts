/**
 * Portfolio cache API: polls IBKR Flex, stores JSON in Redis, serves GET /api/portfolio.
 * Deploy: Render (see api/README.md). Local: npm run dev
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Repo root .env (local monorepo), then api/.env overrides — same DX as before `server/` moved.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import cors from 'cors'
import express from 'express'
import { createClient } from 'redis'
import type { IbkrFlexPortfolio } from './lib/ibkrFlexTypes.js'
import {
  IBKR_FLEX_WEB_SERVICE_DEFAULT_BASE,
  loadIbkrFlexPortfolio,
} from './lib/ibkrFlexService.js'
import {
  ensureBudgetTable,
  isBudgetDbConfigured,
  pingBudgetDb,
  readBudgetPayload,
  writeBudgetPayload,
} from './budgetPg.js'

const REDIS_KEY = process.env.PORTFOLIO_REDIS_KEY ?? 'dalali:portfolio:payload'
const PORT = Number(process.env.PORT ?? process.env.PORTFOLIO_API_PORT ?? 8787)
const POLL_MS = Math.max(10_000, Number(process.env.PORTFOLIO_POLL_MS ?? 120_000))
const FLEX_BASE =
  process.env.IBKR_FLEX_DIRECT_BASE?.trim() || IBKR_FLEX_WEB_SERVICE_DEFAULT_BASE

type CacheEnvelope = {
  ok: boolean
  data?: IbkrFlexPortfolio
  error?: string | null
  cachedAt?: string | null
}

type RedisC = ReturnType<typeof createClient>

let redis: RedisC | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let refreshInFlight = false

/** Log target host:port only (no password). */
function redisUrlForLog(raw: string): string {
  const tls = /^rediss:\/\//i.test(raw)
  const rest = raw.replace(/^rediss?:\/\//i, '')
  const hostPort = (rest.includes('@') ? rest.split('@').pop() : rest) ?? rest
  const hp = hostPort.split('/')[0] ?? hostPort
  return `${tls ? 'rediss' : 'redis'}://${hp}`
}

async function getRedis(): Promise<RedisC> {
  if (redis?.isOpen) return redis
  const url = process.env.REDIS_URL?.trim() || 'redis://127.0.0.1:6379'
  const client = createClient({ url })
  client.on('error', (err) => console.error('[redis]', err))
  await client.connect()
  redis = client
  console.log('[redis] connected', redisUrlForLog(url))
  return redis
}

async function readCache(): Promise<CacheEnvelope | null> {
  try {
    const r = await getRedis()
    const raw = await r.get(REDIS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CacheEnvelope
  } catch (e) {
    console.error('[cache read]', e)
    return null
  }
}

async function writeCache(env: CacheEnvelope): Promise<void> {
  const r = await getRedis()
  await r.set(REDIS_KEY, JSON.stringify(env))
}

async function refreshFromIbkr(): Promise<CacheEnvelope> {
  const token = process.env.IBKR_FLEX_TOKEN?.trim()
  const queryId = process.env.IBKR_FLEX_QUERY_ID?.trim()
  if (!token || !queryId) {
    const err = 'Server missing IBKR_FLEX_TOKEN or IBKR_FLEX_QUERY_ID'
    const prev = await readCache()
    const env: CacheEnvelope = {
      ok: Boolean(prev?.data),
      data: prev?.data,
      error: err,
      cachedAt: prev?.cachedAt ?? null,
    }
    await writeCache(env)
    return env
  }

  const pollMs = Math.max(2000, Number(process.env.IBKR_GETSTATEMENT_WAIT_MS ?? 5000))

  try {
    const data = await loadIbkrFlexPortfolio(token, queryId, {
      pollMs,
      flexBaseUrl: FLEX_BASE,
    })
    const env: CacheEnvelope = {
      ok: true,
      data,
      error: null,
      cachedAt: new Date().toISOString(),
    }
    await writeCache(env)
    console.log('[ibkr] cache updated', env.cachedAt)
    return env
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[ibkr] refresh failed', msg)
    const prev = await readCache()
    const env: CacheEnvelope = {
      ok: Boolean(prev?.data),
      data: prev?.data,
      error: msg,
      cachedAt: prev?.cachedAt ?? null,
    }
    await writeCache(env)
    return env
  }
}

async function refreshLocked(): Promise<CacheEnvelope> {
  if (refreshInFlight) {
    const cur = await readCache()
    return cur ?? { ok: false, error: 'Refresh in progress', cachedAt: null }
  }
  refreshInFlight = true
  try {
    return await refreshFromIbkr()
  } finally {
    refreshInFlight = false
  }
}

function startPoller(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    void refreshLocked()
  }, POLL_MS)
  console.log(`[poll] every ${POLL_MS}ms`)
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    const r = await getRedis()
    const pong = await r.ping()
    let budgetDb: 'ok' | 'off' | 'error' = 'off'
    if (isBudgetDbConfigured()) {
      try {
        await pingBudgetDb()
        budgetDb = 'ok'
      } catch {
        budgetDb = 'error'
      }
    }
    res.json({ ok: true, redis: pong, budgetDb })
  } catch (e) {
    res.status(503).json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
})

app.get('/api/budget/:userId', async (req, res) => {
  if (!isBudgetDbConfigured()) {
    res.status(503).json({ ok: false, error: 'DATABASE_URL not configured' })
    return
  }
  try {
    const userId = decodeURIComponent(req.params.userId ?? '')
    const row = await readBudgetPayload(userId)
    if (!row) {
      res.status(404).json({ ok: false, error: 'No saved budget' })
      return
    }
    res.json({ ok: true, data: row.payload, updatedAt: row.updatedAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.status(400).json({ ok: false, error: msg })
  }
})

app.put('/api/budget/:userId', async (req, res) => {
  if (!isBudgetDbConfigured()) {
    res.status(503).json({ ok: false, error: 'DATABASE_URL not configured' })
    return
  }
  try {
    const userId = decodeURIComponent(req.params.userId ?? '')
    const updatedAt = await writeBudgetPayload(userId, req.body)
    res.json({ ok: true, updatedAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.status(400).json({ ok: false, error: msg })
  }
})

app.get('/api/portfolio', async (_req, res) => {
  const cached = await readCache()
  if (!cached) {
    res.json({
      ok: false,
      error: 'No cache yet — server is fetching IBKR Flex and writing Redis; retry shortly',
      cachedAt: null,
    })
    return
  }
  res.json(cached)
})

app.post('/api/portfolio/sync', async (_req, res) => {
  const env = await refreshLocked()
  res.json(env)
})

async function main(): Promise<void> {
  await getRedis()
  if (isBudgetDbConfigured()) {
    try {
      await ensureBudgetTable()
      console.log('[budget-pg] schema ready')
    } catch (e) {
      console.error('[budget-pg] schema init failed', e instanceof Error ? e.message : e)
    }
  } else {
    console.log('[budget-pg] DATABASE_URL not set — budget cloud API disabled')
  }
  await refreshLocked()
  startPoller()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[portfolio-api] listening on 0.0.0.0:${PORT}`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
