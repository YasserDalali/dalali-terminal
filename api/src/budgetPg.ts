import pg from 'pg'

const TABLE = 'dalali_budget_state'

let pool: pg.Pool | null = null

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
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
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
  await p.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      user_id TEXT PRIMARY KEY CHECK (char_length(user_id) >= 8 AND char_length(user_id) <= 128),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

function assertUserId(userId: string): void {
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(userId)) {
    throw new Error('Invalid user id')
  }
}

export async function readBudgetPayload(userId: string): Promise<{ payload: unknown; updatedAt: string } | null> {
  assertUserId(userId)
  const p = getPool()
  const r = await p.query<{ payload: unknown; updated_at: Date }>(
    `SELECT payload, updated_at FROM ${TABLE} WHERE user_id = $1`,
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
  const r = await p.query<{ updated_at: Date }>(
    `INSERT INTO ${TABLE} (user_id, payload, updated_at)
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
  }
}
