import type { FinanceProfileInput, FinanceHealthStatus, IncomeType } from './finance/types'
import type { BudgetBuilderOutput } from './finance/types'
import type { EmergencyFundPlannerOutput } from './finance/types'
import type { DebtCapacityOutput } from './finance/types'
import type { RecommendationOutput } from './finance/types'

import { buildBudgetBuilder } from './budgetService'
import { planEmergencyFund } from './efService'
import { computeDebtCapacity } from './debtService'
import { computeFinancialHealthScore } from './scoringService'
import { computeNextActions } from './recommendationService'

export interface FinanceMetrics {
  month: string // YYYY-MM
  totalIncome: number
  totalExpenses: number
  savingsRate: number // 0..1
  emergencyFundMonths: number
  debtRatio: number // monthlyDebt / monthlyIncome
  cashFlow: number // monthlyIncome - expenses - debtPayment

  healthScore: number
  healthStatus: FinanceHealthStatus

  efPlanner: EmergencyFundPlannerOutput
  debtCapacity: DebtCapacityOutput
  budgetPlan: BudgetBuilderOutput
  recommendations: RecommendationOutput

  createdAt: number // epoch ms
}

const METRICS_KEY = 'bb_finance_demo_metrics_v1'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function monthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function computeSavingsRate(income: number, cashFlow: number) {
  if (income <= 0) return 0
  const r = cashFlow / income
  return clamp(r, 0, 1)
}

function computeStability(incomeType: IncomeType): 'stable' | 'unstable' {
  return incomeType === 'fixed' ? 'stable' : 'unstable'
}

export function computeFinanceMetrics(profile: FinanceProfileInput): FinanceMetrics {
  const incomeMonthly = Math.max(0, profile.incomeMonthly)
  const monthlyExpenses = Math.max(0, profile.monthlyExpenses)
  const monthlyDebtPayment = Math.max(0, profile.monthlyDebtPayment)

  const cashFlow = incomeMonthly - monthlyExpenses - monthlyDebtPayment
  const savingsRate = computeSavingsRate(incomeMonthly, cashFlow)

  const debtRatio = incomeMonthly > 0 ? monthlyDebtPayment / incomeMonthly : 0
  const emergencyFundMonths = monthlyExpenses > 0 ? profile.currentEmergencyFund / monthlyExpenses : 0

  const stability = computeStability(profile.incomeType)

  const health = computeFinancialHealthScore({
    emergencyFundMonths,
    debtRatio,
    savingsRate,
    stability,
  })

  const recommendations = computeNextActions({
    emergencyFundMonths,
    debtRatio,
    savingsRate,
    stability,
  })

  const efPlanner = planEmergencyFund({
    monthlyExpenses,
    incomeType: profile.incomeType,
    currentEmergencyFund: profile.currentEmergencyFund,
    monthlySavingsAvailable: Math.max(0, cashFlow),
  })

  const debtCapacity = computeDebtCapacity({
    monthlyIncome: incomeMonthly,
    monthlyDebtPayment,
    incomeType: profile.incomeType,
  })

  const budgetPlan = buildBudgetBuilder({
    incomeMonthly,
    fixedExpensesMonthly: monthlyExpenses,
    variableCategories: [],
    incomeType: profile.incomeType,
  })

  return {
    month: monthKey(new Date()),
    totalIncome: incomeMonthly,
    totalExpenses: monthlyExpenses,
    savingsRate,
    emergencyFundMonths,
    debtRatio,
    cashFlow,

    healthScore: health.score,
    healthStatus: health.status,

    efPlanner,
    debtCapacity,
    budgetPlan,
    recommendations,

    createdAt: Date.now(),
  }
}

export function computeAndCacheFinanceMetrics(profile: FinanceProfileInput): FinanceMetrics {
  const metrics = computeFinanceMetrics(profile)
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
  return metrics
}

export function readCachedFinanceMetrics(): FinanceMetrics | null {
  try {
    const raw = localStorage.getItem(METRICS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FinanceMetrics
    if (!parsed || typeof parsed.healthScore !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

