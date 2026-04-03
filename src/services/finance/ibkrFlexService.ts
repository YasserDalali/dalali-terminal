import { XMLParser } from 'fast-xml-parser'
import type {
  IbkrCashSummary,
  IbkrChangeInNavSummary,
  IbkrFlexEquitySnapshot,
  IbkrFlexPortfolio,
  IbkrFlexStatementMeta,
  IbkrNavHistoryPoint,
  IbkrPositionRow,
  IbkrTradeRow,
} from './ibkrFlexTypes'

const FLEX_PROXY_PREFIX = '/ibkr-flex'

/** Browser: relative proxy. Server: pass `flexBaseUrl` e.g. https://gdcdyn.interactivebrokers.com/Universal/servlet */
function flexUrl(
  servlet: 'SendRequest' | 'GetStatement',
  query: Record<string, string>,
  flexBaseUrl?: string,
) {
  const path = `FlexStatementService.${servlet}`
  const qs = new URLSearchParams({ ...query, v: '3' })
  if (flexBaseUrl) {
    const base = flexBaseUrl.replace(/\/$/, '')
    return `${base}/${path}?${qs.toString()}`
  }
  return `${FLEX_PROXY_PREFIX}/${path}?${qs.toString()}`
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function parseFlexSendResponse(xml: string): { referenceCode: string } | { error: string } {
  const status = xml.match(/<Status>([^<]+)<\/Status>/i)?.[1]?.trim() ?? ''
  const errMsg = xml.match(/<ErrorMessage>([^<]*)<\/ErrorMessage>/i)?.[1]?.trim()
  if (status && !/^success$/i.test(status)) {
    return { error: errMsg || status || 'SendRequest failed' }
  }
  const referenceCode = xml.match(/<ReferenceCode>([^<]+)<\/ReferenceCode>/i)?.[1]?.trim()
  if (!referenceCode) {
    return { error: errMsg || 'No ReferenceCode in SendRequest response' }
  }
  return { referenceCode }
}

function num(s: string | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

const statementParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
})

function parseChangeInNav(raw: Record<string, string> | undefined): IbkrChangeInNavSummary | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    fromDate: String(raw.fromDate ?? ''),
    toDate: String(raw.toDate ?? ''),
    currency: String(raw.currency ?? 'USD'),
    startingValue: num(raw.startingValue),
    endingValue: num(raw.endingValue),
    mtm: num(raw.mtm),
    realized: num(raw.realized),
    changeInUnrealized: num(raw.changeInUnrealized),
    depositsWithdrawals: num(raw.depositsWithdrawals),
    dividends: num(raw.dividends),
    withholdingTax: num(raw.withholdingTax),
    commissions: num(raw.commissions),
    interest: num(raw.interest),
    brokerFees: num(raw.brokerFees),
    advisorFees: num(raw.advisorFees),
    clientFees: num(raw.clientFees),
    otherFees: num(raw.otherFees),
  }
}

function parseCashSummary(stmt: Record<string, unknown>, accountCurrency: string): IbkrCashSummary | null {
  const cashReport = stmt.CashReport as Record<string, unknown> | undefined
  if (!cashReport) return null
  const rows = asArray(cashReport.CashReportCurrency as Record<string, string> | Record<string, string>[] | undefined)
  if (rows.length === 0) return null
  const base =
    rows.find((r) => r.levelOfDetail === 'BaseCurrency' || r.currency === 'BASE_SUMMARY') ?? rows[0]
  if (!base) return null
  return {
    currencyLabel: String(base.currency ?? accountCurrency),
    startingCash: num(base.startingCash),
    endingCash: num(base.endingCash),
    endingSettledCash: num(base.endingSettledCash),
  }
}

function parseTrades(stmt: Record<string, unknown>): IbkrTradeRow[] {
  const trades = stmt.Trades as Record<string, unknown> | undefined
  const rows = asArray(trades?.Trade as Record<string, string> | Record<string, string>[] | undefined)
  return rows.map((t) => ({
    tradeID: String(t.tradeID ?? ''),
    tradeDate: String(t.tradeDate ?? ''),
    dateTime: String(t.dateTime ?? ''),
    symbol: String(t.symbol ?? ''),
    description: String(t.description ?? ''),
    assetCategory: String(t.assetCategory ?? ''),
    buySell: String(t.buySell ?? ''),
    quantity: num(t.quantity),
    tradePrice: num(t.tradePrice),
    proceeds: num(t.proceeds),
    netCash: num(t.netCash),
    fifoPnlRealized: num(t.fifoPnlRealized),
    mtmPnl: num(t.mtmPnl),
    ibCommission: num(t.ibCommission),
    currency: String(t.currency ?? 'USD'),
  }))
}

