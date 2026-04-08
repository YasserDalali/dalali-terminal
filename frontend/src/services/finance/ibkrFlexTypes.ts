/** Parsed IBKR Flex Web Service statement slice used for the finance profile overview. */
export interface IbkrFlexStatementMeta {
  accountId: string
  fromDate: string
  toDate: string
  period: string
  whenGenerated: string
}

export interface IbkrFlexEquitySnapshot {
  reportDate: string
  currency: string
  total: number
  cash: number
  stock: number
  options: number
  bonds: number
  funds: number
}

/** Daily total NAV / allocation from EquitySummaryByReportDateInBase (base currency). */
export interface IbkrNavHistoryPoint {
  reportDate: string
  total: number
  cash: number
  stock: number
  options: number
  bonds: number
  funds: number
}

export interface IbkrTradeRow {
  tradeID: string
  tradeDate: string
  dateTime: string
  symbol: string
  description: string
  assetCategory: string
  buySell: string
  quantity: number
  tradePrice: number
  proceeds: number
  netCash: number
  fifoPnlRealized: number
  mtmPnl: number
  ibCommission: number
  currency: string
}

export interface IbkrPositionRow {
  symbol: string
  description: string
  assetCategory: string
  subCategory: string
  side: string
  position: number
  markPrice: number
  costBasisPrice: number
  positionValue: number
  costBasisMoney: number
  fifoPnlUnrealized: number
  percentOfNav: number
  currency: string
  reportDate: string
}

/** Selected ChangeInNAV fields for period attribution. */
export interface IbkrChangeInNavSummary {
  fromDate: string
  toDate: string
  currency: string
  startingValue: number
  endingValue: number
  mtm: number
  realized: number
  changeInUnrealized: number
  depositsWithdrawals: number
  dividends: number
  withholdingTax: number
  commissions: number
  interest: number
  brokerFees: number
  advisorFees: number
  clientFees: number
  otherFees: number
}

export interface IbkrCashSummary {
  currencyLabel: string
  startingCash: number
  endingCash: number
  endingSettledCash: number
}

export interface IbkrFlexPortfolio {
  queryName?: string
  flexType?: string
  statement: IbkrFlexStatementMeta
  /** Core account fields from AccountInformation */
  account: {
    name: string
    accountId: string
    currency: string
    accountType: string
    customerType: string
    primaryEmail: string
    country: string
    city: string
    street: string
    ibEntity: string
    tradingPermissions: string
    accountCapabilities: string
    dateOpened: string
    dateFunded: string
  }
  latestEquity: IbkrFlexEquitySnapshot | null
  /** Sorted ascending by reportDate */
  navHistory: IbkrNavHistoryPoint[]
  trades: IbkrTradeRow[]
  positions: IbkrPositionRow[]
  changeInNav: IbkrChangeInNavSummary | null
  cashSummary: IbkrCashSummary | null
}

/** @deprecated Use IbkrFlexPortfolio — same shape with extra portfolio fields */
export type IbkrFlexProfileOverview = IbkrFlexPortfolio
