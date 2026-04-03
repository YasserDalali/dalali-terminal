import { useMemo, useState } from 'react'
import type { FinanceProfileInput, IncomeType } from '../../../services/finance/types'
import { computeFinanceMetrics } from '../../../services/metricsService'
import { canAffordThis } from '../../../services/affordabilityService'
import { buildBudgetBuilder } from '../../../services/budgetService'
import { planEmergencyFund } from '../../../services/efService'
import { computeDebtCapacity } from '../../../services/debtService'
import { runRiskSimulation } from '../../../services/riskSimulatorService'
import { smoothIncome } from '../../../services/incomeSmoothingService'
import { getDefaultDemoProfile, loadDemoProfile, saveDemoProfile } from '../../../services/storage/localStorageStore'
import type { PaymentType } from '../../../services/finance/types'
import type { RiskSimulatorInput, RiskScenarioType } from '../../../services/finance/types'

type OnboardingStep = 1 | 2

const ONBOARDED_KEY = 'bb_finance_onboarded_v1'

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function parseMoney(s: string) {
  const v = Number(s)
  if (!Number.isFinite(v)) return 0
  return v
}

function Pill({ tone, children }: { tone: 'up' | 'dn' | 'warn'; children: string }) {
  return (
    <span className={`bb-pill ${tone === 'up' ? 'bb-pill--up' : tone === 'dn' ? 'bb-pill--dn' : ''}`}>
      <span className="mono">{children}</span>
    </span>
  )
}

function IncomeTypeSelect(props: { value: IncomeType; onChange: (v: IncomeType) => void }) {
  return (
    <label className="bb-fin-field">
      <span className="bb-fin-label">income type</span>
      <select className="bb-sel" value={props.value} onChange={(e) => props.onChange(e.target.value as IncomeType)}>
        <option value="fixed">stable / fixed</option>
        <option value="freelance">freelance / unstable</option>
      </select>
    </label>
  )
}

function NumberField(props: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="bb-fin-field">
      <span className="bb-fin-label">{props.label}</span>
      <input
        className="bb-fin-input"
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(parseMoney(e.target.value))}
        inputMode="decimal"
      />
    </label>
  )
}

