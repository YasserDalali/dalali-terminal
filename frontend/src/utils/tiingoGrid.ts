/** Normalize Tiingo fundamentals JSON into simple metric × period grids for tables. */

export function unwrapTiingoRecordArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const k of ['data', 'results', 'quarterlyResults', 'statements']) {
      if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[]
    }
  }
  return []
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else return undefined
  }
  return cur
}

const PERIOD_SKIP = new Set([
  'date',
  'reportDate',
  'filingDate',
  'periodEndDate',
  'endDate',
  'year',
  'quarter',
  'symbol',
  'ticker',
  'overview',
])

function periodLabel(row: Record<string, unknown>, i: number): string {
  for (const k of ['date', 'reportDate', 'filingDate', 'periodEndDate', 'endDate']) {
    const v = row[k]
    if (v != null) return String(v).slice(0, 10)
  }
  const y = row.year
  const q = row.quarter
  if (y != null && q != null) return `${y} Q${q}`
  return `P${i + 1}`
}

function collectKeys(rows: Record<string, unknown>[], prefix: string): string[] {
  const keys = new Set<string>()
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      if (PERIOD_SKIP.has(k)) continue
      const path = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        for (const sub of collectKeys([v as Record<string, unknown>], path)) {
          keys.add(sub)
        }
      } else {
        keys.add(path)
      }
    }
  }
  return [...keys].sort()
}

function formatCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '—'
    if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(2)}K`
    return v.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  const s = String(v)
  return s.length > 48 ? `${s.slice(0, 45)}…` : s
}

export type MetricGrid = {
  columns: string[]
  rows: { label: string; values: string[] }[]
}

export function statementsToMetricGrid(data: unknown): MetricGrid {
  const rows = unwrapTiingoRecordArray(data)
  if (!rows.length) return { columns: [], rows: [] }
  const columns = rows.map(periodLabel)
  const keys = collectKeys(rows, '')
  const metricRows = keys.map((label) => ({
    label,
    values: rows.map((r) => formatCell(getNested(r, label))),
  }))
  return { columns, rows: metricRows }
}

export function filterGridBySubtab(grid: MetricGrid, sub: string): MetricGrid {
  const s = sub.toLowerCase()
  const match = (label: string) => {
    const l = label.toLowerCase()
    if (s.includes('income') || s === 'income statement') {
      return (
        /revenue|income|ebit|eps|earnings|gross|operating|expense|tax|interest|nett?[\s_]?income/.test(l) ||
        l.includes('incomestatement') ||
        l.includes('income_statement')
      )
    }
    if (s.includes('balance')) {
      return (
        /asset|liabilit|equity|receivable|payable|inventory|debt|cash|goodwill|retained/.test(l) ||
        l.includes('balancesheet') ||
        l.includes('balance_sheet')
      )
    }
    if (s.includes('cash')) {
      return (
        /cashflow|cash[\s_]?flow|cfo|cfi|cff|operating activities|investing|financing/.test(l) ||
        l.includes('cashflow') ||
        l.includes('cash_flow')
      )
    }
    return true
  }
  return { columns: grid.columns, rows: grid.rows.filter((r) => match(r.label)) }
}
