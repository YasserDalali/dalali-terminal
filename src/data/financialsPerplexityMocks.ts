/**
 * Perplexity Finance–style financial statement layouts (AMZN-class line items).
 * Column headers: fiscal year-ends; Key Stats extends through estimate years.
 */

import type { FinSubtab } from './equityTabMocks'

export type FinRow =
  | { kind: 'section'; label: string; sub?: boolean }
  | { kind: 'row'; label: string; values: (string | null)[]; italic?: boolean }

/** Four fiscal year-ends (reported) */
export const COLS_FOUR = ['12/31/2022', '12/31/2023', '12/31/2024', '12/31/2025'] as const

/** Key stats + forward estimates */
export const COLS_KEY = [
  '12/31/2022',
  '12/31/2023',
  '12/31/2024',
  '12/31/2025',
  '12/31/2026',
  '12/31/2027',
] as const

export const COLS_Q = ['6/30/2024', '9/30/2024', '12/31/2024', '3/31/2025'] as const

const v4 = (a: string, b: string, c: string, d: string): string[] => [a, b, c, d]
/** —— Key Stats (6 cols; index ≥4 = estimate styling) —— */
export const ROWS_KEY_STATS: FinRow[] = [
  { kind: 'row', label: 'Market Cap', values: ['962B', '1.06T', '1.24T', '1.52T', '1.68T', '1.82T'] },
  { kind: 'row', label: '- Cash', values: ['64.2B', '73.4B', '78.1B', '85.2B', '88.0B', '91.5B'] },
  { kind: 'row', label: '+ Debt', values: ['58.9B', '58.1B', '52.3B', '48.0B', '45.0B', '42.0B'] },
  { kind: 'row', label: 'Enterprise Value', values: ['957B', '1.02T', '1.19T', '1.45T', '1.60T', '1.73T'] },
  { kind: 'row', label: 'Revenue', values: ['514.0B', '574.8B', '637.9B', '691.0B', '742.0B', '798.0B'] },
  { kind: 'row', label: '% Growth', values: ['9.4%', '11.8%', '11.0%', '8.3%', '7.4%', '7.5%'], italic: true },
  { kind: 'row', label: 'Gross Profit', values: ['225.2B', '270.0B', '307.9B', '334.0B', '360.0B', '388.0B'] },
  { kind: 'row', label: '% Margin', values: ['43.8%', '47.0%', '48.3%', '48.3%', '48.5%', '48.6%'], italic: true },
  { kind: 'row', label: 'EBITDA', values: ['64.2B', '81.2B', '99.4B', '112.0B', '124.0B', '136.0B'] },
  { kind: 'row', label: '% Margin', values: ['12.5%', '14.1%', '15.6%', '16.2%', '16.7%', '17.0%'], italic: true },
  { kind: 'row', label: 'Net Income', values: ['-2.7B', '30.4B', '59.2B', '68.0B', '76.0B', '84.0B'] },
  { kind: 'row', label: '% Margin', values: ['-0.5%', '5.3%', '9.3%', '9.8%', '10.2%', '10.5%'], italic: true },
  { kind: 'row', label: 'Diluted EPS', values: ['-0.27', '2.90', '5.53', '6.58', '7.35', '8.12'] },
  { kind: 'row', label: '% Growth', values: ['—', '—', '90.7%', '19.0%', '11.7%', '10.5%'], italic: true },
  { kind: 'row', label: 'Operating Cash Flow', values: ['46.8B', '84.9B', '115.9B', '132.0B', '142.0B', '152.0B'] },
  { kind: 'row', label: 'CapEx', values: ['63.6B', '48.4B', '77.7B', '82.0B', '86.0B', '90.0B'] },
  { kind: 'row', label: 'Free Cash Flow', values: ['-16.8B', '36.5B', '38.2B', '50.0B', '56.0B', '62.0B'] },
]

