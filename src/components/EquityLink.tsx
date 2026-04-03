import { Link, type LinkProps } from 'react-router-dom'
import { normalizeEquitySymbol } from '../data/equitySymbol'
import { equityHref } from '../navigation/equityRoutes'

export type EquityLinkVariant = 'inline' | 'pill'

type EquityLinkProps = Omit<LinkProps, 'to'> & {
  symbol: string
  children?: React.ReactNode
  variant?: EquityLinkVariant
  /** If true, only `className` is applied (e.g. heatmap tiles). */
  unstyled?: boolean
}

/** Router link to `/equity/:ticker` — use for tickers anywhere in the app. */
export function EquityLink({
  symbol,
  children,
  className,
  variant = 'inline',
  unstyled,
  ...rest
}: EquityLinkProps) {
  const s = normalizeEquitySymbol(symbol)
  const base = unstyled ? '' : variant === 'pill' ? 'bb-eq-peer' : 'bb-tkr-link'
  const cn = [base, className].filter(Boolean).join(' ')
  return (
    <Link to={equityHref(s)} className={cn} {...rest}>
      {children ?? s}
    </Link>
  )
}
