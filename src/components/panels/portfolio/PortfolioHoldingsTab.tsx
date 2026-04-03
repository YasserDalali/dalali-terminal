import { useMemo, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IbkrFlexPortfolio, IbkrNavHistoryPoint, IbkrPositionRow } from '../../../services/finance/ibkrFlexTypes'
import { equitySectorForSymbol } from './portfolioSectorMap'
import { positiveScalarDomain } from './portfolioChartUtils'
import { aggregateHoldingsBuckets, buildAllocationSankey } from './portfolioHoldingsBuckets'
import { FinDataTableShell } from '../../fin/FinDataTable'
import { PortfolioHoldingRow } from './PortfolioHoldingRow'
import { formatUsd, formatUsdMoney } from './portfolioFormat'

const PIE_COLORS = ['#378ADD', '#ff6600', '#7F77DD', '#1D9E75', '#D85A30', '#E24B4A', '#BA7517', '#639922']

type HoldSub = 'holdings' | 'instrument' | 'allocation' | 'sector'

function latestNavSnapshot(data: IbkrFlexPortfolio): IbkrNavHistoryPoint | null {
  if (data.navHistory.length) return data.navHistory[data.navHistory.length - 1]!
  const le = data.latestEquity
  if (!le) return null
  return {
    reportDate: le.reportDate,
    total: le.total,
    cash: le.cash,
    stock: le.stock,
    options: le.options,
    bonds: le.bonds,
    funds: le.funds,
  }
}