/** —— Income Statement —— */
export const ROWS_INCOME: FinRow[] = [
  { kind: 'row', label: 'Total Revenues', values: v4('514.0B', '574.8B', '637.9B', '691.0B') },
  { kind: 'row', label: 'Cost of Sales', values: v4('288.8B', '304.8B', '330.0B', '357.0B') },
  { kind: 'row', label: 'Gross Profit', values: v4('225.2B', '270.0B', '307.9B', '334.0B') },
  { kind: 'row', label: 'Selling, General & Administrative Expenses', values: v4('111.2B', '118.0B', '125.4B', '132.0B') },
  { kind: 'row', label: 'Research & Development Expenses', values: v4('73.2B', '85.6B', '92.0B', '98.0B') },
  { kind: 'row', label: 'Other Operating Expenses', values: v4('2.1B', '2.4B', '2.6B', '2.8B') },
  { kind: 'row', label: 'Operating Profit', values: v4('38.5B', '64.0B', '87.9B', '101.2B') },
  { kind: 'row', label: 'Interest and Investment Income', values: v4('2.9B', '3.8B', '4.2B', '4.5B') },
  { kind: 'row', label: 'Interest Expense', values: v4('2.4B', '3.2B', '3.0B', '2.8B') },
  { kind: 'row', label: 'Non-Operating Income', values: v4('16.0B', '0.8B', '1.2B', '1.0B') },
  { kind: 'row', label: 'Total Non-Operating Income', values: v4('16.5B', '1.4B', '2.4B', '2.7B') },
  { kind: 'row', label: 'Income Before Provision for Income Taxes', values: v4('55.0B', '65.4B', '90.3B', '103.9B') },
  { kind: 'row', label: 'Provision for Income Taxes', values: v4('3.2B', '7.1B', '9.3B', '10.8B') },
  { kind: 'row', label: 'Consolidated Net Income', values: v4('51.8B', '58.3B', '81.0B', '93.1B') },
  { kind: 'row', label: 'Net Income Attributable to Minority Interests and Other', values: v4('0.1B', '0.2B', '0.2B', '0.2B') },
  { kind: 'row', label: 'Net Income Attributable to Common Shareholders', values: v4('-2.7B', '30.4B', '59.2B', '68.0B') },
  { kind: 'row', label: 'Basic EPS', values: v4('-0.27', '2.94', '5.59', '6.62') },
  { kind: 'row', label: 'Diluted EPS', values: v4('-0.27', '2.90', '5.53', '6.58') },
  { kind: 'row', label: 'Basic Weighted Average Shares Outstanding', values: v4('10.2B', '10.3B', '10.4B', '10.3B') },
  { kind: 'row', label: 'Diluted Weighted Average Shares Outstanding', values: v4('10.2B', '10.5B', '10.5B', '10.4B') },
  { kind: 'section', label: 'Margins', sub: true },
  { kind: 'row', label: 'Gross Margin', values: v4('43.8%', '47.0%', '48.3%', '48.3%'), italic: true },
  { kind: 'row', label: 'Operating Margin', values: v4('7.5%', '11.1%', '13.8%', '14.6%'), italic: true },
  { kind: 'row', label: 'EBITDA Margin', values: v4('12.5%', '14.1%', '15.6%', '16.2%'), italic: true },
  { kind: 'row', label: 'Net Profit Margin', values: v4('-0.5%', '5.3%', '9.3%', '9.8%'), italic: true },
  { kind: 'row', label: 'Pre-Tax Profit Margin', values: v4('10.7%', '11.4%', '14.2%', '15.0%'), italic: true },
  { kind: 'row', label: 'Effective Tax Rate', values: v4('5.8%', '10.8%', '10.3%', '10.4%'), italic: true },
]

