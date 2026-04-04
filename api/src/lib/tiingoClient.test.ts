import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTiingoDailyPricesUrl,
  fetchTiingoDailyPrices,
} from './tiingoClient.js'

test('buildTiingoDailyPricesUrl uppercases ticker and passes dates', () => {
  const u = buildTiingoDailyPricesUrl('aapl', { startDate: '2024-01-01', endDate: '2024-06-01' })
  assert.ok(u.pathname.endsWith('/daily/AAPL/prices'))
  assert.equal(u.searchParams.get('startDate'), '2024-01-01')
  assert.equal(u.searchParams.get('endDate'), '2024-06-01')
})

test('fetchTiingoDailyPrices sends Token auth and expects array', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(input), /tiingo\.com/)
    const h = init?.headers as Record<string, string> | undefined
    assert.equal(h?.Authorization, 'Token t-test')
    return new Response(JSON.stringify([{ date: '2024-01-02', close: 10, adjClose: 10 }]), {
      status: 200,
    })
  }
  try {
    const rows = await fetchTiingoDailyPrices('t-test', 'spy', {})
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.adjClose, 10)
  } finally {
    globalThis.fetch = original
  }
})
