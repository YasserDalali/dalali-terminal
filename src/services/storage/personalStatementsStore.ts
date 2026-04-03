export interface StatementItem {
  id: string
  name: string
  amount: number // non-negative
}

export interface PersonalStatementsInput {
  assets: StatementItem[]
  liabilities: StatementItem[]
}

const PERSONAL_STATEMENTS_KEY = 'bb_personal_statements_demo_v1'

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

export function makeStatementItemId(prefix: 'a' | 'l') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function getDefaultDemoPersonalStatements(): PersonalStatementsInput {
  return {
    assets: [{ id: 'a_cash', name: 'Cash', amount: 0 }],
    liabilities: [{ id: 'l_credit', name: 'Credit Cards', amount: 0 }],
  }
}

function sanitizeItem(v: unknown): StatementItem | null {
  if (!v || typeof v !== 'object') return null
  const obj = v as Partial<StatementItem>
  if (typeof obj.id !== 'string') return null
  const name = typeof obj.name === 'string' ? obj.name : ''
  const amount = isFiniteNumber(obj.amount) ? Math.max(0, obj.amount) : 0
  return { id: obj.id, name, amount }
}

export function loadPersonalStatements(): PersonalStatementsInput | null {
  try {
    const raw = localStorage.getItem(PERSONAL_STATEMENTS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersonalStatementsInput>
    if (!parsed || !Array.isArray(parsed.assets) || !Array.isArray(parsed.liabilities)) return null

    const assets = parsed.assets.map(sanitizeItem).filter((x): x is StatementItem => Boolean(x))
    const liabilities = parsed.liabilities.map(sanitizeItem).filter((x): x is StatementItem => Boolean(x))

    // Allow empty lists (user can start from scratch).
    return { assets, liabilities }
  } catch {
    return null
  }
}

export function savePersonalStatements(data: PersonalStatementsInput) {
  try {
    localStorage.setItem(PERSONAL_STATEMENTS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function clearPersonalStatements() {
  try {
    localStorage.removeItem(PERSONAL_STATEMENTS_KEY)
  } catch {
    // ignore
  }
}

