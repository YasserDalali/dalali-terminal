/** Normalized end-of-day OHLCV (adjusted fields from Tiingo mapped into close/open/high/low). */

export type DailyOhlcvBar = {
  dateYmd: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Minimal series for portfolio benchmark / 1D calcs — adj. close as `close`. */
export type EodCloseBar = {
  dateYmd: string
  close: number
}