export function AdvisorPage() {
  const [step, setStep] = useState<OnboardingStep>(() => {
    const onboarded = typeof window !== 'undefined' && window.localStorage.getItem(ONBOARDED_KEY)
    return onboarded ? 2 : 1
  })

  const [profile, setProfile] = useState<FinanceProfileInput>(() => loadDemoProfile() ?? getDefaultDemoProfile())
  const metrics = useMemo(() => computeFinanceMetrics(profile), [profile])

  // Tools state
  const [fixedExpensesForTools, setFixedExpensesForTools] = useState(profile.monthlyExpenses)
  const [variableWantsForTools, setVariableWantsForTools] = useState(0)

  const [purchasePrice, setPurchasePrice] = useState(2000)
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [installmentMonths, setInstallmentMonths] = useState(12)

  const [efTargetMonths, setEfTargetMonths] = useState<number | null>(null)

  const [riskIncomeDropPct, setRiskIncomeDropPct] = useState(25)
  const [riskDurationMonths, setRiskDurationMonths] = useState(6)
  const [riskNewDebtMonthly, setRiskNewDebtMonthly] = useState(300)
  // In this MVP advisor page we only expose income_drop + new_debt.

  const incomeStabilityLabel = useMemo(() => (profile.incomeType === 'fixed' ? 'stable' : 'unstable'), [profile.incomeType])

  const healthTone = metrics.healthStatus === 'strong' ? 'up' : metrics.healthStatus === 'stable' ? 'warn' : 'dn'

  const budgetToolOutput = useMemo(() => {
    const input = {
      incomeMonthly: profile.incomeMonthly,
      fixedExpensesMonthly: fixedExpensesForTools,
      variableCategories:
        variableWantsForTools > 0
          ? [
              {
                name: 'variable wants',
                amountMonthly: variableWantsForTools,
                kind: 'variable' as const,
                expenseType: 'wants' as const,
              },
            ]
          : undefined,
      incomeType: profile.incomeType,
    }

    return buildBudgetBuilder(input)
  }, [profile.incomeMonthly, profile.incomeType, fixedExpensesForTools, variableWantsForTools])

  const purchaseToolOutput = useMemo(() => {
    return canAffordThis({
      incomeMonthly: profile.incomeMonthly,
      monthlyExpenses: fixedExpensesForTools,
      monthlyDebtPayment: profile.monthlyDebtPayment,
      incomeType: profile.incomeType,
      emergencyFund: profile.currentEmergencyFund,
      purchasePrice,
      paymentType,
      installmentMonths,
    })
  }, [profile, fixedExpensesForTools, purchasePrice, paymentType, installmentMonths])

  const efToolOutput = useMemo(() => {
    const monthlySavings = Math.max(0, profile.incomeMonthly - profile.monthlyExpenses - profile.monthlyDebtPayment)
    return planEmergencyFund({
      monthlyExpenses: profile.monthlyExpenses,
      incomeType: profile.incomeType,
      currentEmergencyFund: profile.currentEmergencyFund,
      monthlySavingsAvailable: monthlySavings,
      targetMonths: efTargetMonths ?? undefined,
    })
  }, [profile, efTargetMonths])

  const debtCapacityToolOutput = useMemo(() => {
    return computeDebtCapacity({
      monthlyIncome: profile.incomeMonthly,
      monthlyDebtPayment: profile.monthlyDebtPayment,
      incomeType: profile.incomeType,
    })
  }, [profile])

  const riskToolOutput = useMemo(() => {
    // For MVP: always run a scenario based on what the user changed in the form.
    // We keep it deterministic by mapping selection from fields.
    const scenario: RiskScenarioType = riskNewDebtMonthly > 0 ? 'new_debt' : 'income_drop'

    const input: RiskSimulatorInput = {
      monthlyIncome: profile.incomeMonthly,
      monthlyExpenses: profile.monthlyExpenses,
      monthlyDebtPayment: profile.monthlyDebtPayment,
      currentEmergencyFund: profile.currentEmergencyFund,
      incomeDropPct: riskIncomeDropPct,
      durationMonths: riskDurationMonths,
      scenario,
      newDebtMonthlyPayment: scenario === 'new_debt' ? riskNewDebtMonthly : 0,
      bigPurchasePrice: 0,
      bigPurchasePaymentType: 'cash',
      bigPurchaseInstallmentMonths: 12,
    }

    return runRiskSimulation(input)
  }, [profile, riskNewDebtMonthly, riskIncomeDropPct, riskDurationMonths])

  const freelancerSmoothingOutput = useMemo(() => {
    const lastN = [profile.incomeMonthly * 0.92, profile.incomeMonthly * 0.98, profile.incomeMonthly * 1.05]
    return smoothIncome({ incomeType: profile.incomeType, lastNMonthlyIncomes: lastN })
  }, [profile.incomeType, profile.incomeMonthly])

  const onSaveProfile = () => {
    saveDemoProfile(profile)
    window.localStorage.setItem(ONBOARDED_KEY, '1')
    setStep(2)
  }

  return (
    <div className="bb-workspace">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">AI</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">ADVISOR</span>
        <span className="bb-workspace__fill" />
        <button
          type="button"
          className="bb-btn"
          onClick={() => {
            window.localStorage.removeItem(ONBOARDED_KEY)
            setStep(1)
          }}
        >
          RE-SET
        </button>
      </div>

      {step === 1 ? (
        <section className="bb-win">
          <header className="bb-win__bar">
            <span className="bb-win__ttl">ONBOARDING</span>
            <span className="bb-win__meta mono">STEP 1</span>
          </header>

          <div className="bb-fin-grid">
            <IncomeTypeSelect value={profile.incomeType} onChange={(v) => setProfile((p) => ({ ...p, incomeType: v }))} />
            <NumberField label="monthly income" value={profile.incomeMonthly} onChange={(n) => setProfile((p) => ({ ...p, incomeMonthly: n }))} />
            <NumberField
              label="monthly expenses (rough ok)"
              value={profile.monthlyExpenses}
              onChange={(n) => {
                setFixedExpensesForTools(n)
                setProfile((p) => ({ ...p, monthlyExpenses: n }))
              }}
            />
            <NumberField
              label="emergency fund (current)"
              value={profile.currentEmergencyFund}
              onChange={(n) => setProfile((p) => ({ ...p, currentEmergencyFund: n }))}
            />
            <NumberField
              label="debt monthly payments"
              value={profile.monthlyDebtPayment}
              onChange={(n) => setProfile((p) => ({ ...p, monthlyDebtPayment: n }))}
            />
            <NumberField
              label="debt total (optional)"
              value={profile.debtTotalAmount ?? 0}
              onChange={(n) => setProfile((p) => ({ ...p, debtTotalAmount: n }))}
            />
          </div>

          <div className="bb-fin-actions">
            <button type="button" className="bb-eq-btn bb-eq-btn--pri" onClick={onSaveProfile}>
              SAVE PROFILE
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="bb-win">
            <header className="bb-win__bar">
              <span className="bb-win__ttl">DASHBOARD</span>
              <span className="bb-win__meta mono">{metrics.month}</span>
            </header>

            <div className="bb-fin-grid bb-fin-grid--2">
              <div className="bb-fin-card">
                <div className="bb-fin-card__title">financial health score</div>
                <div className="bb-fin-card__big mono">{metrics.healthScore}</div>
                <div className="bb-fin-card__row">
                  <Pill tone={healthTone}>{metrics.healthStatus.toUpperCase()}</Pill>
                  <span className="muted mono">{incomeStabilityLabel.toUpperCase()}</span>
                </div>
              </div>

              <div className="bb-fin-card">
                <div className="bb-fin-card__title">key metrics</div>
                <div className="bb-fin-kv">
                  <div className="bb-fin-kv__row">
                    <span className="bb-fin-kv__k muted">EF</span>
                    <span className="bb-fin-kv__v mono">
                      {metrics.efPlanner.currentCoverageMonths.toFixed(1)} mo
                    </span>
                  </div>
                  <div className="bb-fin-kv__row">
                    <span className="bb-fin-kv__k muted">Debt</span>
                    <span className="bb-fin-kv__v mono">{(metrics.debtRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="bb-fin-kv__row">
                    <span className="bb-fin-kv__k muted">Cash flow</span>
                    <span className="bb-fin-kv__v mono">{metrics.cashFlow >= 0 ? '+' : ''}{formatMoney(metrics.cashFlow)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bb-fin-card bb-fin-card--wide">
              <div className="bb-fin-card__title">next actions (top {metrics.recommendations.top3.length})</div>
              <div className="bb-fin-actionsList">
                {metrics.recommendations.top3.slice(0, 3).map((a, i) => (
                  <div key={`${a.type}-${i}`} className="bb-fin-action">
                    <span className="bb-fin-action__badge mono">{String(i + 1)}</span>
                    <span className="bb-fin-action__msg">{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bb-win">
            <header className="bb-win__bar bb-win__bar--tabs">
              <span className="bb-win__ttl">TOOLS</span>
              <span className="bb-win__meta mono">ADVISOR</span>
            </header>

            <div className="bb-fin-cols">
              <div className="bb-fin-col">
                <div className="bb-fin-subttl">budget builder</div>
                <div className="bb-fin-grid bb-fin-grid--1">
                  <NumberField label="fixed expenses used for tool" value={fixedExpensesForTools} onChange={setFixedExpensesForTools} />
                  <NumberField label="variable wants (optional)" value={variableWantsForTools} onChange={setVariableWantsForTools} />
                </div>

                <div className="bb-fin-summary">
                  <div className="bb-fin-row">
                    <span className="muted">needs</span>
                    <span className="mono">{budgetToolOutput.split.needsPct}% = {formatMoney(budgetToolOutput.split.needsAmount)}</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">wants</span>
                    <span className="mono">{budgetToolOutput.split.wantsPct}% = {formatMoney(budgetToolOutput.split.wantsAmount)}</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">savings</span>
                    <span className="mono">{budgetToolOutput.split.savingsPct}% = {formatMoney(budgetToolOutput.split.savingsAmount)}</span>
                  </div>
                  {budgetToolOutput.warnings.length ? (
                    <div className="bb-fin-warnings">
                      {budgetToolOutput.warnings.map((w, idx) => (
                        <div key={idx} className="bb-fin-warning">
                          {w}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted mono bb-fin-mutedHint">no overspending warnings</div>
                  )}
                </div>
              </div>

              <div className="bb-fin-col">
                <div className="bb-fin-subttl">can i afford this?</div>
                <div className="bb-fin-grid bb-fin-grid--1">
                  <NumberField label="purchase price" value={purchasePrice} onChange={setPurchasePrice} />
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">payment type</span>
                    <select className="bb-sel" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                      <option value="cash">cash</option>
                      <option value="installment">installment</option>
                    </select>
                  </label>
                  {paymentType === 'installment' ? (
                    <NumberField label="installment months" value={installmentMonths} onChange={setInstallmentMonths} />
                  ) : null}
                </div>

                <div className="bb-fin-summary">
                  <div className="bb-fin-row">
                    <span className="muted">verdict</span>
                    <span className="mono">{purchaseToolOutput.verdict.toUpperCase()}</span>
                  </div>
                  <div className="bb-fin-mutedHint">{purchaseToolOutput.explanation}</div>
                </div>
              </div>

              <div className="bb-fin-col">
                <div className="bb-fin-subttl">ef planner + debt</div>
                <div className="bb-fin-grid bb-fin-grid--1">
                  <NumberField
                    label="ef target months (override)"
                    value={efTargetMonths ?? efToolOutput.targetMonths}
                    onChange={(n) => setEfTargetMonths(n)}
                  />
                  <div className="bb-fin-mutedHint">
                    current EF coverage: <span className="mono">{efToolOutput.currentCoverageMonths.toFixed(1)} mo</span>
                  </div>
                </div>
                <div className="bb-fin-summary">
                  <div className="bb-fin-row">
                    <span className="muted">target</span>
                    <span className="mono">{efToolOutput.targetMonths} mo = {formatMoney(efToolOutput.targetAmount)}</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">time to target</span>
                    <span className="mono">
                      {efToolOutput.timeToTargetMonths == null ? '—' : `${efToolOutput.timeToTargetMonths} mo`}
                    </span>
                  </div>

                  <div className="bb-fin-divider" />
                  <div className="bb-fin-row">
                    <span className="muted">safe debt limit</span>
                    <span className="mono">{formatMoney(debtCapacityToolOutput.safeMonthlyDebtLimit)} / mo</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">debt risk</span>
                    <span className="mono">{debtCapacityToolOutput.riskLevel.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bb-win">
            <header className="bb-win__bar">
              <span className="bb-win__ttl">RISK SIMULATOR (light)</span>
              <span className="bb-win__meta mono">MVP</span>
            </header>

            <div className="bb-fin-cols">
              <div className="bb-fin-col">
                <div className="bb-fin-subttl">income drop</div>
                <div className="bb-fin-grid bb-fin-grid--1">
                  <NumberField label="drop %" value={riskIncomeDropPct} onChange={setRiskIncomeDropPct} />
                  <NumberField label="duration months" value={riskDurationMonths} onChange={setRiskDurationMonths} />
                </div>
              </div>

              <div className="bb-fin-col">
                <div className="bb-fin-subttl">new debt (optional)</div>
                <div className="bb-fin-grid bb-fin-grid--1">
                  <NumberField label="new monthly payment" value={riskNewDebtMonthly} onChange={setRiskNewDebtMonthly} />
                </div>
              </div>
            </div>

            <div className="bb-fin-summary" style={{ marginTop: 10 }}>
              <div className="bb-fin-row">
                <span className="muted">days until broke</span>
                <span className="mono">{riskToolOutput.daysUntilBroke === riskDurationMonths * 30 ? '>= horizon' : `${Math.round(riskToolOutput.daysUntilBroke)}D`}</span>
              </div>
            </div>

            <div className="muted mono bb-fin-mutedHint" style={{ marginTop: 6 }}>
              freelancing smoothing hint (demo): usable monthly income ~{freelancerSmoothingOutput.usableMonthlyIncome.toFixed(0)}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

