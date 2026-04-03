import type { DebtCapacityInput, DebtCapacityOutput, DebtRiskLevel, IncomeType } from './finance/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function debtRiskLevel(debtRatio: number): DebtRiskLevel {
  if (debtRatio < 0.25) return 'safe'
  if (debtRatio <= 0.35) return 'moderate'
  return 'risky'
}

function safeDebtPct(incomeType: IncomeType) {
  // Spec: safe debt payment 30–40% but adjust down if freelancer.
  // Using conservative MVP defaults.
  return incomeType === 'freelance' ? 0.3 : 0.35
}

export function computeDebtCapacity(input: DebtCapacityInput): DebtCapacityOutput {
  const monthlyIncome = Math.max(0, input.monthlyIncome)
  const monthlyDebtPayment = Math.max(0, input.monthlyDebtPayment)

  const debtRatio = monthlyIncome > 0 ? monthlyDebtPayment / monthlyIncome : 0
  const ratioClamped = clamp(debtRatio, 0, 1)

  const pct = safeDebtPct(input.incomeType)
  const safeMonthlyDebtLimit = monthlyIncome * pct

  const riskLevel = debtRiskLevel(ratioClamped)

  return {
    safeMonthlyDebtLimit: Number.isFinite(safeMonthlyDebtLimit) ? safeMonthlyDebtLimit : 0,
    debtRatio: Number.isFinite(debtRatio) ? debtRatio : 0,
    riskLevel,
  }
}

