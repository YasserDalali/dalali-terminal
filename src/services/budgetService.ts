import type {
  BudgetBuilderInput,
  BudgetBuilderOutput,
  BudgetCategoryInput,
  BudgetSplit,
} from './finance/types'
import type { IncomeType } from './finance/types'

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function normalizeSplitPct(split: { needsPct: number; wantsPct: number; savingsPct: number }) {
  const needsPct = Math.max(0, split.needsPct)
  const wantsPct = Math.max(0, split.wantsPct)
  const savingsPct = Math.max(0, split.savingsPct)
  const sum = needsPct + wantsPct + savingsPct
  if (sum <= 0) return { needsPct: 55, wantsPct: 25, savingsPct: 20 }

  const scale = 100 / sum
  const scaled = {
    needsPct: needsPct * scale,
    wantsPct: wantsPct * scale,
    savingsPct: savingsPct * scale,
  }

  // Round to avoid floating drift; adjust savings to keep sum exactly 100.
  const needsR = round2(scaled.needsPct)
  const wantsR = round2(scaled.wantsPct)
  const savingsR = round2(100 - needsR - wantsR)
  return { needsPct: needsR, wantsPct: wantsR, savingsPct: savingsR }
}

function buildDefaultSplitPct(incomeType: IncomeType) {
  // Defaults per spec.
  const base = incomeType === 'freelance' ? { needsPct: 55, wantsPct: 20, savingsPct: 25 } : { needsPct: 55, wantsPct: 25, savingsPct: 20 }
  return normalizeSplitPct(base)
}

function sumVariableWants(categories: BudgetCategoryInput[] | undefined) {
  if (!categories?.length) return { total: 0, budgets: [] as BudgetBuilderOutput['variableCategoryBudgets'] }
  const onlyVariable = categories.filter((c) => c.kind === 'variable')
  const total = onlyVariable.reduce((acc, c) => acc + (Number.isFinite(c.amountMonthly) ? c.amountMonthly : 0), 0)
  return { total, budgets: onlyVariable.map((c) => ({ name: c.name, suggestedAmount: 0 })) }
}

export function buildBudgetBuilder(input: BudgetBuilderInput): BudgetBuilderOutput {
  const income = Math.max(0, input.incomeMonthly)
  const splitPct = normalizeSplitPct(
    input.budgetSplitTemplate ?? buildDefaultSplitPct(input.incomeType),
  )

  const needsAmount = (income * splitPct.needsPct) / 100
  const wantsAmount = (income * splitPct.wantsPct) / 100
  const savingsAmount = (income * splitPct.savingsPct) / 100

  const split: BudgetSplit = {
    ...splitPct,
    needsAmount: round2(needsAmount),
    wantsAmount: round2(wantsAmount),
    savingsAmount: round2(savingsAmount),
  }

  const fixedExpenses = Math.max(0, input.fixedExpensesMonthly)

  const { total: variableWantsTotal } = sumVariableWants(input.variableCategories)

  const warnings: string[] = []

  const plannedNeeds = fixedExpenses
  if (plannedNeeds > needsAmount) {
    warnings.push(`fixed expenses exceed needs (${round2(plannedNeeds)} > ${round2(needsAmount)})`)
  }

  const plannedWants = variableWantsTotal
  if (plannedWants > wantsAmount) {
    warnings.push(`variable wants exceed wants bucket (${round2(plannedWants)} > ${round2(wantsAmount)})`)
  }

  const plannedTotalExpenses = plannedNeeds + plannedWants
  if (plannedTotalExpenses > needsAmount + wantsAmount) {
    warnings.push('overall spending exceeds needs+wants split')
  }

  // If savings is impossible with current spending/debt, we warn (but still compute a split).
  const actualSavings = income - plannedTotalExpenses
  if (income > 0) {
    const actualSavingsRate = actualSavings / income
    if (actualSavingsRate + 1e-9 < split.savingsPct / 100) {
      warnings.push(`savings target not met (actual ${(actualSavingsRate * 100).toFixed(1)}%)`)
    }
    // If actual savings is negative, we warn strongly.
    if (actualSavings < 0) warnings.push('overspending: spending exceeds income')
  }

  // Allocate variable categories proportionally across the wants bucket.
  let variableCategoryBudgets: BudgetBuilderOutput['variableCategoryBudgets'] = undefined
  if (input.variableCategories?.length) {
    const variableCats = input.variableCategories.filter((c) => c.kind === 'variable')
    const total = variableCats.reduce((acc, c) => acc + Math.max(0, c.amountMonthly), 0)
    if (total > 0) {
      variableCategoryBudgets = variableCats.map((c) => ({
        name: c.name,
        suggestedAmount: round2((wantsAmount * Math.max(0, c.amountMonthly)) / total),
      }))
    } else {
      // No meaningful amounts: evenly split.
      const each = variableCats.length ? wantsAmount / variableCats.length : 0
      variableCategoryBudgets = variableCats.map((c) => ({
        name: c.name,
        suggestedAmount: round2(each),
      }))
    }
  }

  return {
    split,
    fixedExpenses,
    variableWantsTotal: round2(variableWantsTotal),
    variableCategoryBudgets,
    warnings,
  }
}

