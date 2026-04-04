import assert from 'node:assert/strict'
import test from 'node:test'
import { MACRO_FRED_SERIES } from './macroPresets.js'

test('macro snapshot presets cover rates, prices, GDP, unemployment', () => {
  assert.equal(MACRO_FRED_SERIES.length, 4)
  const ids = MACRO_FRED_SERIES.map((s) => s.id)
  assert.ok(ids.includes('DFF'))
  assert.ok(ids.includes('CPIAUCSL'))
  assert.ok(ids.includes('GDPC1'))
  assert.ok(ids.includes('UNRATE'))
})
