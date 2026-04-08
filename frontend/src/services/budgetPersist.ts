import type { IncomeType, PaymentType } from './finance/types'

export const BUDGET_SNAPSHOT_VERSION = 1 as const

export type BudgetStrategyId = 'auto' | '50/30/20' | '60/20/20' | 'lean-saver' | 'custom'

export type BudgetExpensesState = {
  housing: number
  bills: number
  insurance: number
  utilities: number
  groceries: number
  transport: number
  healthcare: number
  education: number
  entertainment: number
  shopping: number
}

export type BudgetSnapshotV1 = {
  v: typeof BUDGET_SNAPSHOT_VERSION
  incomeType: IncomeType
  incomeMonthly: number
  debtMonthlyPayment: number
  expenses: BudgetExpensesState
  strategyId: BudgetStrategyId
  customNeedsPct: number
  customWantsPct: number
  customSavingsPct: number
  last3Incomes: [number, number, number]
  purchasePrice: number
  paymentType: PaymentType
  installmentMonths: number
  efBalance: number
  efContributionMonthly: number
  efContributedToDate: number
  savingsBalance: number
  savingsContributionMonthly: number
  savingsContributedToDate: number
  investmentsBalance: number
  investmentContributionMonthly: number
  investmentContributedToDate: number
}

const STRATEGIES: BudgetStrategyId[] = ['auto', '50/30/20', '60/20/20', 'lean-saver', 'custom']

function isNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function pickExpenses(raw: unknown, fallback: BudgetExpensesState): BudgetExpensesState {
  if (!raw || typeof raw !== 'object') return fallback
  const e = raw as Record<string, unknown>
  const keys: (keyof BudgetExpensesState)[] = [
    'housing',
    'bills',
    'insurance',
    'utilities',
    'groceries',
    'transport',
    'healthcare',
    'education',
    'entertainment',
    'shopping',
  ]
  const next = { ...fallback }
  for (const k of keys) {
    if (isNum(e[k])) next[k] = e[k]
  }
  return next
}

/** Returns a partial patch to apply to React state; null if payload is unusable. */
export function parseBudgetRemotePayload(
  raw: unknown,
  expenseFallback: BudgetExpensesState,
): Partial<BudgetSnapshotV1> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== undefined && o.v !== BUDGET_SNAPSHOT_VERSION) return null

  const out: Partial<BudgetSnapshotV1> = {}

  if (o.incomeType === 'fixed' || o.incomeType === 'freelance') out.incomeType = o.incomeType
  if (isNum(o.incomeMonthly)) out.incomeMonthly = o.incomeMonthly
  if (isNum(o.debtMonthlyPayment)) out.debtMonthlyPayment = o.debtMonthlyPayment

  if ('expenses' in o) out.expenses = pickExpenses(o.expenses, expenseFallback)

  if (typeof o.strategyId === 'string' && (STRATEGIES as string[]).includes(o.strategyId)) {
    out.strategyId = o.strategyId as BudgetStrategyId
  }
  if (isNum(o.customNeedsPct)) out.customNeedsPct = o.customNeedsPct
  if (isNum(o.customWantsPct)) out.customWantsPct = o.customWantsPct
  if (isNum(o.customSavingsPct)) out.customSavingsPct = o.customSavingsPct

  if (Array.isArray(o.last3Incomes) && o.last3Incomes.length >= 3) {
    const a = o.last3Incomes.map((x) => (isNum(x) ? x : 0))
    out.last3Incomes = [a[0]!, a[1]!, a[2]!]
  }

  if (isNum(o.purchasePrice)) out.purchasePrice = o.purchasePrice
  if (o.paymentType === 'cash' || o.paymentType === 'installment') out.paymentType = o.paymentType
  if (isNum(o.installmentMonths)) out.installmentMonths = Math.max(1, Math.floor(o.installmentMonths))

  if (isNum(o.efBalance)) out.efBalance = o.efBalance
  if (isNum(o.efContributionMonthly)) out.efContributionMonthly = o.efContributionMonthly
  if (isNum(o.efContributedToDate)) out.efContributedToDate = o.efContributedToDate

  if (isNum(o.savingsBalance)) out.savingsBalance = o.savingsBalance
  if (isNum(o.savingsContributionMonthly)) out.savingsContributionMonthly = o.savingsContributionMonthly
  if (isNum(o.savingsContributedToDate)) out.savingsContributedToDate = o.savingsContributedToDate

  if (isNum(o.investmentsBalance)) out.investmentsBalance = o.investmentsBalance
  if (isNum(o.investmentContributionMonthly)) out.investmentContributionMonthly = o.investmentContributionMonthly
  if (isNum(o.investmentContributedToDate)) out.investmentContributedToDate = o.investmentContributedToDate

  return out
}

export function buildBudgetSnapshot(state: BudgetSnapshotV1): BudgetSnapshotV1 {
  return { ...state, v: BUDGET_SNAPSHOT_VERSION }
}
