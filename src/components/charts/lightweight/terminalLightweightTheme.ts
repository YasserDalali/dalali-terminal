import type { ChartOptions, DeepPartial } from 'lightweight-charts'
import { ColorType, CrosshairMode, LastPriceAnimationMode, LineStyle } from 'lightweight-charts'

/** Terminal-style defaults aligned with existing bb-* dark UI. */
export function terminalChartOptions(overrides?: DeepPartial<ChartOptions>): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: '#0a0a0a' },
      textColor: '#aaa',
      fontSize: 11,
      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: '#2a2a2a', style: LineStyle.Dotted },
      horzLines: { color: '#2a2a2a', style: LineStyle.Dotted },
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        width: 1,
        color: '#555',
        style: LineStyle.Dashed,
        labelBackgroundColor: '#333',
      },
      horzLine: {
        width: 1,
        color: '#555',
        style: LineStyle.Dashed,
        labelBackgroundColor: '#333',
      },
    },
    rightPriceScale: {
      borderColor: '#333',
      scaleMargins: { top: 0.15, bottom: 0.1 },
    },
    timeScale: {
      borderColor: '#333',
      timeVisible: false,
      secondsVisible: false,
      fixLeftEdge: false,
      fixRightEdge: false,
    },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    localization: {
      locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    },
    ...overrides,
  }
}

export function sparklineChartOptions(): DeepPartial<ChartOptions> {
  return terminalChartOptions({
    rightPriceScale: { visible: false },
    leftPriceScale: { visible: false },
    timeScale: { visible: false, borderVisible: false },
    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    crosshair: { mode: CrosshairMode.Hidden },
    handleScroll: false,
    handleScale: false,
  })
}

export const lcLastPriceOff = { lastValueVisible: true, priceLineVisible: false, lastPriceAnimation: LastPriceAnimationMode.Disabled }
