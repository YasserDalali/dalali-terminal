import { formatUsd } from '../../../utils/formatMoney'

export { formatUsd }

export function formatUsdMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  const body = formatUsd(Math.abs(n))
  return `${n < 0 ? '-' : ''}US$${body}`
}

export function formatUsdSigned(n: number) {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n > 0) return `+US$${abs}`
  if (n < 0) return `-US$${abs}`
  return 'US$0.00'
}

export function formatPctSigned(n: number) {
  if (!Number.isFinite(n)) return '—'
  const s = `${Math.abs(n).toFixed(2)}%`
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : '0%'
}

export function formatFlexYyyymmdd(s: string) {
  if (!/^\d{8}$/.test(s)) return s || '—'
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}