function parsePositions(stmt: Record<string, unknown>): IbkrPositionRow[] {
  const open = stmt.OpenPositions as Record<string, unknown> | undefined
  const rows = asArray(open?.OpenPosition as Record<string, string> | Record<string, string>[] | undefined)
  return rows
    .filter((p) => String(p.levelOfDetail ?? '') === 'SUMMARY')
    .map((p) => ({
      symbol: String(p.symbol ?? ''),
      description: String(p.description ?? ''),
      assetCategory: String(p.assetCategory ?? ''),
      subCategory: String(p.subCategory ?? ''),
      side: String(p.side ?? ''),
      position: num(p.position),
      markPrice: num(p.markPrice),
      costBasisPrice: num(p.costBasisPrice),
      positionValue: num(p.positionValue),
      costBasisMoney: num(p.costBasisMoney),
      fifoPnlUnrealized: num(p.fifoPnlUnrealized),
      percentOfNav: num(p.percentOfNAV),
      currency: String(p.currency ?? 'USD'),
      reportDate: String(p.reportDate ?? ''),
    }))
}

/** Parse FlexQueryResponse XML (dalali-finance.xml shape) into portfolio data. */
export function parseFlexStatementXml(xml: string): IbkrFlexPortfolio {
  if (/<Status>\s*Fail\s*<\/Status>/i.test(xml) || /<ErrorCode>/i.test(xml)) {
    const msg = xml.match(/<ErrorMessage>([^<]*)<\/ErrorMessage>/i)?.[1]?.trim()
    throw new Error(msg || 'Flex GetStatement returned an error')
  }

  const root = statementParser.parse(xml) as Record<string, unknown>
  const fr = root.FlexQueryResponse as Record<string, unknown> | undefined
  if (!fr) {
    throw new Error('Unexpected XML: missing FlexQueryResponse')
  }

  const queryName = typeof fr['queryName'] === 'string' ? fr['queryName'] : undefined
  const flexType = typeof fr['type'] === 'string' ? fr['type'] : undefined

  const flexStatements = fr.FlexStatements as Record<string, unknown> | undefined
  const flexStatement = flexStatements?.FlexStatement as Record<string, unknown> | Record<string, unknown>[] | undefined
  const stmt = asArray(flexStatement)[0]
  if (!stmt) {
    throw new Error('No FlexStatement in response')
  }

  const st = stmt as Record<string, unknown>
  const s = stmt as Record<string, string>
  const accountId = String(s.accountId ?? '')
  const statementMeta: IbkrFlexStatementMeta = {
    accountId,
    fromDate: String(s.fromDate ?? ''),
    toDate: String(s.toDate ?? ''),
    period: String(s.period ?? ''),
    whenGenerated: String(s.whenGenerated ?? ''),
  }

  const ai = stmt.AccountInformation as Record<string, string> | undefined
  if (!ai) {
    throw new Error('No AccountInformation in FlexStatement')
  }

  const account = {
    name: String(ai.name ?? ''),
    accountId: String(ai.accountId ?? accountId),
    currency: String(ai.currency ?? ''),
    accountType: String(ai.accountType ?? ''),
    customerType: String(ai.customerType ?? ''),
    primaryEmail: String(ai.primaryEmail ?? ''),
    country: String(ai.country ?? ''),
    city: String(ai.city ?? ''),
    street: String(ai.street ?? ''),
    ibEntity: String(ai.ibEntity ?? ''),
    tradingPermissions: String(ai.tradingPermissions ?? ''),
    accountCapabilities: String(ai.accountCapabilities ?? ''),
    dateOpened: String(ai.dateOpened ?? ''),
    dateFunded: String(ai.dateFunded ?? ''),
  }

  const eqInBase = stmt.EquitySummaryInBase as Record<string, unknown> | undefined
  const eqRows = asArray(eqInBase?.EquitySummaryByReportDateInBase as Record<string, string> | Record<string, string>[] | undefined)

  const navHistory: IbkrNavHistoryPoint[] = [...eqRows]
    .sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)))
    .map((row) => ({
      reportDate: String(row.reportDate ?? ''),
      total: num(row.total),
      cash: num(row.cash),
      stock: num(row.stock),
      options: num(row.options),
      bonds: num(row.bonds),
      funds: num(row.funds),
    }))

  let latestEquity: IbkrFlexEquitySnapshot | null = null
  if (navHistory.length > 0) {
    const sortedRaw = [...eqRows].sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)))
    const lastRaw = sortedRaw[sortedRaw.length - 1]!
    const last = navHistory[navHistory.length - 1]!
    latestEquity = {
      reportDate: last.reportDate,
      currency: String(lastRaw.currency ?? account.currency ?? 'USD'),
      total: last.total,
      cash: last.cash,
      stock: last.stock,
      options: last.options,
      bonds: last.bonds,
      funds: last.funds,
    }
  }

  const changeInNav = parseChangeInNav(stmt.ChangeInNav as Record<string, string> | undefined)
  const cashSummary = parseCashSummary(st, account.currency)
  const trades = parseTrades(st).sort((a, b) => {
    const dt = b.tradeDate.localeCompare(a.tradeDate)
    return dt !== 0 ? dt : b.dateTime.localeCompare(a.dateTime)
  })
  const positions = parsePositions(st).sort((a, b) => Math.abs(b.positionValue) - Math.abs(a.positionValue))

  return {
    queryName,
    flexType,
    statement: statementMeta,
    account,
    latestEquity,
    navHistory,
    trades,
    positions,
    changeInNav,
    cashSummary,
  }
}

