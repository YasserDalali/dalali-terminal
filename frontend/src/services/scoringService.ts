import type { FinanceHealthStatus, ScoringInput, ScoringOutput, StabilityLabel } from './finance/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function statusFromScore(score: number): FinanceHealthStatus {
  if (score <= 40) return 'fragile'
  if (score <= 70) return 'stable'
  return 'strong'
}

function stabilityScore(stability: StabilityLabel) {
  // Spec: stable => 25, otherwise => 10.
  return stability === 'stable' ? 25 : 10
}

function efScore(efMonths: number) {
  const m = Math.max(0, efMonths)
  if (m >= 6) return 25
  return m * 4
}

function debtScore(debtRatio: number) {
  if (debtRatio < 0.2) return 25
  if (debtRatio < 0.35) return 15
  return 5
}

function cashFlowScore(savingsRate: number) {
  const r = clamp(savingsRate, 0, 1)
  // Spec-like rule: >20% => 25, else savingsRate*100.
  if (r >= 0.2) return 25
  return r * 100
}

export function computeFinancialHealthScore(input: ScoringInput): ScoringOutput {
  const efMonths = input.emergencyFundMonths
  const debtRatio = clamp(input.debtRatio, 0, 1)
  const savingsRate = clamp(input.savingsRate, 0, 1)
  const stability = input.stability

  const ef = efScore(efMonths)
  const debt = debtScore(debtRatio)
  const cashFlow = cashFlowScore(savingsRate)
  const stabilityPts = stabilityScore(stability)

  // Ensure total stays inside 0..100 even with floating inputs.
  const total = clamp(Math.round(ef + debt + cashFlow + stabilityPts), 0, 100)

  return {
    score: total,
    status: statusFromScore(total),
    componentScores: {
      ef: Math.round(ef),
      debt: Math.round(debt),
      cashFlow: Math.round(cashFlow),
      stability: stabilityPts,
    },
  }
}