/** `pctBase` = denominator for % column (e.g. full NAV, or sum of rows for sector-only view). */
function PieBreakdownList({ rows, pctBase }: { rows: { name: string; value: number }[]; pctBase: number }) {
  if (!rows.length) return null
  return (
    <ul className="bb-pf-chartBreakdown">
      {rows.map((r, i) => (
        <li key={r.name} className="bb-pf-chartBreakdown__row">
          <span className="bb-pf-chartBreakdown__swatch" style={{ background: PIE_COLORS[i % PIE_COLORS.length]! }} />
          <span className="bb-pf-chartBreakdown__name">{r.name}</span>
          <span className="bb-pf-chartBreakdown__val mono">{formatUsdMoney(r.value)}</span>
          <span className="bb-pf-chartBreakdown__pct mono muted">
            {pctBase > 0 ? `${((r.value / pctBase) * 100).toFixed(2)}%` : '—'}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** On-slice labels (name + % of NAV) without relying on hover */
function makePieLabel(navTotal: number) {
  return (props: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    name?: string
    value?: number
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = '', value = 0 } = props
    if (!navTotal || !Number.isFinite(value) || value <= 0) return null
    const pct = (value / navTotal) * 100
    if (pct < 2.5) return null
    const rad = (Math.PI / 180) * midAngle
    const r = innerRadius + (outerRadius - innerRadius) * 0.55
    const x = cx + r * Math.cos(-rad)
    const y = cy + r * Math.sin(-rad)
    return (
      <text
        x={x}
        y={y}
        fill="#eaeaea"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
        style={{ pointerEvents: 'none' }}
      >
        {`${name} ${pct.toFixed(1)}%`}
      </text>
    )
  }
}

function SankeyFlowLegend({
  nodes,
  links,
  navTotal,
}: {
  nodes: { name: string }[]
  links: { source: number; target: number; value: number }[]
  navTotal: number
}) {
  if (!links.length) return null
  return (
    <table className="bb-pf-sankeyTable bb-grid">
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th className="bb-grid__r">Value</th>
          <th className="bb-grid__r">% NAV</th>
        </tr>
      </thead>
      <tbody>
        {links.map((l, i) => {
          const from = nodes[l.source]?.name ?? '—'
          const to = nodes[l.target]?.name ?? '—'
          const pct = navTotal > 0 ? (l.value / navTotal) * 100 : 0
          return (
            <tr key={`${l.source}-${l.target}-${i}`}>
              <td>{from}</td>
              <td>{to}</td>
              <td className="bb-grid__r mono">{formatUsdMoney(l.value)}</td>
              <td className="bb-grid__r mono muted">{pct.toFixed(2)}%</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function HoldingsTablePanel({
  positions,
  sym1d,
  symSeries,
  titleExtra,
}: {
  positions: IbkrPositionRow[]
  sym1d: Record<string, { pct: number }>
  symSeries: Record<string, number[]>
  titleExtra?: ReactNode
}) {
  return (
    <section className="bb-pf-holdSplit__tbl">
      <div className="bb-eq-hold__bar">
        <h2 className="bb-eq-sec__ttl">
          Holdings table{titleExtra ? <span className="muted"> {titleExtra}</span> : null}
        </h2>
      </div>
      <FinDataTableShell
        rows={positions}
        pageSize={15}
        searchPlaceholder="Search holdings…"
        filterRow={(p, ql) => p.symbol.toLowerCase().includes(ql) || p.description.toLowerCase().includes(ql)}
      >
        {(pageRows) => (
          <table className="bb-grid">
            <thead>
              <tr>
                <th>Ticker / name</th>
                <th className="bb-grid__r">Last price</th>
                <th className="bb-grid__r">1D return</th>
                <th className="bb-grid__r">Total return</th>
                <th className="bb-grid__r">Value / cost</th>
                <th className="bb-grid__r">Weight / sh</th>
                <th className="bb-grid__r">Avg price</th>
                <th className="bb-grid__r">1Y</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    {positions.length === 0 ? 'No positions' : 'No matches'}
                  </td>
                </tr>
              ) : (
                pageRows.map((p) => (
                  <PortfolioHoldingRow
                    key={`${p.symbol}-${p.side}`}
                    p={p}
                    sym1d={sym1d}
                    symSeries={symSeries}
                    variant="eq"
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </FinDataTableShell>
    </section>
  )
}

export function PortfolioHoldingsTab(props: {
  data: IbkrFlexPortfolio
  /** Kept for API compatibility; holdings use latest NAV only */
  fundingYmd: string
  sym1d: Record<string, { pct: number }>
  symSeries: Record<string, number[]>
}) {
  const { data, sym1d, symSeries } = props
  const [sub, setSub] = useState<HoldSub>('holdings')

  const snap = useMemo(() => latestNavSnapshot(data), [data])

  const buckets = useMemo(() => {
    const cash = snap?.cash ?? 0
    return aggregateHoldingsBuckets(data.positions, cash)
  }, [data.positions, snap?.cash])

  const navTotal = snap?.total ?? 0

  const holdingsPie = useMemo(() => {
    if (!snap || snap.total <= 0) return []
    const rows: { name: string; value: number }[] = data.positions.map((p) => ({
      name: p.symbol,
      value: Math.max(0, p.positionValue),
    }))
    const cash = Math.max(0, snap.cash)
    if (cash > 0) rows.push({ name: 'USD Cash', value: cash })
    return rows.filter((r) => r.value > 0)
  }, [data.positions, snap])

  const instrumentPie = useMemo(() => {
    if (!snap || snap.total <= 0) return []
    const cash = Math.max(0, snap.cash)
    const byType = new Map<string, number>()
    for (const p of data.positions) {
      const k = p.subCategory?.trim() || p.assetCategory || 'Other'
      byType.set(k, (byType.get(k) ?? 0) + Math.max(0, p.positionValue))
    }
    const rows: { name: string; value: number }[] = [...byType.entries()].map(([name, value]) => ({ name, value }))
    if (cash > 0) rows.push({ name: 'Cash / Currency', value: cash })
    return rows.filter((r) => r.value > 0)
  }, [data.positions, snap])

  const allocationPie = useMemo(() => {
    if (!snap || navTotal <= 0) return []
    const rows = [
      { name: 'ETFs', value: buckets.etf },
      { name: 'Stocks', value: buckets.stock },
      { name: 'Cash', value: buckets.cash },
      { name: 'Bonds', value: buckets.bond },
    ].filter((r) => r.value > 0.005)
    return rows
  }, [buckets, snap, navTotal])

  const sectorBars = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of data.positions) {
      const sec = equitySectorForSymbol(p.symbol)
      m.set(sec, (m.get(sec) ?? 0) + p.positionValue)
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [data.positions])

  const sankeyData = useMemo(
    () => buildAllocationSankey(data.positions, buckets),
    [data.positions, buckets],
  )

  const sankeyHeight = useMemo(() => {
    if (!sankeyData?.nodes.length) return 320
    const n = sankeyData.nodes.length
    return Math.min(720, Math.max(300, 72 + n * 20))
  }, [sankeyData])

  const sectorBarDomain = useMemo(
    () => positiveScalarDomain(
      sectorBars.map((b) => b.value),
      false,
    ),
    [sectorBars],
  )

  const pieAnimOff = { isAnimationActive: false as const }

  const donutBlock = (
    title: string,
    pieRows: { name: string; value: number }[],
    navForPct: number,
  ) => (
    <>
      <h2 className="bb-eq-sec__ttl">{title}</h2>
      <div className="bb-pf-donut">
        {pieRows.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieRows}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={1}
                  label={makePieLabel(navForPct)}
                  labelLine={false}
                  {...pieAnimOff}
                >
                  {pieRows.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]!} stroke="#111" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatUsdMoney(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
            <PieBreakdownList rows={pieRows} pctBase={navForPct} />
          </>
        ) : (
          <p className="muted">No data</p>
        )}
      </div>
    </>
  )

  return (
    <div className="bb-eq-sub bb-pf-holdingsTab">
      <div className="bb-eq-hold__top">
        <div className="bb-eq-hold__tabs" role="tablist">
          {(
            [
              ['holdings', 'HOLDINGS'],
              ['instrument', 'INSTRUMENT TYPE'],
              ['allocation', 'ASSET ALLOCATION'],
              ['sector', 'EQUITY SECTOR'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`bb-eq-hold__tab${sub === id ? ' bb-eq-hold__tab--on' : ''}`}
              onClick={() => setSub(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="bb-eq-sub__note muted">
        Holdings charts use the latest NAV snapshot and current Flex position marks. ETF / stock / bond split uses Flex
        categories (and description hints).
      </p>

      {sub === 'holdings' ? (
        <div className="bb-pf-holdSplit">
          <section className="bb-pf-holdSplit__chart bb-eq-chart">{donutBlock('Holdings chart', holdingsPie, navTotal)}</section>
          <HoldingsTablePanel positions={data.positions} sym1d={sym1d} symSeries={symSeries} />
        </div>
      ) : null}

      {sub === 'instrument' ? (
        <div className="bb-pf-holdSplit">
          <section className="bb-pf-holdSplit__chart bb-eq-chart">{donutBlock('Instrument type', instrumentPie, navTotal)}</section>
          <HoldingsTablePanel
            positions={data.positions}
            sym1d={sym1d}
            symSeries={symSeries}
            titleExtra="· by instrument"
          />
        </div>
      ) : null}

      {sub === 'allocation' ? (
        <div className="bb-pf-holdSplit">
          <section className="bb-pf-holdSplit__chart bb-eq-chart">{donutBlock('Asset allocation', allocationPie, navTotal)}</section>
          <HoldingsTablePanel
            positions={data.positions}
            sym1d={sym1d}
            symSeries={symSeries}
            titleExtra="· by sleeve"
          />
        </div>
      ) : null}

      {sub === 'sector' ? (
        <div className="bb-pf-holdSplit bb-pf-holdSplit--single">
          <section className="bb-eq-chart bb-pf-sectorFlow">
            <h2 className="bb-eq-sec__ttl">Equity sleeve flow</h2>
            {sankeyData && sankeyData.links.length > 0 ? (
              <>
                <div className="bb-pf-sankey">
                  <ResponsiveContainer width="100%" height={sankeyHeight}>
                    <Sankey
                      data={sankeyData}
                      nodePadding={24}
                      nodeWidth={14}
                      iterations={64}
                      link={{ stroke: '#a08020', strokeOpacity: 0.45 }}
                      node={{ fill: '#2a2a2a', stroke: '#555' }}
                      margin={{ top: 16, right: 32, bottom: 16, left: 32 }}
                    >
                      <Tooltip formatter={(v) => formatUsdMoney(Number(v ?? 0))} />
                    </Sankey>
                  </ResponsiveContainer>
                </div>
                <SankeyFlowLegend nodes={sankeyData.nodes} links={sankeyData.links} navTotal={navTotal} />
              </>
            ) : (
              <p className="muted">No flow data</p>
            )}
            <h2 className="bb-eq-sec__ttl" style={{ marginTop: 12 }}>
              Sector by sector (value)
            </h2>
            <div className="bb-pf-barChart">
              {sectorBars.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(120, sectorBars.length * 36)}>
                    <BarChart
                      layout="vertical"
                      data={sectorBars}
                      margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
                    >
                      <XAxis
                        type="number"
                        tick={{ fill: '#888', fontSize: 10 }}
                        tickFormatter={(x) => formatUsd(Number(x))}
                        domain={sectorBarDomain ?? [0, 'auto']}
                      />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#aaa', fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatUsdMoney(Number(v ?? 0))} />
                      <Bar dataKey="value" radius={[0, 2, 2, 0]} isAnimationActive={false}>
                        {sectorBars.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]!} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          fill="#ccc"
                          fontSize={10}
                          className="mono"
                          formatter={(v) => {
                            const n = Number(v)
                            return Number.isFinite(n) ? formatUsd(n) : ''
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <PieBreakdownList
                    rows={sectorBars.map((s) => ({ name: s.name, value: s.value }))}
                    pctBase={sectorBars.reduce((a, s) => a + s.value, 0)}
                  />
                </>
              ) : (
                <p className="muted">No sectors</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