export async function requestFlexReferenceCode(
  token: string,
  queryId: string,
  flexBaseUrl?: string,
): Promise<string> {
  const url = flexUrl('SendRequest', { t: token, q: queryId }, flexBaseUrl)
  const res = await fetch(url)
  const xml = await res.text()
  const parsed = parseFlexSendResponse(xml)
  if ('error' in parsed) {
    throw new Error(parsed.error)
  }
  return parsed.referenceCode
}

export async function fetchFlexStatementXml(
  token: string,
  refCode: string,
  waitMs = 5000,
  flexBaseUrl?: string,
): Promise<string> {
  await sleep(waitMs)
  const url = flexUrl('GetStatement', { t: token, q: refCode }, flexBaseUrl)
  const res = await fetch(url)
  return res.text()
}

/**
 * SendRequest → wait → GetStatement → parse.
 * Retries GetStatement once if the first body looks like a transient failure.
 */
export async function loadIbkrFlexPortfolio(
  token: string,
  queryId: string,
  options?: { pollMs?: number; flexBaseUrl?: string },
): Promise<IbkrFlexPortfolio> {
  const pollMs = options?.pollMs ?? 5000
  const flexBaseUrl = options?.flexBaseUrl
  const ref = await requestFlexReferenceCode(token, queryId, flexBaseUrl)
  let xml = await fetchFlexStatementXml(token, ref, pollMs, flexBaseUrl)
  try {
    return parseFlexStatementXml(xml)
  } catch {
    xml = await fetchFlexStatementXml(token, ref, 3000, flexBaseUrl)
    return parseFlexStatementXml(xml)
  }
}

/** @deprecated Use loadIbkrFlexPortfolio */
export const loadIbkrFlexProfileOverview = loadIbkrFlexPortfolio

/** Load from a local/public XML file (e.g. copy dalali-finance.xml to /public and set VITE_IBKR_FLEX_FIXTURE_URL). */
export async function loadIbkrFlexPortfolioFromFixture(fixtureUrl: string): Promise<IbkrFlexPortfolio> {
  const res = await fetch(fixtureUrl)
  if (!res.ok) {
    throw new Error(`Fixture fetch failed: ${res.status}`)
  }
  const xml = await res.text()
  return parseFlexStatementXml(xml)
}

/** @deprecated Use loadIbkrFlexPortfolioFromFixture */
export const loadIbkrFlexProfileFromFixture = loadIbkrFlexPortfolioFromFixture

export function getIbkrFlexEnv(): {
  token: string
  queryId: string
  fixtureUrl: string
  usePortfolioApi: boolean
  portfolioApiBase: string
  portfolioPollMs: number
} {
  const token = (import.meta.env.VITE_IBKR_FLEX_TOKEN as string | undefined)?.trim() ?? ''
  const queryId = (import.meta.env.VITE_IBKR_FLEX_QUERY_ID as string | undefined)?.trim() ?? ''
  const fixtureUrl = (import.meta.env.VITE_IBKR_FLEX_FIXTURE_URL as string | undefined)?.trim() ?? ''
  const usePortfolioApi =
    import.meta.env.VITE_USE_PORTFOLIO_API === 'true' || import.meta.env.VITE_USE_PORTFOLIO_API === '1'
  const portfolioApiBase = (import.meta.env.VITE_PORTFOLIO_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
  const pollRaw = import.meta.env.VITE_PORTFOLIO_POLL_MS
  const portfolioPollMs = pollRaw ? Math.max(5000, Number(pollRaw) || 30000) : 30000
  return { token, queryId, fixtureUrl, usePortfolioApi, portfolioApiBase, portfolioPollMs }
}

export type PortfolioApiEnvelope = {
  ok: boolean
  data?: IbkrFlexPortfolio
  error?: string | null
  cachedAt?: string | null
  refreshing?: boolean
}

/** Cached portfolio from backend (Redis). `apiBase` is '' for same-origin /api (Vite proxy). */
export async function fetchPortfolioFromApi(apiBase: string): Promise<PortfolioApiEnvelope> {
  const prefix = apiBase ? `${apiBase}` : ''
  try {
    const res = await fetch(`${prefix}/api/portfolio`)
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, cachedAt: null }
    }
    return (await res.json()) as PortfolioApiEnvelope
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), cachedAt: null }
  }
}

export async function requestPortfolioSync(apiBase: string): Promise<PortfolioApiEnvelope> {
  const prefix = apiBase ? `${apiBase}` : ''
  try {
    const res = await fetch(`${prefix}/api/portfolio/sync`, { method: 'POST' })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, cachedAt: null }
    }
    return (await res.json()) as PortfolioApiEnvelope
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), cachedAt: null }
  }
}
