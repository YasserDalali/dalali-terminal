import type { FinanceMetrics } from '../metricsService'
import type { FinanceProfileInput } from '../finance/types'
import type { IncomeType } from '../finance/types'

import { computeAndCacheFinanceMetrics, readCachedFinanceMetrics } from '../metricsService'

const PROFILE_KEY = 'bb_finance_demo_profile_v1'

export function getDefaultDemoProfile(): FinanceProfileInput {
  return {
    incomeType: 'fixed',
    incomeMonthly: 5000,
    monthlyExpenses: 3000,
    currentEmergencyFund: 6000,
    monthlyDebtPayment: 250,
    debtTotalAmount: 12000,
  }
}

export function loadDemoProfile(): FinanceProfileInput | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FinanceProfileInput
    if (!parsed || typeof parsed.incomeMonthly !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function saveDemoProfile(profile: FinanceProfileInput) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // ignore
  }
}

export function clearDemoFinanceData() {
  try {
    localStorage.removeItem(PROFILE_KEY)
    // metricsService caches its own key; we leave that alone for now.
  } catch {
    // ignore
  }
}

export function getOrComputeDemoMetrics(profile?: FinanceProfileInput | null): FinanceMetrics {
  const p = profile ?? loadDemoProfile() ?? getDefaultDemoProfile()
  return computeAndCacheFinanceMetrics(p)
}

export function loadCachedDemoMetrics(): FinanceMetrics | null {
  return readCachedFinanceMetrics()
}

export function demoIncomeTypeLabel(incomeType: IncomeType) {
  return incomeType === 'fixed' ? 'stable' : 'unstable'
}

