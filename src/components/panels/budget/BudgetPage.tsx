import { useMemo, useState } from 'react'
import type { FinanceProfileInput, IncomeType, PaymentType } from '../../../services/finance/types'
import { buildBudgetBuilder } from '../../../services/budgetService'
import { canAffordThis } from '../../../services/affordabilityService'
import { planEmergencyFund } from '../../../services/efService'
import { computeDebtCapacity } from '../../../services/debtService'
import { smoothIncome } from '../../../services/incomeSmoothingService'
import { getDefaultDemoProfile, loadDemoProfile } from '../../../services/storage/localStorageStore'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar } from 'recharts'

function parseMoney(s: string) {
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function BudgetPage() {
  const [profile] = useState<FinanceProfileInput>(() => loadDemoProfile() ?? getDefaultDemoProfile())
  const [incomeType, setIncomeType] = useState<IncomeType>(profile.incomeType)
  const [incomeMonthly, setIncomeMonthly] = useState(profile.incomeMonthly)
  const [debtMonthlyPayment, setDebtMonthlyPayment] = useState(profile.monthlyDebtPayment)

  // Categorized expenses (core asks).
  const [expenses, setExpenses] = useState({
    housing: 1200,
    bills: 220,
    insurance: 180,
    utilities: 140,
    groceries: 350,
    transport: 180,
    healthcare: 80,
    education: 70,
    entertainment: 220,
    shopping: 160,
  })

  // Contributions + balances tracking.
  const [efBalance, setEfBalance] = useState(profile.currentEmergencyFund)
  const [efContributionMonthly, setEfContributionMonthly] = useState(250)
  const [efContributedToDate, setEfContributedToDate] = useState(800)
  const [savingsBalance, setSavingsBalance] = useState(3200)
  const [savingsContributionMonthly, setSavingsContributionMonthly] = useState(300)
  const [savingsContributedToDate, setSavingsContributedToDate] = useState(1200)
  const [investmentsBalance, setInvestmentsBalance] = useState(6200)
  const [investmentContributionMonthly, setInvestmentContributionMonthly] = useState(400)
  const [investmentContributedToDate, setInvestmentContributedToDate] = useState(1800)

  const [strategyId, setStrategyId] = useState<'auto' | '50/30/20' | '60/20/20' | 'lean-saver' | 'custom'>(() => {
    // Default "auto" uses incomeType-based logic in the service.
    return 'auto'
  })

  const defaultNeedsPct = profile.incomeType === 'freelance' ? 55 : 55
  const defaultWantsPct = profile.incomeType === 'freelance' ? 20 : 25
  const defaultSavingsPct = profile.incomeType === 'freelance' ? 25 : 20

  const [customNeedsPct, setCustomNeedsPct] = useState<number>(defaultNeedsPct)
  const [customWantsPct, setCustomWantsPct] = useState<number>(defaultWantsPct)
  const [customSavingsPct, setCustomSavingsPct] = useState<number>(defaultSavingsPct)

  // Purchase simulation
  const [purchasePrice, setPurchasePrice] = useState(2000)
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [installmentMonths, setInstallmentMonths] = useState(12)

  const [last3Incomes, setLast3Incomes] = useState<number[]>([
    incomeMonthly * 0.92,
    incomeMonthly * 0.98,
    incomeMonthly * 1.06,
  ])

  const needsExpenses = useMemo(
    () =>
      expenses.housing +
      expenses.bills +
      expenses.insurance +
      expenses.utilities +
      expenses.groceries +
      expenses.transport +
      expenses.healthcare +
      expenses.education,
    [expenses],
  )
  const wantsExpenses = useMemo(() => expenses.entertainment + expenses.shopping, [expenses])
  const totalExpenses = needsExpenses + wantsExpenses

  const cashFlow = incomeMonthly - totalExpenses - debtMonthlyPayment
  const savingsCapacityMonthly = Math.max(
    0,
    cashFlow - efContributionMonthly - savingsContributionMonthly - investmentContributionMonthly,
  )

  const budgetOutput = useMemo(() => {
    const budgetSplitTemplate =
      strategyId === 'custom'
        ? { needsPct: customNeedsPct, wantsPct: customWantsPct, savingsPct: customSavingsPct }
        : strategyId === '50/30/20'
          ? { needsPct: 50, wantsPct: 30, savingsPct: 20 }
          : strategyId === '60/20/20'
            ? { needsPct: 60, wantsPct: 20, savingsPct: 20 }
            : strategyId === 'lean-saver'
              ? { needsPct: 55, wantsPct: 20, savingsPct: 25 }
              : undefined

    return buildBudgetBuilder({
      incomeMonthly,
      fixedExpensesMonthly: needsExpenses,
      variableCategories:
        wantsExpenses > 0
          ? [
              {
                name: 'variable wants',
                amountMonthly: wantsExpenses,
                kind: 'variable',
                expenseType: 'wants',
              },
            ]
          : [],
      incomeType,
      budgetSplitTemplate,
    })
  }, [
    incomeMonthly,
    incomeType,
    needsExpenses,
    wantsExpenses,
    strategyId,
    customNeedsPct,
    customWantsPct,
    customSavingsPct,
  ])

  const efOutput = useMemo(
    () =>
      planEmergencyFund({
        monthlyExpenses: totalExpenses,
        incomeType,
        currentEmergencyFund: efBalance,
        monthlySavingsAvailable: efContributionMonthly,
      }),
    [totalExpenses, incomeType, efBalance, efContributionMonthly],
  )

  const debtOutput = useMemo(
    () =>
      computeDebtCapacity({
        monthlyIncome: incomeMonthly,
        monthlyDebtPayment: debtMonthlyPayment,
        incomeType,
      }),
    [incomeMonthly, debtMonthlyPayment, incomeType],
  )

  const smoothingOutput = useMemo(
    () =>
      smoothIncome({
        incomeType,
        lastNMonthlyIncomes: last3Incomes,
      }),
    [incomeType, last3Incomes],
  )

  const purchaseOutput = useMemo(() => {
    return canAffordThis({
      incomeMonthly,
      monthlyExpenses: totalExpenses,
      monthlyDebtPayment: debtMonthlyPayment,
      incomeType,
      emergencyFund: efBalance,
      purchasePrice,
      paymentType,
      installmentMonths,
    })
  }, [incomeMonthly, totalExpenses, debtMonthlyPayment, incomeType, efBalance, purchasePrice, paymentType, installmentMonths])

  const debtRatioPct = Math.max(0, Math.min(100, debtOutput.debtRatio * 100))
  const efProgressPct = Math.max(0, Math.min(100, efOutput.targetAmount > 0 ? (efBalance / efOutput.targetAmount) * 100 : 0))

  const smoothingBars = useMemo(
    () => [
      { name: 'M1', value: Math.max(0, last3Incomes[0] ?? 0) },
      { name: 'M2', value: Math.max(0, last3Incomes[1] ?? 0) },
      { name: 'M3', value: Math.max(0, last3Incomes[2] ?? 0) },
      { name: 'AVG', value: Math.max(0, smoothingOutput.usableMonthlyIncome) },
    ],
    [last3Incomes, smoothingOutput.usableMonthlyIncome],
  )

  const contributionBars = useMemo(
    () => [
      { name: 'EF', value: Math.max(0, efContributedToDate) },
      { name: 'Savings', value: Math.max(0, savingsContributedToDate) },
      { name: 'Invest', value: Math.max(0, investmentContributedToDate) },
    ],
    [efContributedToDate, savingsContributedToDate, investmentContributedToDate],
  )

  return (
    <div className="bb-workspace bb-bdg-page">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">BDG</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">BUDGET</span>
      </div>

      <section className="bb-win">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">BUDGET COMMAND CENTER</span>
          <span className="bb-win__meta mono">BENTO</span>
        </header>

        <div className="bb-fin-bento">
          <article className="bb-fin-bento__item bb-fin-bento__item--metrics">
            <div className="bb-fin-subttl">core inputs</div>
            <div className="bb-fin-grid bb-fin-grid--2">
              <label className="bb-fin-field">
                <span className="bb-fin-label">income type</span>
                <select className="bb-sel" value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeType)}>
                  <option value="fixed">stable / fixed</option>
                  <option value="freelance">freelance / unstable</option>
                </select>
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">monthly income</span>
                <input className="bb-fin-input" type="number" value={incomeMonthly} onChange={(e) => setIncomeMonthly(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">debt monthly payment</span>
                <input className="bb-fin-input" type="number" value={debtMonthlyPayment} onChange={(e) => setDebtMonthlyPayment(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">budget strategy</span>
                <select
                  className="bb-sel"
                  value={strategyId}
                  onChange={(e) => setStrategyId(e.target.value as typeof strategyId)}
                >
                  <option value="auto">auto (based on income type)</option>
                  <option value="50/30/20">50 / 30 / 20 (classic)</option>
                  <option value="60/20/20">60 / 20 / 20 (more needs)</option>
                  <option value="lean-saver">55 / 20 / 25 (lean)</option>
                  <option value="custom">custom</option>
                </select>
              </label>
            </div>

            {strategyId === 'custom' ? (
              <div className="bb-fin-grid bb-fin-grid--3" style={{ marginTop: 8 }}>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">needs %</span>
                  <input className="bb-fin-input" type="number" value={customNeedsPct} onChange={(e) => setCustomNeedsPct(parseMoney(e.target.value))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">wants %</span>
                  <input className="bb-fin-input" type="number" value={customWantsPct} onChange={(e) => setCustomWantsPct(parseMoney(e.target.value))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">savings %</span>
                  <input className="bb-fin-input" type="number" value={customSavingsPct} onChange={(e) => setCustomSavingsPct(parseMoney(e.target.value))} />
                </label>
              </div>
            ) : null}

            <div className="bb-fin-summary" style={{ marginTop: 8 }}>
              <div className="bb-fin-row">
                <span className="muted">needs budget</span>
                <span className="mono">{budgetOutput.split.needsPct}% = {formatMoney(budgetOutput.split.needsAmount)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">wants budget</span>
                <span className="mono">{budgetOutput.split.wantsPct}% = {formatMoney(budgetOutput.split.wantsAmount)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">savings budget</span>
                <span className="mono">{budgetOutput.split.savingsPct}% = {formatMoney(budgetOutput.split.savingsAmount)}</span>
              </div>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--ef">
            <div className="bb-fin-subttl">categorized expenses</div>
            <div className="bb-fin-grid bb-fin-grid--2">
              <label className="bb-fin-field">
                <span className="bb-fin-label">housing</span>
                <input className="bb-fin-input" type="number" value={expenses.housing} onChange={(e) => setExpenses((p) => ({ ...p, housing: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">bills</span>
                <input className="bb-fin-input" type="number" value={expenses.bills} onChange={(e) => setExpenses((p) => ({ ...p, bills: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">insurance</span>
                <input className="bb-fin-input" type="number" value={expenses.insurance} onChange={(e) => setExpenses((p) => ({ ...p, insurance: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">utilities</span>
                <input className="bb-fin-input" type="number" value={expenses.utilities} onChange={(e) => setExpenses((p) => ({ ...p, utilities: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">groceries</span>
                <input className="bb-fin-input" type="number" value={expenses.groceries} onChange={(e) => setExpenses((p) => ({ ...p, groceries: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">transport</span>
                <input className="bb-fin-input" type="number" value={expenses.transport} onChange={(e) => setExpenses((p) => ({ ...p, transport: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">healthcare</span>
                <input className="bb-fin-input" type="number" value={expenses.healthcare} onChange={(e) => setExpenses((p) => ({ ...p, healthcare: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">education</span>
                <input className="bb-fin-input" type="number" value={expenses.education} onChange={(e) => setExpenses((p) => ({ ...p, education: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">entertainment</span>
                <input className="bb-fin-input" type="number" value={expenses.entertainment} onChange={(e) => setExpenses((p) => ({ ...p, entertainment: parseMoney(e.target.value) }))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">shopping</span>
                <input className="bb-fin-input" type="number" value={expenses.shopping} onChange={(e) => setExpenses((p) => ({ ...p, shopping: parseMoney(e.target.value) }))} />
              </label>
            </div>
            <div className="bb-fin-summary">
              <div className="bb-fin-row">
                <span className="muted">needs expenses</span>
                <span className="mono">{formatMoney(needsExpenses)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">wants expenses</span>
                <span className="mono">{formatMoney(wantsExpenses)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">total expenses</span>
                <span className="mono">{formatMoney(totalExpenses)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">cash flow</span>
                <span className={`mono ${cashFlow >= 0 ? 'pos' : 'neg'}`}>{cashFlow >= 0 ? '+' : ''}{formatMoney(cashFlow)}</span>
              </div>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--debt">
            <div className="bb-fin-subttl">debt capacity + gauge</div>
            <div className="bb-fin-summary">
              <div className="bb-fin-row">
                <span className="muted">safe monthly debt limit</span>
                <span className="mono">{formatMoney(debtOutput.safeMonthlyDebtLimit)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">debt ratio</span>
                <span className="mono">{(debtOutput.debtRatio * 100).toFixed(1)}%</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">risk</span>
                <span className="mono">{debtOutput.riskLevel.toUpperCase()}</span>
              </div>
            </div>
            <div className="bb-fin-chartCard">
              <div className="bb-fin-chartCard__ttl">debt gauge</div>
              <ResponsiveContainer width="100%" height={112}>
                <RadialBarChart
                  cx="50%"
                  cy="80%"
                  innerRadius="55%"
                  outerRadius="95%"
                  startAngle={180}
                  endAngle={0}
                  data={[{ value: debtRatioPct }]}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={2}
                    fill={debtRatioPct > 35 ? '#f44' : debtRatioPct > 25 ? '#ffcc00' : '#0f0'}
                    background
                  />
                  <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(1)}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--smooth">
            <div className="bb-fin-subttl">income smoothing chart</div>
            <div className="bb-fin-grid bb-fin-grid--1">
              {last3Incomes.map((v, idx) => (
                <label key={idx} className="bb-fin-field">
                  <span className="bb-fin-label">month {idx + 1}</span>
                  <input
                    className="bb-fin-input"
                    type="number"
                    value={v}
                    onChange={(e) =>
                      setLast3Incomes((arr) => {
                        const next = [...arr]
                        next[idx] = parseMoney(e.target.value)
                        return next
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="bb-fin-summary">
              <div className="bb-fin-row">
                <span className="muted">usable income</span>
                <span className="mono">{formatMoney(smoothingOutput.usableMonthlyIncome)}</span>
              </div>
            </div>
            <div className="bb-fin-chartCard">
              <div className="bb-fin-chartCard__ttl">smoothing chart</div>
              <div className="bb-fin-miniChart">
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={smoothingBars}>
                    <XAxis dataKey="name" stroke="#888" tick={{ fill: '#aaa', fontSize: 10 }} />
                    <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Bar dataKey="value" fill="#ffcc00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--afford">
            <div className="bb-fin-subttl">can i afford this?</div>
            <div className="bb-fin-grid bb-fin-grid--3">
              <label className="bb-fin-field">
                <span className="bb-fin-label">purchase price</span>
                <input className="bb-fin-input" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">payment type</span>
                <select className="bb-sel" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                  <option value="cash">cash</option>
                  <option value="installment">installment</option>
                </select>
              </label>
              {paymentType === 'installment' ? (
                <label className="bb-fin-field">
                  <span className="bb-fin-label">installment months</span>
                  <input className="bb-fin-input" type="number" value={installmentMonths} onChange={(e) => setInstallmentMonths(parseMoney(e.target.value))} />
                </label>
              ) : null}
            </div>
            <div className="bb-fin-summary">
              <div className="bb-fin-row">
                <span className="muted">verdict</span>
                <span className="mono">{purchaseOutput.verdict.toUpperCase()}</span>
              </div>
              <div className="bb-fin-mutedHint">{purchaseOutput.explanation}</div>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--statements">
            <div className="bb-fin-subttl">ef + savings + investments tracking</div>
            <div className="bb-fin-grid bb-fin-grid--3">
              <label className="bb-fin-field">
                <span className="bb-fin-label">ef balance</span>
                <input className="bb-fin-input" type="number" value={efBalance} onChange={(e) => setEfBalance(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">ef monthly contribution</span>
                <input className="bb-fin-input" type="number" value={efContributionMonthly} onChange={(e) => setEfContributionMonthly(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">ef contributed to date</span>
                <input className="bb-fin-input" type="number" value={efContributedToDate} onChange={(e) => setEfContributedToDate(parseMoney(e.target.value))} />
              </label>

              <label className="bb-fin-field">
                <span className="bb-fin-label">savings balance</span>
                <input className="bb-fin-input" type="number" value={savingsBalance} onChange={(e) => setSavingsBalance(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">savings monthly contribution</span>
                <input className="bb-fin-input" type="number" value={savingsContributionMonthly} onChange={(e) => setSavingsContributionMonthly(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">savings contributed to date</span>
                <input className="bb-fin-input" type="number" value={savingsContributedToDate} onChange={(e) => setSavingsContributedToDate(parseMoney(e.target.value))} />
              </label>

              <label className="bb-fin-field">
                <span className="bb-fin-label">investments balance</span>
                <input className="bb-fin-input" type="number" value={investmentsBalance} onChange={(e) => setInvestmentsBalance(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">investment monthly contribution</span>
                <input className="bb-fin-input" type="number" value={investmentContributionMonthly} onChange={(e) => setInvestmentContributionMonthly(parseMoney(e.target.value))} />
              </label>
              <label className="bb-fin-field">
                <span className="bb-fin-label">investment contributed to date</span>
                <input className="bb-fin-input" type="number" value={investmentContributedToDate} onChange={(e) => setInvestmentContributedToDate(parseMoney(e.target.value))} />
              </label>
            </div>

            <div className="bb-fin-summary" style={{ marginTop: 8 }}>
              <div className="bb-fin-row">
                <span className="muted">ef target (auto from categorized expenses)</span>
                <span className="mono">{formatMoney(efOutput.targetAmount)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">ef progress</span>
                <span className="mono">{efProgressPct.toFixed(1)}%</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">available after contributions</span>
                <span className={`mono ${savingsCapacityMonthly >= 0 ? 'pos' : 'neg'}`}>
                  {savingsCapacityMonthly >= 0 ? '+' : ''}{formatMoney(savingsCapacityMonthly)}
                </span>
              </div>
            </div>
            <div className="bb-fin-chartCard">
              <div className="bb-fin-chartCard__ttl">contributions tracking</div>
              <div className="bb-fin-miniChart">
                <ResponsiveContainer width="100%" height={112}>
                  <BarChart data={contributionBars}>
                    <XAxis dataKey="name" stroke="#888" tick={{ fill: '#aaa', fontSize: 10 }} />
                    <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                    <Bar dataKey="value" fill="#ff6600" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

