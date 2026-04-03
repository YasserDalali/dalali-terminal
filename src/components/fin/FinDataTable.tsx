import { useMemo, useState, type ReactNode } from 'react'

/**
 * Search + pagination shell around a custom `bb-grid` table (Markets-style).
 * Renders `children(pagedRows)` inside a scroll region.
 */
export function FinDataTableShell<T>({
  rows,
  pageSize = 25,
  title,
  searchPlaceholder = 'Search…',
  filterRow,
  children,
  className,
}: {
  rows: T[]
  pageSize?: number
  title?: ReactNode
  searchPlaceholder?: string
  filterRow: (row: T, queryLower: string) => boolean
  children: (pagedRows: T[], ctx: { total: number; filtered: number; page: number; pages: number }) => ReactNode
  className?: string
}) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const ql = q.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!ql) return rows
    return rows.filter((row) => filterRow(row, ql))
  }, [rows, ql, filterRow])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const ctx = { total: rows.length, filtered: filtered.length, page: safePage, pages }

  return (
    <div className={`bb-finDataTable${className ? ` ${className}` : ''}`}>
      <div className="bb-finDataTable__toolbar">
        {title ? <div className="bb-finDataTable__title">{title}</div> : null}
        <input
          type="search"
          className="bb-finDataTable__search"
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(0)
          }}
          aria-label="Filter table"
          disabled={rows.length === 0}
        />
        <span className="bb-finDataTable__meta mono muted">
          {rows.length === 0 ? '0' : filtered.length === rows.length ? `${rows.length}` : `${filtered.length} / ${rows.length}`}
        </span>
        {filtered.length > pageSize ? (
          <div className="bb-finDataTable__pager">
            <button
              type="button"
              className="bb-btn bb-finDataTable__pgBtn"
              disabled={safePage <= 0}
              onClick={() =>
                setPage((p) => {
                  const cur = Math.min(p, pages - 1)
                  return Math.max(0, cur - 1)
                })
              }
            >
              Prev
            </button>
            <span className="mono muted">
              {safePage + 1} / {pages}
            </span>
            <button
              type="button"
              className="bb-btn bb-finDataTable__pgBtn"
              disabled={safePage >= pages - 1}
              onClick={() =>
                setPage((p) => {
                  const cur = Math.min(p, pages - 1)
                  return Math.min(pages - 1, cur + 1)
                })
              }
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
      <div className="bb-scroll bb-finDataTable__scroll">{children(paged, ctx)}</div>
    </div>
  )
}

export type FinDataTableCol<T> = {
  key: string
  header: ReactNode
  /** Cell td className (e.g. bb-grid__r mono) */
  className?: string
  thClassName?: string
  cell: (row: T, rowIndex: number) => ReactNode
  /** If set, row matches search when any column's searchText includes the query */
  searchText?: (row: T) => string
}

type FinDataTableProps<T> = {
  rows: T[]
  columns: FinDataTableCol<T>[]
  rowKey: (row: T, index: number) => string
  searchPlaceholder?: string
  pageSize?: number
  emptyText?: string
  /** Optional title shown in toolbar */
  title?: ReactNode
  className?: string
  /** When set, rows are clickable (e.g. open detail). */
  onRowClick?: (row: T) => void
}

export function FinDataTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = 'Search…',
  pageSize = 25,
  emptyText = 'No rows',
  title,
  className,
  onRowClick,
}: FinDataTableProps<T>) {
  const filterRow = useMemo(
    () => (row: T, ql: string) => {
      if (!ql) return true
      return columns.some((c) => (c.searchText?.(row) ?? '').toLowerCase().includes(ql))
    },
    [columns],
  )

  return (
    <FinDataTableShell
      rows={rows}
      pageSize={pageSize}
      title={title}
      searchPlaceholder={searchPlaceholder}
      filterRow={filterRow}
      className={className}
    >
      {(pageRows) => (
        <table className="bb-grid">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.thClassName}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </FinDataTableShell>
  )
}
