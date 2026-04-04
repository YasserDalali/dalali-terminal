/** Backend base: empty in dev (Vite proxies /api), or VITE_PORTFOLIO_API_BASE in prod. */
export function portfolioApiPrefix(): string {
  return (import.meta.env.VITE_PORTFOLIO_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
}

export function portfolioApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${portfolioApiPrefix()}${p}`
}
