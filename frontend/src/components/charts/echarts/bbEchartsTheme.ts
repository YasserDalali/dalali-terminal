/** Tooltip defaults (separate export so TS allows object spreads in chart options). */
export const bbTooltip = {
  backgroundColor: 'rgba(17,17,17,0.96)',
  borderColor: '#444',
  borderWidth: 1,
  textStyle: { color: '#e8e8e8', fontSize: 11 },
} as const

/** Dark terminal styling merged into chart options. */
export const bbEchartsBase = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9a9a9a',
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: 10,
  },
  tooltip: bbTooltip,
} as const

export function areaGradientColors(up: boolean): [string, string] {
  return up
    ? ['rgba(0, 255, 80, 0.38)', 'rgba(0, 0, 0, 0)']
    : ['rgba(255, 68, 68, 0.38)', 'rgba(0, 0, 0, 0)']
}