/** —— Balance Sheet —— */
export const ROWS_BALANCE: FinRow[] = [
  { kind: 'section', label: 'Assets' },
  { kind: 'row', label: 'Cash and Cash Equivalents', values: v4('53.9B', '73.4B', '78.1B', '85.2B') },
  { kind: 'row', label: 'Short-Term Investments', values: v4('16.2B', '13.9B', '14.2B', '15.0B') },
  { kind: 'row', label: 'Total Cash and Cash Equivalents', values: v4('70.1B', '87.3B', '92.3B', '100.2B') },
  { kind: 'row', label: 'Accounts Receivable', values: v4('42.4B', '52.3B', '58.0B', '62.0B') },
  { kind: 'row', label: 'Total Trade Receivables', values: v4('45.8B', '55.1B', '61.2B', '65.5B') },
  { kind: 'row', label: 'Inventories', values: v4('34.4B', '33.3B', '35.2B', '36.8B') },
  { kind: 'row', label: 'Total Current Assets', values: v4('164.0B', '192.0B', '208.0B', '225.0B') },
  { kind: 'row', label: 'Net Property, Plant & Equipment', values: v4('216.0B', '198.0B', '205.0B', '212.0B') },
  { kind: 'row', label: 'Goodwill', values: v4('20.2B', '20.3B', '20.5B', '20.6B') },
  { kind: 'row', label: 'Other Long-Term Assets', values: v4('78.0B', '85.0B', '92.0B', '98.0B') },
  { kind: 'row', label: 'Total Assets', values: v4('478.2B', '495.4B', '525.5B', '555.6B') },
  { kind: 'section', label: 'Liabilities' },
  { kind: 'row', label: 'Accounts Payable', values: v4('79.6B', '84.4B', '88.0B', '91.0B') },
  { kind: 'row', label: 'Accrued Expenses', values: v4('62.0B', '68.0B', '72.0B', '75.0B') },
  { kind: 'row', label: 'Unearned Revenue', values: v4('13.2B', '14.8B', '16.0B', '17.2B') },
  { kind: 'row', label: 'Total Current Liabilities', values: v4('164.0B', '178.0B', '188.0B', '198.0B') },
  { kind: 'row', label: 'Long-Term Debt', values: v4('58.9B', '58.1B', '52.3B', '48.0B') },
  { kind: 'row', label: 'Leases', values: v4('72.0B', '68.0B', '65.0B', '62.0B') },
  { kind: 'row', label: 'Other Long-Term Liabilities', values: v4('28.0B', '30.0B', '32.0B', '34.0B') },
  { kind: 'row', label: 'Total Long-Term Liabilities', values: v4('158.9B', '156.1B', '149.3B', '144.0B') },
  { kind: 'row', label: 'Total Liabilities', values: v4('322.9B', '334.1B', '337.3B', '342.0B') },
  { kind: 'section', label: 'Equity' },
  { kind: 'row', label: 'Common Stock', values: v4('0.1B', '0.1B', '0.1B', '0.1B') },
  { kind: 'row', label: 'Treasury Stock', values: v4('-7.2B', '-8.0B', '-9.0B', '-10.0B') },
  { kind: 'row', label: 'Additional Paid-in Capital', values: v4('83.0B', '88.0B', '92.0B', '96.0B') },
  { kind: 'row', label: 'Accumulated Other Comprehensive Income', values: v4('-8.4B', '-7.2B', '-6.0B', '-5.0B') },
  { kind: 'row', label: 'Retained Earnings', values: v4('87.8B', '88.4B', '101.0B', '112.5B') },
  { kind: 'row', label: 'Total Common Shareholders\' Equity', values: v4('155.3B', '161.3B', '188.1B', '193.6B') },
  { kind: 'row', label: 'Total Shareholders\' Equity', values: v4('155.3B', '161.3B', '188.2B', '213.6B') },
  { kind: 'row', label: 'Total Liabilities and Shareholders\' Equity', values: v4('478.2B', '495.4B', '525.5B', '555.6B') },
]

