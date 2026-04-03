import pg from 'pg'

let pool: pg.Pool | null = null
let cachedTableName: string | null = null

const DEFAULT_TABLE = 'dalali_budget_state'
const DEFAULT_POOL_MAX = 5
const DEFAULT_IDLE_MS = 30_000
const DEFAULT_CONN_MS = 15_000
const DEFAULT_USER_ID_MIN_LEN = 8
const DEFAULT_USER_ID_MAX_LEN = 128

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function resolveBudgetTableName(): string {
  const t = process.env.BUDGET_TABLE_NAME?.trim()
  if (t && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
    return t
  }
  return DEFAULT_TABLE
}

function userIdLengthBounds(): { min: number; max: number } {
  const min = parsePositiveInt(process.env.BUDGET_USER_ID_MIN_LEN, DEFAULT_USER_ID_MIN_LEN)
  const max = parsePositiveInt(process.env.BUDGET_USER_ID_MAX_LEN, DEFAULT_USER_ID_MAX_LEN)
  if (max < min || min < 1 || max > 512) {
    return { min: DEFAULT_USER_ID_MIN_LEN, max: DEFAULT_USER_ID_MAX_LEN }
  }
  return { min, max }
}

function budgetTable(): string {
  if (!cachedTableName) {
    cachedTableName = resolveBudgetTableName()
  }
  return cachedTableName
}

export function isBudgetDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

function getPool(): pg.Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  pool = new pg.Pool({
    connectionString,
    max: parsePositiveInt(process.env.BUDGET_PG_POOL_MAX, DEFAULT_POOL_MAX),
    idleTimeoutMillis: parsePositiveInt(process.env.BUDGET_PG_IDLE_MS, DEFAULT_IDLE_MS),
    connectionTimeoutMillis: parsePositiveInt(process.env.BUDGET_PG_CONN_MS, DEFAULT_CONN_MS),
  })
  pool.on('error', (err) => console.error('[budget-pg]', err))
  return pool
}

export async function pingBudgetDb(): Promise<boolean> {
  if (!isBudgetDbConfigured()) return false
  const p = getPool()
  await p.query('SELECT 1')
  return true
}

export async function ensureBudgetTable(): Promise<void> {
  if (!isBudgetDbConfigured()) return
  const p = getPool()
  const table = budgetTable()
  const { min, max } = userIdLengthBounds()
  await p.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      user_id TEXT PRIMARY KEY CHECK (char_length(user_id) >= ${min} AND char_length(user_id) <= ${max}),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

function assertUserId(userId: string): void {
  const { min, max } = userIdLengthBounds()
  const pattern = new RegExp(`^[a-zA-Z0-9_-]{${min},${max}}$`)
  if (!pattern.test(userId)) {
    throw new Error('Invalid user id')
  }
}

export async function readBudgetPayload(userId: string): Promise<{ payload: unknown; updatedAt: string } | null> {
  assertUserId(userId)
  const p = getPool()
  const table = budgetTable()
  const r = await p.query<{ payload: unknown; updated_at: Date }>(
    `SELECT payload, updated_at FROM ${table} WHERE user_id = $1`,
    [userId],
  )
  const row = r.rows[0]
  if (!row) return null
  return {
    payload: row.payload,
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function writeBudgetPayload(userId: string, payload: unknown): Promise<string> {
  assertUserId(userId)
  const p = getPool()
  const table = budgetTable()
  const r = await p.query<{ updated_at: Date }>(
    `INSERT INTO ${table} (user_id, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
     RETURNING updated_at`,
    [userId, JSON.stringify(payload)],
  )
  return r.rows[0]!.updated_at.toISOString()
}

export async function closeBudgetPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    cachedTableName = null
  }
}
