import { useMemo, useState } from 'react'
import type { FinanceProfileInput } from '../../../services/finance/types'
import { getDefaultDemoProfile, loadDemoProfile } from '../../../services/storage/localStorageStore'
import { getDefaultDemoPersonalStatements, loadPersonalStatements } from '../../../services/storage/personalStatementsStore'
import { TwoSlicePie } from '../../charts/echarts/TwoSlicePie'

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function FinancePage() {
  const [profile] = useState<FinanceProfileInput>(() => loadDemoProfile() ?? getDefaultDemoProfile())
  const statements = useMemo(() => loadPersonalStatements() ?? getDefaultDemoPersonalStatements(), [])

  const monthlyExpenses = profile.monthlyExpenses
  const monthlyIncome = profile.incomeMonthly
  const monthlyDebtPayment = profile.monthlyDebtPayment
  const emergencyFund = profile.currentEmergencyFund

  const cashFlowMonthly = monthlyIncome - monthlyExpenses - monthlyDebtPayment
  const monthlySavingsAvailable = Math.max(0, cashFlowMonthly)

  const savingsRatePct = monthlyIncome > 0 ? (monthlySavingsAvailable / monthlyIncome) * 100 : 0
  const debtServiceRatio = monthlyIncome > 0 ? (monthlyDebtPayment / monthlyIncome) * 100 : 0
  const runwayMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0

  const totalAssets = statements.assets.reduce((sum, a) => sum + Math.max(0, a.amount), 0)
  const totalLiabilities = statements.liabilities.reduce((sum, l) => sum + Math.max(0, l.amount), 0)
  const netWorth = totalAssets - totalLiabilities

  const stmtComposition = [
    { name: 'Assets', value: Math.max(0, totalAssets) },
    { name: 'Liabilities', value: Math.max(0, totalLiabilities) },
  ]

  const topAssets = [...statements.assets]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
  const topLiabilities = [...statements.liabilities]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  return (
    <div className="bb-workspace bb-fin-page">
      <div className="bb-workspace__hdr">
        <span className="bb-workspace__fn">FIN</span>
        <span className="bb-workspace__pipe">|</span>
        <span className="bb-workspace__ttl">FINANCE TOOLS</span>
      </div>

      <section className="bb-win">
        <header className="bb-win__bar">
          <span className="bb-win__ttl">FINANCE OVERVIEW</span>
          <span className="bb-win__meta mono">BENTO</span>
        </header>

        <div className="bb-fin-bento">
          <article className="bb-fin-bento__item bb-fin-bento__item--metrics">
            <div className="bb-fin-subttl">portfolio health snapshot</div>
            <div className="bb-fin-metricsGrid">
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">monthly income</div>
                <div className="bb-fin-metric__v mono">{formatMoney(monthlyIncome)}</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">monthly expenses</div>
                <div className="bb-fin-metric__v mono">{formatMoney(monthlyExpenses)}</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">cash flow</div>
                <div className="bb-fin-metric__v mono">{cashFlowMonthly >= 0 ? '+' : ''}{formatMoney(cashFlowMonthly)}</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">savings rate</div>
                <div className="bb-fin-metric__v mono">{savingsRatePct.toFixed(1)}%</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">debt service ratio</div>
                <div className="bb-fin-metric__v mono">{debtServiceRatio.toFixed(1)}%</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">ef runway</div>
                <div className="bb-fin-metric__v mono">{runwayMonths.toFixed(1)} mo</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">net worth</div>
                <div className={`bb-fin-metric__v mono ${netWorth >= 0 ? 'pos' : 'neg'}`}>{formatMoney(netWorth)}</div>
              </div>
              <div className="bb-fin-metric">
                <div className="bb-fin-metric__k">liability coverage</div>
                <div className="bb-fin-metric__v mono">
                  {totalLiabilities > 0 ? `${((totalAssets / totalLiabilities) * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
          </article>

          <article className="bb-fin-bento__item bb-fin-bento__item--statements">
            <div className="bb-fin-subttl">financial statements preview</div>
            <div className="bb-fin-summary">
              <div className="bb-fin-row">
                <span className="muted">total assets</span>
                <span className="mono">{formatMoney(totalAssets)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">total liabilities</span>
                <span className="mono">{formatMoney(totalLiabilities)}</span>
              </div>
              <div className="bb-fin-row">
                <span className="muted">net worth</span>
                <span className={`mono ${netWorth >= 0 ? 'pos' : 'neg'}`}>{formatMoney(netWorth)}</span>
              </div>
            </div>

            <div className="bb-fin-stmtPreview">
              <div className="bb-fin-stmtPreview__col">
                <div className="bb-fin-chartCard__ttl">top assets</div>
                <div className="bb-fin-table">
                  {topAssets.map((a) => (
                    <div key={a.id} className="bb-fin-table__row">
                      <span className="muted">{a.name || 'Untitled'}</span>
                      <span className="mono">{formatMoney(a.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bb-fin-stmtPreview__col">
                <div className="bb-fin-chartCard__ttl">top liabilities</div>
                <div className="bb-fin-table">
                  {topLiabilities.map((l) => (
                    <div key={l.id} className="bb-fin-table__row">
                      <span className="muted">{l.name || 'Untitled'}</span>
                      <span className="mono">{formatMoney(l.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bb-fin-chartCard">
              <div className="bb-fin-chartCard__ttl">assets vs liabilities</div>
              <div className="bb-fin-miniChart">
                <TwoSlicePie
                  rows={stmtComposition}
                  colors={['#0f0', '#f44']}
                  formatTooltip={formatMoney}
                  height={116}
                />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

