import type { AffordabilityInput, AffordabilityOutput, PaymentType, Verdict } from './finance/types'

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function monthlyCostForInstallment(purchasePrice: number, installmentMonths: number) {
  const m = installmentMonths > 0 ? installmentMonths : 12
  return purchasePrice / m
}

function verdictFromSignals(args: {
  incomeMonthly: number
  monthlyPurchaseCost: number
  efAfter: number
  monthlyExpenses: number
  paymentType: PaymentType
  purchasePrice: number
}) {
  const { incomeMonthly, monthlyPurchaseCost, efAfter, monthlyExpenses, paymentType, purchasePrice } = args
  const safeIncome = incomeMonthly > 0 ? incomeMonthly : 1
  const impactRatio = paymentType === 'cash' ? purchasePrice / safeIncome : monthlyPurchaseCost / safeIncome
  const efAfterMonths = monthlyExpenses > 0 ? efAfter / monthlyExpenses : Number.POSITIVE_INFINITY

  if (efAfter <= 0) return { verdict: 'dangerous' as Verdict, efAfterMonths, impactRatio }

  // Keep thresholds simple and deterministic.
  if (impactRatio <= 0.15 && efAfterMonths >= 3) {
    return { verdict: 'safe' as Verdict, efAfterMonths, impactRatio }
  }
  if (impactRatio <= 0.25 && efAfterMonths >= 1) {
    return { verdict: 'stretch' as Verdict, efAfterMonths, impactRatio }
  }
  return { verdict: 'dangerous' as Verdict, efAfterMonths, impactRatio }
}

export function canAffordThis(input: AffordabilityInput): AffordabilityOutput {
  const incomeMonthly = Math.max(0, input.incomeMonthly)
  const monthlyExpenses = Math.max(0, input.monthlyExpenses)
  const monthlyDebtPayment = Math.max(0, input.monthlyDebtPayment)
  const emergencyFund = Math.max(0, input.emergencyFund)

  const purchasePrice = Math.max(0, input.purchasePrice)
  const paymentType = input.paymentType

  const baseCashFlow = incomeMonthly - monthlyExpenses - monthlyDebtPayment

  const installmentMonths = input.installmentMonths != null ? Math.max(1, Math.floor(input.installmentMonths)) : 12
  const downPayment = input.downPayment != null ? Math.max(0, input.downPayment) : 0

  const immediateDownImpact = paymentType === 'installment' ? clamp(downPayment, 0, purchasePrice) : 0
  const financed = Math.max(0, purchasePrice - immediateDownImpact)
  const monthlyPurchaseCost = paymentType === 'cash' ? purchasePrice : monthlyCostForInstallment(financed, installmentMonths)

  let efAfter = emergencyFund

  if (paymentType === 'cash') {
    efAfter = emergencyFund - purchasePrice
  } else {
    // Reduce EF immediately by down payment, then simulate monthly deficit coverage.
    efAfter = emergencyFund - immediateDownImpact
    const monthlyNet = baseCashFlow - monthlyPurchaseCost
    if (incomeMonthly > 0 && monthlyNet < 0) {
      const deficitPerMonth = -monthlyNet
      // EF covers deficits until depleted or duration ends.
      const coveredDeficitTotal = deficitPerMonth * installmentMonths
      efAfter = efAfter - coveredDeficitTotal
    }
  }

  // Prevent weird negative zeros.
  efAfter = Math.abs(efAfter) < 1e-9 ? 0 : efAfter

  const signals = verdictFromSignals({
    incomeMonthly,
    monthlyPurchaseCost: paymentType === 'cash' ? purchasePrice : monthlyPurchaseCost,
    efAfter,
    monthlyExpenses,
    paymentType,
    purchasePrice,
  })

  const verdict = signals.verdict
  const efAfterMonths = monthlyExpenses > 0 ? efAfter / monthlyExpenses : null

  const explanationParts: string[] = []
  explanationParts.push(`impact ~${(signals.impactRatio * 100).toFixed(1)}% of monthly income`)
  if (paymentType === 'cash') {
    explanationParts.push(`ef reduction: -${round2(purchasePrice)}`)
  } else {
    explanationParts.push(`monthly cost: ${round2(monthlyPurchaseCost)} for ${installmentMonths} mo`)
    if (immediateDownImpact > 0) explanationParts.push(`down payment: -${round2(immediateDownImpact)} ef`)
  }
  if (efAfterMonths != null) explanationParts.push(`ef coverage after: ${efAfterMonths.toFixed(1)} months`)
  if (efAfter <= 0) explanationParts.push('ef would be depleted')

  const explanation = explanationParts.join('; ')

  return {
    verdict,
    explanation,
    monthlyPurchaseCost: round2(monthlyPurchaseCost),
    efBefore: round2(emergencyFund),
    efAfter: round2(efAfter),
  }
}

