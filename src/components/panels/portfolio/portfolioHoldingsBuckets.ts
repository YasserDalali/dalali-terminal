import type { IbkrPositionRow } from '../../../services/finance/ibkrFlexTypes'

export type HoldingsBucket = 'etf' | 'stock' | 'bond'

/** Classify a position for allocation / Sankey (Flex assetCategory + subCategory + description hints). */
export function bucketPosition(p: IbkrPositionRow): HoldingsBucket {
  const ac = (p.assetCategory ?? '').toUpperCase()
  const sc = (p.subCategory ?? '').toUpperCase()
  const desc = (p.description ?? '').toUpperCase()

  if (ac.includes('BOND') || sc.includes('BOND') || desc.includes('TREASURY BOND') || desc.includes(' CORP BOND')) {
    return 'bond'
  }

  if (
    ac.includes('FUND') ||
    ac.includes('ETF') ||
    sc.includes('ETF') ||
    sc.includes('FUND') ||
    sc.includes('ETN') ||
    /\bETF\b/.test(desc) ||
    /\bETN\b/.test(desc)
  ) {
    return 'etf'
  }

  return 'stock'
}

export type PortfolioBucketTotals = {
  etf: number
  stock: number
  bond: number
  cash: number
  /** etf + stock */
  equities: number
}

export function aggregateHoldingsBuckets(positions: IbkrPositionRow[], settledCash: number): PortfolioBucketTotals {
  let etf = 0
  let stock = 0
  let bond = 0
  for (const p of positions) {
    const v = Math.max(0, p.positionValue)
    const b = bucketPosition(p)
    if (b === 'bond') bond += v
    else if (b === 'etf') etf += v
    else stock += v
  }
  return {
    etf,
    stock,
    bond,
    cash: Math.max(0, settledCash),
    equities: etf + stock,
  }
}

export type SankeyLink = { source: number; target: number; value: number }

function mergeBySymbol(positions: IbkrPositionRow[], bucket: HoldingsBucket): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of positions) {
    if (bucketPosition(p) !== bucket) continue
    const v = Math.max(0, p.positionValue)
    if (v <= 0) continue
    const sym = (p.symbol ?? '').trim() || '—'
    m.set(sym, (m.get(sym) ?? 0) + v)
  }
  return m
}

function sortedTickerEntries(m: Map<string, number>, minV: number): [string, number][] {
  return [...m.entries()]
    .filter(([, v]) => v >= minV)
    .sort((a, b) => b[1] - a[1])
}

/**
 * Portfolio → Equities | Cash | Bonds → Equities → ETFs | Stocks → each ticker (VOO, QQQ, … / AAPL, …).
 * Bonds stay a single sleeve (split per CUSIP later if needed).
 */
export function buildAllocationSankey(
  positions: IbkrPositionRow[],
  b: PortfolioBucketTotals,
): { nodes: { name: string }[]; links: SankeyLink[] } | null {
  const minV = 0.01
  const hasEq = b.equities >= minV
  const hasCash = b.cash >= minV
  const hasBond = b.bond >= minV
  const hasEtf = b.etf >= minV
  const hasStk = b.stock >= minV

  if (!hasEq && !hasCash && !hasBond) return null

  const etfBySym = mergeBySymbol(positions, 'etf')
  const stockBySym = mergeBySymbol(positions, 'stock')
  const etfTickers = sortedTickerEntries(etfBySym, minV)
  const stockTickers = sortedTickerEntries(stockBySym, minV)

  const etfFlowSum = etfTickers.reduce((s, [, v]) => s + v, 0)
  const stockFlowSum = stockTickers.reduce((s, [, v]) => s + v, 0)
  const etfIntoHub = etfTickers.length > 0 ? etfFlowSum : Math.max(b.etf, minV)
  const stockIntoHub = stockTickers.length > 0 ? stockFlowSum : Math.max(b.stock, minV)

  const nodes: { name: string }[] = [{ name: 'Portfolio' }]
  const links: SankeyLink[] = []
  let next = 1
  const ix = { portfolio: 0, equities: -1, cash: -1, bonds: -1, etfHub: -1, stockHub: -1 }

  if (hasEq) {
    ix.equities = next
    nodes.push({ name: 'Equities' })
    links.push({ source: 0, target: next, value: Math.max(b.equities, minV) })
    next += 1
  }
  if (hasCash) {
    ix.cash = next
    nodes.push({ name: 'Cash' })
    links.push({ source: 0, target: next, value: Math.max(b.cash, minV) })
    next += 1
  }
  if (hasBond) {
    ix.bonds = next
    nodes.push({ name: 'Bonds' })
    links.push({ source: 0, target: next, value: Math.max(b.bond, minV) })
    next += 1
  }

  if (hasEq && ix.equities >= 0) {
    if (hasEtf) {
      ix.etfHub = next
      nodes.push({ name: 'ETFs' })
      links.push({ source: ix.equities, target: next, value: Math.max(etfIntoHub, minV) })
      next += 1
      if (etfTickers.length > 0) {
        for (const [sym, v] of etfTickers) {
          nodes.push({ name: sym })
          links.push({ source: ix.etfHub, target: next, value: Math.max(v, minV) })
          next += 1
        }
      } else {
        nodes.push({ name: 'ETF (unsplit)' })
        links.push({ source: ix.etfHub, target: next, value: Math.max(etfIntoHub, minV) })
        next += 1
      }
    }
    if (hasStk) {
      ix.stockHub = next
      nodes.push({ name: 'Stocks' })
      links.push({ source: ix.equities, target: next, value: Math.max(stockIntoHub, minV) })
      next += 1
      if (stockTickers.length > 0) {
        for (const [sym, v] of stockTickers) {
          nodes.push({ name: sym })
          links.push({ source: ix.stockHub, target: next, value: Math.max(v, minV) })
          next += 1
        }
      } else {
        nodes.push({ name: 'Stock (unsplit)' })
        links.push({ source: ix.stockHub, target: next, value: Math.max(stockIntoHub, minV) })
        next += 1
      }
    }
  }

  return links.length ? { nodes, links } : null
}