/** —— Cash Flow —— */
export const ROWS_CASHFLOW: FinRow[] = [
  { kind: 'section', label: 'Operating Activities' },
  { kind: 'row', label: 'Net Income', values: v4('51.8B', '58.3B', '81.0B', '93.1B') },
  { kind: 'row', label: 'Depreciation & Amortization', values: v4('48.7B', '52.1B', '56.0B', '59.0B') },
  { kind: 'row', label: 'Share-Based Compensation Expense', values: v4('19.6B', '21.5B', '23.0B', '24.5B') },
  { kind: 'row', label: 'Other Adjustments', values: v4('12.0B', '14.0B', '15.0B', '16.0B') },
  { kind: 'row', label: 'Changes in Trade Receivables', values: v4('-8.2B', '-6.0B', '-5.0B', '-4.0B') },
  { kind: 'row', label: 'Changes in Inventories', values: v4('-4.2B', '1.1B', '-1.9B', '-1.6B') },
  { kind: 'row', label: 'Changes in Accounts Payable', values: v4('10.2B', '6.0B', '4.0B', '3.5B') },
  { kind: 'row', label: 'Changes in Accrued Expenses', values: v4('4.0B', '5.0B', '4.5B', '4.0B') },
  { kind: 'row', label: 'Changes in Unearned Revenue', values: v4('2.0B', '1.6B', '1.2B', '1.2B') },
  { kind: 'row', label: 'Changes in Other Operating Activities', values: v4('-6.5B', '-4.0B', '-3.0B', '-2.5B') },
  { kind: 'row', label: 'Cash from Operating Activities', values: v4('46.8B', '84.9B', '115.9B', '132.0B') },
  { kind: 'section', label: 'Investing Activities' },
  { kind: 'row', label: 'Capital Expenditure', values: v4('-63.6B', '-48.4B', '-77.7B', '-82.0B') },
  { kind: 'row', label: 'Proceeds from Sale of Property, Plant & Equipment', values: v4('0.8B', '1.0B', '1.1B', '1.2B') },
  { kind: 'row', label: 'Purchases of Investments', values: v4('-12.0B', '-8.0B', '-9.0B', '-10.0B') },
  { kind: 'row', label: 'Proceeds from Sale of Investments', values: v4('8.0B', '6.0B', '7.0B', '8.0B') },
  { kind: 'row', label: 'Other Investing Activities', values: v4('-2.0B', '-1.5B', '-1.2B', '-1.0B') },
  { kind: 'row', label: 'Cash from Investing Activities', values: v4('-68.8B', '-50.9B', '-79.8B', '-83.8B') },
  { kind: 'section', label: 'Financing Activities' },
  { kind: 'row', label: 'Issuance of Short-Term Debt', values: v4('2.0B', '1.0B', '0.5B', '0.5B') },
  { kind: 'row', label: 'Repayments of Short-Term Debt', values: v4('-3.0B', '-2.0B', '-1.5B', '-1.0B') },
  { kind: 'row', label: 'Net Issuance / (Repayments) of Short-Term Debt', values: v4('-1.0B', '-1.0B', '-1.0B', '-0.5B') },
  { kind: 'row', label: 'Issuance of Long-Term Debt', values: v4('8.0B', '5.0B', '4.0B', '3.0B') },
  { kind: 'row', label: 'Repayments of Long-Term Debt', values: v4('-10.0B', '-8.0B', '-6.0B', '-5.0B') },
  { kind: 'row', label: 'Net Issuance / (Repayments) of Long-Term Debt', values: v4('-2.0B', '-3.0B', '-2.0B', '-2.0B') },
  { kind: 'row', label: 'Repurchases of Common Shares', values: v4('-6.0B', '-8.0B', '-10.0B', '-12.0B') },
  { kind: 'row', label: 'Net Issuance / (Repurchases) of Common Shares', values: v4('-6.0B', '-8.0B', '-10.0B', '-12.0B') },
  { kind: 'row', label: 'Cash from Financing Activities', values: v4('-9.0B', '-11.0B', '-13.0B', '-14.5B') },
  { kind: 'row', label: 'Effect of Exchange Rate Changes on Cash and Cash Equivalents', values: v4('-1.2B', '-0.8B', '-0.6B', '-0.5B') },
  { kind: 'row', label: 'Increase / (Decrease) in Cash, Cash Equivalents and Restricted Cash', values: v4('-32.2B', '22.2B', '22.5B', '33.2B') },
]

