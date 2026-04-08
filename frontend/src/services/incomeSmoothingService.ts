import type { IncomeSmoothingInput, IncomeSmoothingOutput } from './finance/types'

export function smoothIncome(input: IncomeSmoothingInput): IncomeSmoothingOutput {
  const incomeType = input.incomeType
  const incomes = (input.lastNMonthlyIncomes ?? []).filter((n) => Number.isFinite(n) && n > 0)

  if (incomeType !== 'freelance') {
    const avg = incomes.length ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0
    return { usableMonthlyIncome: avg }
  }

  // Spec: take last 3–6 months and compute average.
  const slice = incomes.slice(0, 6).slice(-6)
  const tail = slice.length ? slice : incomes
  const avg = tail.length ? tail.reduce((a, b) => a + b, 0) / tail.length : 0

  return { usableMonthlyIncome: avg }
}

