import type { EmergencyFundPlannerInput, EmergencyFundPlannerOutput } from './finance/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function planEmergencyFund(input: EmergencyFundPlannerInput): EmergencyFundPlannerOutput {
  const monthlyExpenses = Math.max(0, input.monthlyExpenses)
  const currentEmergencyFund = Math.max(0, input.currentEmergencyFund)

  const incomeType = input.incomeType
  const defaultTargetMonths = incomeType === 'freelance' ? 8 : 4
  const targetMonths = input.targetMonths != null ? clamp(input.targetMonths, 0, 36) : defaultTargetMonths

  const targetAmount = round2(monthlyExpenses * targetMonths)

  const currentCoverageMonths =
    monthlyExpenses > 0 ? round2(currentEmergencyFund / monthlyExpenses) : Number.POSITIVE_INFINITY
  const currentCoverageDays = currentCoverageMonths === Number.POSITIVE_INFINITY ? null : round2(currentCoverageMonths * 30)

  const monthlySavingsAvailable = Math.max(0, input.monthlySavingsAvailable ?? 0)

  if (targetAmount <= currentEmergencyFund) {
    return {
      targetMonths,
      targetAmount,
      currentCoverageMonths,
      currentCoverageDays: currentCoverageDays ?? 0,
      timeToTargetMonths: 0,
      timeToTargetDays: 0,
    }
  }

  if (monthlySavingsAvailable <= 0 || monthlyExpenses <= 0) {
    return {
      targetMonths,
      targetAmount,
      currentCoverageMonths,
      currentCoverageDays: currentCoverageDays ?? 0,
      timeToTargetMonths: null,
      timeToTargetDays: null,
    }
  }

  const remaining = targetAmount - currentEmergencyFund
  const timeToTargetMonths = remaining / monthlySavingsAvailable
  const timeToTargetDays = timeToTargetMonths * 30

  return {
    targetMonths,
    targetAmount,
    currentCoverageMonths,
    currentCoverageDays: currentCoverageDays ?? 0,
    timeToTargetMonths: round2(timeToTargetMonths),
    timeToTargetDays: round2(timeToTargetDays),
  }
}