/** —— Segments & KPIs —— */
export const ROWS_SEGMENTS: FinRow[] = [
  { kind: 'section', label: 'Revenue' },
  { kind: 'row', label: 'Online Stores Revenue', values: v4('220.0B', '212.0B', '208.0B', '205.0B') },
  { kind: 'row', label: 'Physical Stores Revenue', values: v4('19.2B', '20.1B', '21.0B', '21.5B') },
  { kind: 'row', label: 'Third-Party (3P) Seller Services Revenue', values: v4('117.7B', '140.1B', '156.0B', '168.0B') },
  { kind: 'row', label: 'Advertising Services Revenue', values: v4('37.7B', '46.9B', '56.0B', '64.0B') },
  { kind: 'row', label: 'Subscription Services Revenue', values: v4('35.2B', '40.2B', '44.0B', '48.0B') },
  { kind: 'row', label: 'AWS Revenue', values: v4('80.1B', '90.8B', '107.6B', '122.0B') },
  { kind: 'row', label: 'Other Segment Revenue', values: v4('4.1B', '4.7B', '5.3B', '5.5B') },
  { kind: 'section', label: 'Revenue by Geography', sub: true },
  { kind: 'row', label: 'AWS Revenue', values: v4('80.1B', '90.8B', '107.6B', '122.0B') },
  { kind: 'row', label: 'North America Revenue', values: v4('315.9B', '352.8B', '387.5B', '418.0B') },
  { kind: 'row', label: 'International Revenue', values: v4('118.0B', '131.2B', '142.8B', '151.0B') },
  { kind: 'section', label: 'EBIT by Geography', sub: true },
  { kind: 'row', label: 'North America Operating Income', values: v4('11.5B', '14.9B', '18.2B', '20.5B') },
  { kind: 'row', label: 'International Operating Income', values: v4('-2.2B', '-0.4B', '1.2B', '2.0B') },
  { kind: 'row', label: 'AWS Operating Income', values: v4('22.8B', '24.6B', '39.5B', '48.0B') },
  { kind: 'section', label: 'Capital Expenditures by Geography', sub: true },
  { kind: 'row', label: 'North America Capital Expenditures', values: v4('28.0B', '22.0B', '35.0B', '37.0B') },
  { kind: 'row', label: 'International Capital Expenditures', values: v4('12.0B', '9.0B', '14.0B', '15.0B') },
  { kind: 'row', label: 'AWS Capital Expenditures', values: v4('18.0B', '12.0B', '22.0B', '24.0B') },
  { kind: 'row', label: 'Corporate Capital Expenditures', values: v4('5.6B', '5.4B', '6.7B', '6.0B') },
  { kind: 'section', label: 'Key Performance Indicators' },
  { kind: 'row', label: 'Amazon (Primarily AWS) Remaining Performance Obligations (RPO) with Original Contract Terms > 1Y', values: v4('92.0B', '104.0B', '118.0B', '132.0B') },
  { kind: 'row', label: 'Total Square Footage excl. Corporate Facilities', values: v4('408M', '418M', '428M', '438M') },
  { kind: 'row', label: 'Total Square Footage', values: v4('412M', '422M', '432M', '442M') },
]

/** —— Adjusted —— */
export const ROWS_ADJUSTED: FinRow[] = [
  { kind: 'row', label: 'AWS Revenue', values: v4('80.1B', '90.8B', '107.6B', '122.0B') },
  { kind: 'row', label: 'Adjusted Revenue', values: v4('518.0B', '579.0B', '642.0B', '696.0B') },
  { kind: 'row', label: 'Adjusted Gross Profit', values: v4('228.0B', '273.0B', '311.0B', '338.0B') },
  { kind: 'row', label: 'Adjusted Gross Margin', values: v4('44.0%', '47.2%', '48.4%', '48.6%'), italic: true },
  { kind: 'row', label: 'Adjusted EBIT', values: v4('40.0B', '66.0B', '90.0B', '104.0B') },
  { kind: 'row', label: 'Adjusted EBIT Margin', values: v4('7.7%', '11.4%', '14.0%', '14.9%'), italic: true },
  { kind: 'row', label: 'Adjusted EBITDA', values: v4('65.0B', '82.0B', '100.0B', '113.0B') },
  { kind: 'row', label: 'Adjusted EBITDA Margin', values: v4('12.5%', '14.2%', '15.6%', '16.2%'), italic: true },
  { kind: 'row', label: 'Adjusted Net Income', values: v4('0.5B', '32.0B', '61.0B', '70.0B') },
  { kind: 'row', label: 'Adjusted Net Income Margin', values: v4('0.1%', '5.5%', '9.5%', '10.1%'), italic: true },
  { kind: 'row', label: 'Adjusted EPS', values: v4('0.05', '3.05', '5.75', '6.85') },
  { kind: 'row', label: 'Adjusted Free Cash Flow (FCF)', values: v4('-15.0B', '38.0B', '40.0B', '52.0B') },
  { kind: 'row', label: 'Adjusted Free Cash Flow Margin', values: v4('-2.9%', '6.6%', '6.2%', '7.5%'), italic: true },
  { kind: 'row', label: 'Adjusted Capital Expenditures', values: v4('62.0B', '47.0B', '76.0B', '80.0B') },
]

