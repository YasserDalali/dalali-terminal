import type { RiskSimulatorInput, RiskSimulatorOutput, PaymentType, RiskScenarioType } from './finance/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function monthlyCostForPayment(price: number, months: number) {
  const m = months > 0 ? months : 12
  return price / m
}

function scenarioAdjustedInputs(input: RiskSimulatorInput) {
  const monthlyIncomeBase = Math.max(0, input.monthlyIncome)
  const monthlyExpenses = Math.max(0, input.monthlyExpenses)
  const monthlyDebtPaymentBase = Math.max(0, input.monthlyDebtPayment)

  let monthlyIncome = monthlyIncomeBase
  let monthlyDebtPayment = monthlyDebtPaymentBase

  if (input.scenario === 'income_drop') {
    const drop = clamp(input.incomeDropPct, 0, 95) / 100
    monthlyIncome = monthlyIncomeBase * (1 - drop)
  }

  if (input.scenario === 'new_debt') {
    monthlyDebtPayment = monthlyDebtPaymentBase + Math.max(0, input.newDebtMonthlyPayment ?? 0)
  }

  return { monthlyIncome, monthlyExpenses, monthlyDebtPayment }
}

function bigPurchaseMonthlyCost(input: RiskSimulatorInput) {
  const price = Math.max(0, input.bigPurchasePrice ?? 0)
  const paymentType: PaymentType = input.bigPurchasePaymentType ?? 'cash'
  if (paymentType === 'cash') return 0
  const months = input.bigPurchaseInstallmentMonths ?? input.durationMonths
  return monthlyCostForPayment(price, months)
}

function bigPurchaseUpfrontDeficit(input: RiskSimulatorInput) {
  const price = Math.max(0, input.bigPurchasePrice ?? 0)
  const paymentType: PaymentType = input.bigPurchasePaymentType ?? 'cash'
  if (paymentType === 'cash') return price
  const downPayment = 0
  return downPayment
}

function simulateForMonths(args: {
  startingEf: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyDebtPayment: number
  extraMonthlyCost: number
  extraMonths: number
  durationMonths: number
}) {
  const efStart = Math.max(0, args.startingEf)
  const duration = Math.max(0, Math.floor(args.durationMonths))
  const extraMonths = Math.max(0, Math.floor(args.extraMonths))

  if (efStart <= 0) {
    return { monthsUntilBroke: 0, efDepletionMonths: 0 }
  }

  let ef = efStart
  for (let m = 0; m < duration; m += 1) {
    const activeExtra = m < extraMonths ? args.extraMonthlyCost : 0
    const net = args.monthlyIncome - args.monthlyExpenses - args.monthlyDebtPayment - activeExtra

    if (net < 0) {
      ef -= -net
    } else {
      // Assumption: positive cash flow doesn't materially increase "emergency fund" in the simulation,
      // but delays depletion. We keep EF unchanged for simplicity.
    }

    if (ef <= 0) {
      return { monthsUntilBroke: m + 1, efDepletionMonths: m + 1 }
    }
  }

  return { monthsUntilBroke: duration, efDepletionMonths: null as number | null }
}

export function runRiskSimulation(input: RiskSimulatorInput): RiskSimulatorOutput {
  const { monthlyIncome, monthlyExpenses, monthlyDebtPayment } = scenarioAdjustedInputs(input)
  const durationMonths = Math.max(0, Math.floor(input.durationMonths))

  const startingEf = Math.max(0, input.currentEmergencyFund)

  const scenario: RiskScenarioType = input.scenario

  let extraMonthlyCost = 0
  let extraMonths = 0
  let upfrontEfReduction = 0

  if (scenario === 'big_purchase') {
    upfrontEfReduction = bigPurchaseUpfrontDeficit(input)
    const monthlyCost = bigPurchaseMonthlyCost(input)
    if (monthlyCost > 0) {
      extraMonthlyCost = monthlyCost
      extraMonths = durationMonths // assume scenario active within the horizon
    } else {
      extraMonthlyCost = 0
      extraMonths = 0
    }
  } else {
    extraMonthlyCost = 0
    extraMonths = 0
    upfrontEfReduction = 0
  }

  // Apply immediate EF reduction (cash purchase).
  const efAfterUpfront = Math.max(0, startingEf - upfrontEfReduction)

  const sim = simulateForMonths({
    startingEf: efAfterUpfront,
    monthlyIncome,
    monthlyExpenses,
    monthlyDebtPayment,
    extraMonthlyCost,
    extraMonths,
    durationMonths,
  })

  // If EF survived the horizon, we indicate "not broken yet" by returning horizon days.
  // This keeps the UI simple without Infinity handling.
  const daysUntilBroke = sim.efDepletionMonths == null ? durationMonths * 30 : sim.monthsUntilBroke * 30

  return {
    daysUntilBroke,
    efDepletionMonths: sim.efDepletionMonths,
  }
}

