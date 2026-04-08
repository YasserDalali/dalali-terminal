import type { RecommendationOutput, RecommendationAction, StabilityLabel } from './finance/types'

function makeAction(type: RecommendationAction['type'], message: string): RecommendationAction {
  return { type, message }
}

export function computeNextActions(args: {
  emergencyFundMonths: number
  debtRatio: number
  savingsRate: number
  stability?: StabilityLabel
}): RecommendationOutput {
  const efMonths = Math.max(0, args.emergencyFundMonths)
  const debtRatio = Math.max(0, args.debtRatio)
  const savingsRate = Math.max(0, args.savingsRate)

  const actions: RecommendationAction[] = []

  // Spec rules.
  if (efMonths < 2) {
    actions.push(
      makeAction('ef', `Build emergency fund: target at least 2 months of expenses (currently ${efMonths.toFixed(1)} months).`),
    )
  }

  if (debtRatio > 0.35) {
    actions.push(
      makeAction('debt', `Debt is heavy (${(debtRatio * 100).toFixed(1)}% of income). Prioritize reducing monthly payments.`),
    )
  }

  if (savingsRate < 0.1) {
    actions.push(
      makeAction('spending', `Savings rate is below 10% (${(savingsRate * 100).toFixed(1)}%). Trim discretionary spend to free cash.`),
    )
  }

  // If nothing triggered, add a gentle default (still top 3).
  if (!actions.length) {
    actions.push(makeAction('income', 'Maintain your plan: keep tracking expenses and automate savings.'))
  }

  // Limit to top 3 only.
  const top3 = actions.slice(0, 3)
  return { top3 }
}

