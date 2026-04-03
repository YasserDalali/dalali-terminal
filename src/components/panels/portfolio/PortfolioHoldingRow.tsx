import { EquityLink } from '../../EquityLink'
import { StripSparkline } from '../../charts/StripSparkline'
import type { IbkrPositionRow } from '../../../services/finance/ibkrFlexTypes'
import { formatPctSigned, formatUsd, formatUsdSigned } from './portfolioFormat'

function oneDUsdFromPricePct(mark: number, qty: number, pct: number): number | null {
  if (!Number.isFinite(pct) || pct === -100 || !Number.isFinite(mark) || !Number.isFinite(qty)) return null
  const prev = mark / (1 + pct / 100)
  return qty * (mark - prev)
}

export function PortfolioHoldingRow({
  p,
  sym1d,
  symSeries,
  variant = 'pf',
}: {
  p: IbkrPositionRow
  sym1d: Record<string, { pct: number }>
  symSeries: Record<string, number[]>
  variant?: 'pf' | 'eq'
}) {
  const d1 = sym1d[p.symbol]
  const d1pct = d1?.pct
  const d1usd = d1pct != null ? oneDUsdFromPricePct(p.markPrice, p.position, d1pct) : null
  const cost = p.costBasisMoney
  const totPct = cost > 0 ? ((p.positionValue - cost) / cost) * 100 : null
  const totUsd = p.fifoPnlUnrealized
  const avgPx = p.position > 0 ? p.costBasisMoney / p.position : p.costBasisPrice
  const series = symSeries[p.symbol] ?? []
  const sparkVals = series.length >= 8 ? series.slice(-260) : series
  const sparkUp = sparkVals.length >= 2 ? sparkVals[sparkVals.length - 1]! >= sparkVals[0]! : totUsd >= 0

  const R = variant === 'eq' ? 'bb-grid__r' : 'bb-pf-hc bb-pf-hc--r'

  return (
    <tr>
      <td className={variant === 'eq' ? undefined : 'bb-pf-hc bb-pf-hc--sym'}>
        {variant === 'eq' ? (
          <>
            <EquityLink symbol={p.symbol} unstyled className="bb-eq-badge bb-eq-badge--sym">
              {p.symbol}
            </EquityLink>
            <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
              {p.description}
            </div>
          </>
        ) : (
          <>
            <EquityLink symbol={p.symbol} className="bb-pf-sym">
              {p.symbol}
            </EquityLink>
            <span className="bb-pf-name">{p.description}</span>
          </>
        )}
      </td>
      <td className={`${R} mono`}>{formatUsd(p.markPrice)}</td>
      <td className={R}>
        {d1pct != null ? (
          <>
            <span className={d1pct >= 0 ? 'pos' : 'neg'}>{formatPctSigned(d1pct)}</span>
            {d1usd != null ? <div className="bb-pf-hldSub mono">{formatUsdSigned(d1usd)}</div> : null}
          </>
        ) : (
          '—'
        )}
      </td>
      <td className={R}>
        {totPct != null ? (
          <>
            <span className={totPct >= 0 ? 'pos' : 'neg'}>{formatPctSigned(totPct)}</span>
            <div className="bb-pf-hldSub mono">{formatUsdSigned(totUsd)}</div>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className={R}>
        <div className="mono">{formatUsd(p.positionValue)}</div>
        <div className="bb-pf-hldSub mono muted">{formatUsd(cost)}</div>
      </td>
      <td className={R}>
        <div className="mono">{p.percentOfNav.toFixed(2)}%</div>
        <div className="bb-pf-hldSub mono muted">{p.position}</div>
      </td>
      <td className={`${R} mono`}>{formatUsd(avgPx)}</td>
      <td className={variant === 'eq' ? 'bb-grid__r' : 'bb-pf-hc bb-pf-hc--spark'}>
        <div className="bb-pf-hldSpark bb-strip__spark">
          {sparkVals.length >= 2 ? <StripSparkline values={sparkVals} up={sparkUp} /> : <span className="muted">—</span>}
        </div>
      </td>
    </tr>
  )
}
