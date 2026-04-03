export const EQUITY_CHART_RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const

export type EquityChartRange = (typeof EQUITY_CHART_RANGES)[number]