/** Patterns for ratio mock cells (rotate by row index) */
const RP = [
  ['3.2x', '2.9x', '2.6x', '2.4x'],
  ['18.4%', '17.2%', '16.0%', '15.1%'],
  ['1.42', '1.38', '1.35', '1.31'],
  ['42.1B', '48.0B', '52.0B', '56.0B'],
]

function ratioVals(i: number): string[] {
  return RP[i % RP.length]
}

/** Build full Ratios tab from Perplexity section order */
function buildRatioRows(): FinRow[] {
  const blocks: { sec?: string; sub?: boolean; lines: string[] }[] = [
    { lines: ['AWS Revenue'] },
    {
      sec: 'Valuation',
      lines: [
        'Stock Price',
        'Total Shares Outstanding',
        'Market Cap',
        'Total Enterprise Value (TEV)',
      ],
    },
    {
      sec: 'Trailing Valuation',
      lines: [
        'Buyback Yield',
        'Debt Paydown Yield',
        'Shareholder Yield',
        'P/S',
        'P/Gross Profit',
        'P/E',
        'Earnings Yield',
        'P/OCF',
        'P/FCF',
        'FCF Yield',
        'P/B',
        'EV/Sales',
        'EV/Gross Profit',
        'EV/EBITDA',
        'EV/EBIT',
        'EV/OCF',
        'EV/FCF',
      ],
    },
    {
      sec: 'Other',
      lines: [
        'Free Cash Flow',
        'EBITDA',
        'NOPAT',
        'Levered Free Cash Flow',
        'Unlevered Free Cash Flow',
        'Net Change in Cash',
        'Book Value',
        'Tangible Book Value',
      ],
    },
    {
      sec: 'Margins',
      sub: true,
      lines: [
        'Gross Profit Margin',
        'Operating Margin',
        'EBITDA Margin',
        'Net Profit Margin',
        'Effective Tax Rate',
        'Pre-Tax Profit Margin',
        'Free Cash Flow Margin',
        'OCF / Sales',
        'OCF / Net Income',
        'FCF / OCF',
        'FCF / Net Income',
        'FCF / EBITDA',
      ],
    },
    {
      sec: 'Capital Efficiency',
      lines: [
        'Return on Invested Capital',
        'Return on Assets',
        'Return on Equity',
        'Return on Total Capital',
        'Return on Capital Employed',
        'Return on Tangible Assets',
        'Receivables Turnover',
        'Days Sales Outstanding',
        'Payables Turnover',
        'Days Payables Outstanding',
        'Inventory Turnover',
        'Days Inventory Outstanding',
        'Cash Conversion Cycle',
        'Asset Turnover',
        'Fixed Asset Turnover',
        'Operating Cycle',
        'CapEx to OCF',
        'CapEx to Revenue',
        'CapEx to Depreciation',
      ],
    },
    {
      sec: 'Financial Health',
      lines: [
        'Total Debt',
        'Net Debt',
        'Current Ratio',
        'Quick Ratio',
        'Cash Ratio',
        'Debt Ratio',
        'Assets to Equity',
        'Cash Flow to Debt Ratio',
        'Long-term Debt to Assets',
        'Intangibles to Total Assets',
        'Net Current Asset Value',
        'Goodwill / Assets',
        'Debt / Equity',
        'Total Debt / Capitalization',
        'Long Term Debt / Capitalization',
        'Long-Term Debt / Equity',
        'Net Debt / EBITDA',
        'EBIT / Interest Expense',
        'EBITDA / Interest Expense',
        '(EBITDA - Capex) / Interest Expense',
      ],
    },
    {
      sec: 'Per Share',
      lines: [
        'Revenue per Share',
        'Basic EPS',
        'Diluted EPS',
        'Book Value per Share',
        'Tangible Book Value per Share',
        'Cash per Share',
        'Operating Cash Flow per Share',
        'Free Cash Flow per Share',
        'CapEx per Share',
        'Weighted Avg. Shares Outstanding',
        'Weighted Avg. Shares Outstanding Diluted',
      ],
    },
    {
      sec: 'Common Size',
      lines: ['R&D to Revenue', 'SG&A to Revenue', 'Stock-based Comp to Revenue'],
    },
  ]

  const growthMetrics = [
    'Diluted EPS',
    'Levered Free Cash Flow',
    'Total Equity',
    'Accounts Receivable',
    'Inventory',
    'Tangible Book Value',
    'Unlevered Free Cash Flow',
    'Revenue',
    'Gross Profit',
    'EBITDA',
    'EBIT',
    'Earnings From Cont. Operations',
    'Net Income',
    'Plant and Equip.',
    'Common Equity',
    'Total Assets',
    'Cash From Operations',
    'Capital Expenditures',
    'Weighted Avg. Shares Outstanding',
    'Diluted Weighted Avg. Shares Outstanding',
  ]
  const growthSuffixes = ['1Y Growth', '3Y CAGR', '5Y CAGR', '10Y CAGR'] as const
  const growthLines = growthMetrics.flatMap((m) =>
    growthSuffixes.map((s) => `${m} ${s}`),
  )

  blocks.push({ sec: 'Growth', lines: growthLines })

  const out: FinRow[] = []
  let idx = 0
  for (const b of blocks) {
    if (b.sec) {
      out.push({ kind: 'section', label: b.sec, sub: b.sub })
    }
    for (const line of b.lines) {
      out.push({ kind: 'row', label: line, values: ratioVals(idx) })
      idx += 1
    }
  }
  return out
}

