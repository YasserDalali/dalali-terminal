/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IBKR_FLEX_TOKEN?: string
  readonly VITE_IBKR_FLEX_QUERY_ID?: string
  /** Optional: e.g. /dalali-finance.xml in public/ to parse without calling IBKR */
  readonly VITE_IBKR_FLEX_FIXTURE_URL?: string
  /** When true, portfolio loads from GET /api/portfolio (Redis-backed API); IBKR token stays on server only */
  readonly VITE_USE_PORTFOLIO_API?: string
  /** Optional absolute API origin (e.g. http://localhost:8787). Empty = same-origin /api (Vite proxy in dev) */
  readonly VITE_PORTFOLIO_API_BASE?: string
  /** Client poll interval in ms (min 5000). Default 30000 */
  readonly VITE_PORTFOLIO_POLL_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
