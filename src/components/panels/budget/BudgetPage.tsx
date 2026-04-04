import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FinanceProfileInput, IncomeType, PaymentType } from '../../../services/finance/types'
import { buildBudgetBuilder } from '../../../services/budgetService'
import { canAffordThis } from '../../../services/affordabilityService'
import { planEmergencyFund } from '../../../services/efService'
import { computeDebtCapacity } from '../../../services/debtService'
import { smoothIncome } from '../../../services/incomeSmoothingService'
import { getDefaultDemoProfile, loadDemoProfile } from '../../../services/storage/localStorageStore'
import { fetchBudgetFromCloud, getOrCreateBudgetUserId, saveBudgetToCloud } from '../../../services/budgetApi'
import {
  buildBudgetSnapshot,
  parseBudgetRemotePayload,
  type BudgetExpensesState,
  type BudgetSnapshotV1,
  type BudgetStrategyId,
} from '../../../services/budgetPersist'
import { CategoricalBarChart } from '../../charts/echarts/CategoricalBarChart'
import { DebtRatioGauge } from '../../charts/echarts/DebtRatioGauge'

function parseMoney(s: string) {
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatClock(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}

type TabId = 'run' | 'costs' | 'risk' | 'plan'

const DEFAULT_EXPENSES: BudgetExpensesState = {
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
}

export function BudgetPage() {
  const [profile] = useState<FinanceProfileInput>(() => loadDemoProfile() ?? getDefaultDemoProfile())
  const [tab, setTab] = useState<TabId>('run')
  const budgetUserId = useMemo(() => getOrCreateBudgetUserId(), [])

  const [incomeType, setIncomeType] = useState<IncomeType>(profile.incomeType)
  const [incomeMonthly, setIncomeMonthly] = useState(profile.incomeMonthly)
  const [debtMonthlyPayment, setDebtMonthlyPayment] = useState(profile.monthlyDebtPayment)

  const [expenses, setExpenses] = useState<BudgetExpensesState>(DEFAULT_EXPENSES)

  const [efBalance, setEfBalance] = useState(profile.currentEmergencyFund)
  const [efContributionMonthly, setEfContributionMonthly] = useState(250)
  const [efContributedToDate, setEfContributedToDate] = useState(800)
  const [savingsBalance, setSavingsBalance] = useState(3200)
  const [savingsContributionMonthly, setSavingsContributionMonthly] = useState(300)
  const [savingsContributedToDate, setSavingsContributedToDate] = useState(1200)
  const [investmentsBalance, setInvestmentsBalance] = useState(6200)
  const [investmentContributionMonthly, setInvestmentContributionMonthly] = useState(400)
  const [investmentContributedToDate, setInvestmentContributedToDate] = useState(1800)

  const [strategyId, setStrategyId] = useState<BudgetStrategyId>('auto')

  const defaultNeedsPct = profile.incomeType === 'freelance' ? 55 : 55
  const defaultWantsPct = profile.incomeType === 'freelance' ? 20 : 25
  const defaultSavingsPct = profile.incomeType === 'freelance' ? 25 : 20

  const [customNeedsPct, setCustomNeedsPct] = useState<number>(defaultNeedsPct)
  const [customWantsPct, setCustomWantsPct] = useState<number>(defaultWantsPct)
  const [customSavingsPct, setCustomSavingsPct] = useState<number>(defaultSavingsPct)

  const [purchasePrice, setPurchasePrice] = useState(2000)
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [installmentMonths, setInstallmentMonths] = useState(12)

  const [last3Incomes, setLast3Incomes] = useState<number[]>([
    profile.incomeMonthly * 0.92,
    profile.incomeMonthly * 0.98,
    profile.incomeMonthly * 1.06,
  ])

  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'saving' | 'err'>('idle')
  const [cloudMsg, setCloudMsg] = useState<string>('')
  const [lastRemoteAt, setLastRemoteAt] = useState<string>('')
  const [autoSave, setAutoSave] = useState(true)

  const allowCloudWrite = useRef(false)
  const expensesRef = useRef(expenses)
  expensesRef.current = expenses

  const snapshot: BudgetSnapshotV1 = useMemo(
    () =>
      buildBudgetSnapshot({
        v: 1,
        incomeType,
        incomeMonthly,
        debtMonthlyPayment,
        expenses,
        strategyId,
        customNeedsPct,
        customWantsPct,
        customSavingsPct,
        last3Incomes: [last3Incomes[0] ?? 0, last3Incomes[1] ?? 0, last3Incomes[2] ?? 0],
        purchasePrice,
        paymentType,
        installmentMonths,
        efBalance,
        efContributionMonthly,
        efContributedToDate,
        savingsBalance,
        savingsContributionMonthly,
        savingsContributedToDate,
        investmentsBalance,
        investmentContributionMonthly,
        investmentContributedToDate,
      }),
    [
      incomeType,
      incomeMonthly,
      debtMonthlyPayment,
      expenses,
      strategyId,
      customNeedsPct,
      customWantsPct,
      customSavingsPct,
      last3Incomes,
      purchasePrice,
      paymentType,
      installmentMonths,
      efBalance,
      efContributionMonthly,
      efContributedToDate,
      savingsBalance,
      savingsContributionMonthly,
      savingsContributedToDate,
      investmentsBalance,
      investmentContributionMonthly,
      investmentContributedToDate,
    ],
  )

  const applyRemotePatch = useCallback((patch: Partial<BudgetSnapshotV1>) => {
    if (patch.incomeType !== undefined) setIncomeType(patch.incomeType)
    if (patch.incomeMonthly !== undefined) setIncomeMonthly(patch.incomeMonthly)
    if (patch.debtMonthlyPayment !== undefined) setDebtMonthlyPayment(patch.debtMonthlyPayment)
    if (patch.expenses !== undefined) setExpenses(patch.expenses)
    if (patch.strategyId !== undefined) setStrategyId(patch.strategyId)
    if (patch.customNeedsPct !== undefined) setCustomNeedsPct(patch.customNeedsPct)
    if (patch.customWantsPct !== undefined) setCustomWantsPct(patch.customWantsPct)
    if (patch.customSavingsPct !== undefined) setCustomSavingsPct(patch.customSavingsPct)
    if (patch.last3Incomes !== undefined) setLast3Incomes([...patch.last3Incomes])
    if (patch.purchasePrice !== undefined) setPurchasePrice(patch.purchasePrice)
    if (patch.paymentType !== undefined) setPaymentType(patch.paymentType)
    if (patch.installmentMonths !== undefined) setInstallmentMonths(patch.installmentMonths)
    if (patch.efBalance !== undefined) setEfBalance(patch.efBalance)
    if (patch.efContributionMonthly !== undefined) setEfContributionMonthly(patch.efContributionMonthly)
    if (patch.efContributedToDate !== undefined) setEfContributedToDate(patch.efContributedToDate)
    if (patch.savingsBalance !== undefined) setSavingsBalance(patch.savingsBalance)
    if (patch.savingsContributionMonthly !== undefined) setSavingsContributionMonthly(patch.savingsContributionMonthly)
    if (patch.savingsContributedToDate !== undefined) setSavingsContributedToDate(patch.savingsContributedToDate)
    if (patch.investmentsBalance !== undefined) setInvestmentsBalance(patch.investmentsBalance)
    if (patch.investmentContributionMonthly !== undefined) setInvestmentContributionMonthly(patch.investmentContributionMonthly)
    if (patch.investmentContributedToDate !== undefined) setInvestmentContributedToDate(patch.investmentContributedToDate)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      allowCloudWrite.current = false
      setCloudStatus('loading')
      setCloudMsg('pulling workspace…')
      try {
        const row = await fetchBudgetFromCloud(budgetUserId)
        if (cancelled) return
        if (row) {
          const patch = parseBudgetRemotePayload(row.data, expensesRef.current)
          if (patch) applyRemotePatch(patch)
          setLastRemoteAt(row.updatedAt)
          setCloudMsg('loaded from cloud')
        } else {
          setCloudMsg('no cloud snapshot — local defaults')
        }
      } catch (e) {
        if (!cancelled) {
          setCloudStatus('err')
          setCloudMsg(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) {
          setCloudStatus('idle')
          allowCloudWrite.current = true
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [budgetUserId, applyRemotePatch])

  const persistCloud = useCallback(async () => {
    setCloudStatus('saving')
    setCloudMsg('writing…')
    try {
      const updatedAt = await saveBudgetToCloud(budgetUserId, snapshot)
      setLastRemoteAt(updatedAt)
      setCloudMsg('saved')
      setCloudStatus('idle')
    } catch (e) {
      setCloudStatus('err')
      setCloudMsg(e instanceof Error ? e.message : String(e))
    }
  }, [budgetUserId, snapshot])

  useEffect(() => {
    if (!allowCloudWrite.current || !autoSave) return
    const t = window.setTimeout(() => {
      void persistCloud()
    }, 2000)
    return () => window.clearTimeout(t)
  }, [snapshot, autoSave, persistCloud])

  const pullCloud = useCallback(async () => {
    allowCloudWrite.current = false
    setCloudStatus('loading')
    setCloudMsg('pulling…')
    try {
      const row = await fetchBudgetFromCloud(budgetUserId)
      if (row) {
        const patch = parseBudgetRemotePayload(row.data, expensesRef.current)
        if (patch) applyRemotePatch(patch)
        setLastRemoteAt(row.updatedAt)
        setCloudMsg('reloaded')
      } else {
        setCloudMsg('nothing on server')
      }
      setCloudStatus('idle')
    } catch (e) {
      setCloudStatus('err')
      setCloudMsg(e instanceof Error ? e.message : String(e))
    } finally {
      allowCloudWrite.current = true
    }
  }, [budgetUserId, applyRemotePatch])

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

  const shortUser = budgetUserId.length > 10 ? `…${budgetUserId.slice(-10)}` : budgetUserId

  return (
    <div className="bb-workspace bb-bdg-page">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">BDG</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">BUDGET</span>
      </div>

      <section className="bb-win">
        <header className="bb-win__bar bb-bdg-winBar">
          <span className="bb-win__ttl">BUDGET COMMAND CENTER</span>
          <span className="bb-win__meta mono">PRISMA PG</span>
        </header>

        <div className="bb-bdg-cloudBar">
          <div className="bb-bdg-cloudBar__left">
            <span
              className={`bb-led bb-led--sm ${cloudStatus === 'idle' && cloudMsg === 'saved' ? 'bb-led--on' : cloudStatus === 'saving' ? 'bb-led--warn' : cloudStatus === 'err' ? 'bb-led--err' : cloudStatus === 'loading' ? 'bb-led--warn' : ''}`}
              title={cloudMsg}
            />
            <span className="bb-bdg-cloudBar__label">CLOUD</span>
            <span className="bb-bdg-cloudBar__pipe">|</span>
            <span className="muted mono">{cloudMsg || 'ready'}</span>
            <span className="bb-bdg-cloudBar__pipe">|</span>
            <span className="muted">last</span>
            <span className="mono">{formatClock(lastRemoteAt)}</span>
            <span className="bb-bdg-cloudBar__pipe">|</span>
            <span className="muted">ws</span>
            <span className="mono" title={budgetUserId}>
              {shortUser}
            </span>
          </div>
          <div className="bb-bdg-cloudBar__actions">
            <label className="bb-bdg-toggle">
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
              <span>auto-save</span>
            </label>
            <button type="button" className="bb-bdg-cmdBtn" onClick={() => void pullCloud()} disabled={cloudStatus === 'loading'}>
              PULL
            </button>
            <button type="button" className="bb-bdg-cmdBtn bb-bdg-cmdBtn--primary" onClick={() => void persistCloud()} disabled={cloudStatus === 'saving'}>
              PUSH
            </button>
          </div>
        </div>

        <div className="bb-bdg-tabs" role="tablist" aria-label="Budget sections">
          {(
            [
              ['run', 'RUN — inputs & split'],
              ['costs', 'COSTS — cashflow'],
              ['risk', 'RISK — debt & smooth'],
              ['plan', 'PLAN — afford & buckets'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`bb-bdg-tab ${tab === id ? 'bb-bdg-tab--active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bb-fin-bento">
          {tab === 'run' ? (
            <>
              <article className="bb-fin-bento__item bb-fin-bento__item--metrics bb-bdg-overview">
                <div className="bb-fin-subttl">snapshot</div>
                <div className="bb-fin-metricsGrid">
                  <div className="bb-fin-metric">
                    <div className="bb-fin-metric__k">cash flow</div>
                    <div className={`bb-fin-metric__v ${cashFlow >= 0 ? 'pos' : 'neg'}`}>
                      {cashFlow >= 0 ? '+' : ''}
                      {formatMoney(cashFlow)}
                    </div>
                  </div>
                  <div className="bb-fin-metric">
                    <div className="bb-fin-metric__k">needs vs budget</div>
                    <div className="bb-fin-metric__v mono">
                      {formatMoney(needsExpenses)} / {formatMoney(budgetOutput.split.needsAmount)}
                    </div>
                  </div>
                  <div className="bb-fin-metric">
                    <div className="bb-fin-metric__k">ef progress</div>
                    <div className="bb-fin-metric__v mono">{efProgressPct.toFixed(0)}%</div>
                  </div>
                  <div className="bb-fin-metric">
                    <div className="bb-fin-metric__k">debt risk</div>
                    <div className="bb-fin-metric__v mono">{debtOutput.riskLevel.toUpperCase()}</div>
                  </div>
                </div>
              </article>

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
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={incomeMonthly} onChange={(e) => setIncomeMonthly(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">debt monthly payment</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={debtMonthlyPayment} onChange={(e) => setDebtMonthlyPayment(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">budget strategy</span>
                    <select className="bb-sel" value={strategyId} onChange={(e) => setStrategyId(e.target.value as BudgetStrategyId)}>
                      <option value="auto">auto (based on income type)</option>
                      <option value="50/30/20">50 / 30 / 20 (classic)</option>
                      <option value="60/20/20">60 / 20 / 20 (more needs)</option>
                      <option value="lean-saver">55 / 20 / 25 (lean)</option>
                      <option value="custom">custom</option>
                    </select>
                  </label>
                </div>

                {strategyId === 'custom' ? (
                  <div className="bb-fin-grid bb-fin-grid--3 bb-bdg-tightTop">
                    <label className="bb-fin-field">
                      <span className="bb-fin-label">needs %</span>
                      <input className="bb-fin-input" type="number" inputMode="numeric" value={customNeedsPct} onChange={(e) => setCustomNeedsPct(parseMoney(e.target.value))} />
                    </label>
                    <label className="bb-fin-field">
                      <span className="bb-fin-label">wants %</span>
                      <input className="bb-fin-input" type="number" inputMode="numeric" value={customWantsPct} onChange={(e) => setCustomWantsPct(parseMoney(e.target.value))} />
                    </label>
                    <label className="bb-fin-field">
                      <span className="bb-fin-label">savings %</span>
                      <input className="bb-fin-input" type="number" inputMode="numeric" value={customSavingsPct} onChange={(e) => setCustomSavingsPct(parseMoney(e.target.value))} />
                    </label>
                  </div>
                ) : null}

                <div className="bb-fin-summary bb-bdg-tightTop">
                  <div className="bb-fin-row">
                    <span className="muted">needs budget</span>
                    <span className="mono">
                      {budgetOutput.split.needsPct}% = {formatMoney(budgetOutput.split.needsAmount)}
                    </span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">wants budget</span>
                    <span className="mono">
                      {budgetOutput.split.wantsPct}% = {formatMoney(budgetOutput.split.wantsAmount)}
                    </span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">savings budget</span>
                    <span className="mono">
                      {budgetOutput.split.savingsPct}% = {formatMoney(budgetOutput.split.savingsAmount)}
                    </span>
                  </div>
                </div>
              </article>
            </>
          ) : null}

          {tab === 'costs' ? (
            <article className="bb-fin-bento__item bb-fin-bento__item--ef">
              <div className="bb-fin-subttl">categorized expenses</div>
              <p className="bb-bdg-hint">Edit line items; totals drive needs / wants and downstream modules.</p>
              <div className="bb-fin-grid bb-fin-grid--2">
                <label className="bb-fin-field">
                  <span className="bb-fin-label">housing</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.housing} onChange={(e) => setExpenses((p) => ({ ...p, housing: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">bills</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.bills} onChange={(e) => setExpenses((p) => ({ ...p, bills: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">insurance</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.insurance} onChange={(e) => setExpenses((p) => ({ ...p, insurance: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">utilities</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.utilities} onChange={(e) => setExpenses((p) => ({ ...p, utilities: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">groceries</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.groceries} onChange={(e) => setExpenses((p) => ({ ...p, groceries: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">transport</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.transport} onChange={(e) => setExpenses((p) => ({ ...p, transport: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">healthcare</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.healthcare} onChange={(e) => setExpenses((p) => ({ ...p, healthcare: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">education</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.education} onChange={(e) => setExpenses((p) => ({ ...p, education: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">entertainment</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.entertainment} onChange={(e) => setExpenses((p) => ({ ...p, entertainment: parseMoney(e.target.value) }))} />
                </label>
                <label className="bb-fin-field">
                  <span className="bb-fin-label">shopping</span>
                  <input className="bb-fin-input" type="number" inputMode="decimal" value={expenses.shopping} onChange={(e) => setExpenses((p) => ({ ...p, shopping: parseMoney(e.target.value) }))} />
                </label>
              </div>
              <div className="bb-fin-summary bb-bdg-tightTop">
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
                  <span className={`mono ${cashFlow >= 0 ? 'pos' : 'neg'}`}>
                    {cashFlow >= 0 ? '+' : ''}
                    {formatMoney(cashFlow)}
                  </span>
                </div>
              </div>
            </article>
          ) : null}

          {tab === 'risk' ? (
            <>
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
                  <DebtRatioGauge pct={debtRatioPct} height={112} />
                </div>
              </article>

              <article className="bb-fin-bento__item bb-fin-bento__item--smooth">
                <div className="bb-fin-subttl">income smoothing</div>
                <p className="bb-bdg-hint">Last three months → conservative usable income for planning.</p>
                <div className="bb-fin-grid bb-fin-grid--1">
                  {last3Incomes.map((v, idx) => (
                    <label key={idx} className="bb-fin-field">
                      <span className="bb-fin-label">month {idx + 1}</span>
                      <input
                        className="bb-fin-input"
                        type="number"
                        inputMode="decimal"
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
                <div className="bb-fin-summary bb-bdg-tightTop">
                  <div className="bb-fin-row">
                    <span className="muted">usable income</span>
                    <span className="mono">{formatMoney(smoothingOutput.usableMonthlyIncome)}</span>
                  </div>
                </div>
                <div className="bb-fin-chartCard">
                  <div className="bb-fin-chartCard__ttl">smoothing chart</div>
                  <div className="bb-fin-miniChart">
                    <CategoricalBarChart bars={smoothingBars} barColor="#ffcc00" height={110} />
                  </div>
                </div>
              </article>
            </>
          ) : null}

          {tab === 'plan' ? (
            <>
              <article className="bb-fin-bento__item bb-fin-bento__item--afford">
                <div className="bb-fin-subttl">can i afford this?</div>
                <div className="bb-fin-grid bb-fin-grid--3">
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">purchase price</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(parseMoney(e.target.value))} />
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
                      <input className="bb-fin-input" type="number" inputMode="numeric" value={installmentMonths} onChange={(e) => setInstallmentMonths(parseMoney(e.target.value))} />
                    </label>
                  ) : null}
                </div>
                <div className="bb-fin-summary bb-bdg-tightTop">
                  <div className="bb-fin-row">
                    <span className="muted">verdict</span>
                    <span className="mono">{purchaseOutput.verdict.toUpperCase()}</span>
                  </div>
                  <div className="bb-fin-mutedHint">{purchaseOutput.explanation}</div>
                </div>
              </article>

              <article className="bb-fin-bento__item bb-fin-bento__item--statements">
                <div className="bb-fin-subttl">ef + savings + investments</div>
                <div className="bb-fin-grid bb-fin-grid--3">
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">ef balance</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={efBalance} onChange={(e) => setEfBalance(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">ef monthly contribution</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={efContributionMonthly} onChange={(e) => setEfContributionMonthly(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">ef contributed to date</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={efContributedToDate} onChange={(e) => setEfContributedToDate(parseMoney(e.target.value))} />
                  </label>

                  <label className="bb-fin-field">
                    <span className="bb-fin-label">savings balance</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={savingsBalance} onChange={(e) => setSavingsBalance(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">savings monthly contribution</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={savingsContributionMonthly} onChange={(e) => setSavingsContributionMonthly(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">savings contributed to date</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={savingsContributedToDate} onChange={(e) => setSavingsContributedToDate(parseMoney(e.target.value))} />
                  </label>

                  <label className="bb-fin-field">
                    <span className="bb-fin-label">investments balance</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={investmentsBalance} onChange={(e) => setInvestmentsBalance(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">investment monthly contribution</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={investmentContributionMonthly} onChange={(e) => setInvestmentContributionMonthly(parseMoney(e.target.value))} />
                  </label>
                  <label className="bb-fin-field">
                    <span className="bb-fin-label">investment contributed to date</span>
                    <input className="bb-fin-input" type="number" inputMode="decimal" value={investmentContributedToDate} onChange={(e) => setInvestmentContributedToDate(parseMoney(e.target.value))} />
                  </label>
                </div>

                <div className="bb-fin-summary bb-bdg-tightTop">
                  <div className="bb-fin-row">
                    <span className="muted">ef target</span>
                    <span className="mono">{formatMoney(efOutput.targetAmount)}</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">ef progress</span>
                    <span className="mono">{efProgressPct.toFixed(1)}%</span>
                  </div>
                  <div className="bb-fin-row">
                    <span className="muted">available after contributions</span>
                    <span className={`mono ${savingsCapacityMonthly >= 0 ? 'pos' : 'neg'}`}>
                      {savingsCapacityMonthly >= 0 ? '+' : ''}
                      {formatMoney(savingsCapacityMonthly)}
                    </span>
                  </div>
                </div>
                <div className="bb-fin-chartCard">
                  <div className="bb-fin-chartCard__ttl">contributions tracking</div>
                  <div className="bb-fin-miniChart">
                    <CategoricalBarChart bars={contributionBars} barColor="#ff6600" height={112} />
                  </div>
                </div>
              </article>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