export const ROWS_RATIOS: FinRow[] = buildRatioRows()

const TAB_ROWS: Record<Exclude<FinSubtab, 'Key Stats'>, FinRow[]> = {
  'Income Statement': ROWS_INCOME,
  'Balance Sheet': ROWS_BALANCE,
  'Cash Flow': ROWS_CASHFLOW,
  'Segments & KPIs': ROWS_SEGMENTS,
  Adjusted: ROWS_ADJUSTED,
  Ratios: ROWS_RATIOS,
}

function sliceValues(values: (string | null)[], n: number): (string | null)[] {
  if (values.length >= n) return values.slice(0, n)
  return [...values, ...Array<string | null>(n - values.length).fill('—')]
}

function adaptRows(rows: FinRow[], colCount: number, pickTtm: boolean): FinRow[] {
  return rows.map((row) => {
    if (row.kind === 'section') return row
    const v = row.values
    if (pickTtm && colCount === 1) {
      const idx = v.length >= 4 ? 3 : Math.max(0, v.length - 1)
      return { ...row, values: [v[idx] ?? '—'] }
    }
    if (colCount === 4 && v.length === 6) {
      return { ...row, values: sliceValues(v, 4) }
    }
    if (colCount === 4 && v.length === 4) return row
    if (colCount === 6) {
      if (v.length === 6) return row
      return { ...row, values: sliceValues(v, 6) }
    }
    return { ...row, values: sliceValues(v, colCount) }
  })
}

export function getFinancialsTableConfig(
  sub: FinSubtab,
  period: 'annual' | 'quarterly' | 'ttm',
): { columns: string[]; estimateFromIndex: number | null; rows: FinRow[] } {
  if (period === 'ttm') {
    const base = sub === 'Key Stats' ? ROWS_KEY_STATS : TAB_ROWS[sub as Exclude<FinSubtab, 'Key Stats'>]
    return {
      columns: ['TTM'],
      estimateFromIndex: null,
      rows: adaptRows(base, 1, true),
    }
  }

  if (period === 'quarterly') {
    const base = sub === 'Key Stats' ? ROWS_KEY_STATS : TAB_ROWS[sub as Exclude<FinSubtab, 'Key Stats'>]
    return {
      columns: [...COLS_Q],
      estimateFromIndex: null,
      rows: adaptRows(base, 4, false),
    }
  }

  if (sub === 'Key Stats') {
    return {
      columns: [...COLS_KEY],
      estimateFromIndex: 4,
      rows: ROWS_KEY_STATS,
    }
  }

  return {
    columns: [...COLS_FOUR],
    estimateFromIndex: null,
    rows: TAB_ROWS[sub],
  }
}
