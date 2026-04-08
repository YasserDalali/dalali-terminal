export type IncomeType = 'fixed' | 'freelance'

export type StabilityLabel = 'stable' | 'unstable'

export type DebtRiskLevel = 'safe' | 'moderate' | 'risky'

export type FinanceHealthStatus = 'fragile' | 'stable' | 'strong'

export type Verdict = 'safe' | 'stretch' | 'dangerous'

export type PaymentType = 'cash' | 'installment'

export interface BudgetCategoryInput {
  name: string
  amountMonthly: number
  kind: 'fixed' | 'variable'
  // Optional: if the category should be treated as "need" rather than default.
  expenseType?: 'needs' | 'wants'
}

export interface BudgetBuilderInput {
  incomeMonthly: number
  // Monthly totals for quickly building a baseline.
  fixedExpensesMonthly: number
  variableCategories?: BudgetCategoryInput[]
  incomeType: IncomeType
  // Optional override: user-selected strategy split (e.g. 50/30/20).
  budgetSplitTemplate?: {
    needsPct: number
    wantsPct: number
    savingsPct: number
  }
}

export interface BudgetSplit {
  needsPct: number
  wantsPct: number
  savingsPct: number
  needsAmount: number
  wantsAmount: number
  savingsAmount: number
}

export interface BudgetBuilderOutput {
  split: BudgetSplit
  fixedExpenses: number
  variableWantsTotal: number
  variableCategoryBudgets?: { name: string; suggestedAmount: number }[]
  warnings: string[]
}

export interface EmergencyFundPlannerInput {
  monthlyExpenses: number
  incomeType: IncomeType
  currentEmergencyFund: number
  monthlySavingsAvailable?: number
  // Optional override. If omitted, service uses rule-based defaults.
  targetMonths?: number
}

export interface EmergencyFundPlannerOutput {
  targetMonths: number
  targetAmount: number
  currentCoverageMonths: number
  currentCoverageDays: number
  timeToTargetMonths: number | null
  timeToTargetDays: number | null
}

export interface DebtCapacityInput {
  monthlyIncome: number
  monthlyDebtPayment: number
  incomeType: IncomeType
}

export interface DebtCapacityOutput {
  safeMonthlyDebtLimit: number
  debtRatio: number
  riskLevel: DebtRiskLevel
}

export interface AffordabilityInput {
  incomeMonthly: number
  monthlyExpenses: number
  monthlyDebtPayment: number
  incomeType: IncomeType
  // Current emergency fund (amount available as fallback).
  emergencyFund: number
  // Purchase inputs.
  purchasePrice: number
  paymentType: PaymentType
  installmentMonths?: number
  // Optional: if payment is installment, allow cash-impact to be modeled as a down payment.
  downPayment?: number
}

export interface AffordabilityOutput {
  verdict: Verdict
  explanation: string
  monthlyPurchaseCost: number
  efBefore: number
  efAfter: number
}

export interface ScoringInput {
  emergencyFundMonths: number
  debtRatio: number
  savingsRate: number
  stability: StabilityLabel
}

export interface ScoringOutput {
  score: number
  status: FinanceHealthStatus
  componentScores: {
    ef: number
    debt: number
    cashFlow: number
    stability: number
  }
}

export interface RecommendationAction {
  type: 'ef' | 'debt' | 'spending' | 'income'
  message: string
}

export interface RecommendationOutput {
  top3: RecommendationAction[]
}

export interface IncomeSmoothingInput {
  incomeType: IncomeType
  lastNMonthlyIncomes: number[] // length 3-6 expected for MVP
}

export interface IncomeSmoothingOutput {
  usableMonthlyIncome: number
}

export type RiskScenarioType = 'income_drop' | 'new_debt' | 'big_purchase'

export interface RiskSimulatorInput {
  monthlyIncome: number
  monthlyExpenses: number
  monthlyDebtPayment: number
  currentEmergencyFund: number
  incomeDropPct: number
  durationMonths: number
  scenario: RiskScenarioType
  // scenario-specific:
  newDebtMonthlyPayment?: number
  bigPurchasePrice?: number
  bigPurchasePaymentType?: PaymentType
  bigPurchaseInstallmentMonths?: number
}

export interface RiskSimulatorOutput {
  daysUntilBroke: number
  efDepletionMonths: number | null
}

export interface FinanceProfileInput {
  incomeType: IncomeType
  incomeMonthly: number
  monthlyExpenses: number
  currentEmergencyFund: number
  monthlyDebtPayment: number
  debtTotalAmount?: number
}

