import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAlpacaStockBarsUrl, fetchAlpacaStockBars } from './alpacaClient.js'

test('buildAlpacaStockBarsUrl uppercases symbols and applies feed', () => {
  const u = buildAlpacaStockBarsUrl('https://data.alpaca.markets', {
    symbols: 'spy',
    timeframe: '1Day',
    limit: 50,
    feed: 'iex',
  })
  assert.equal(u.searchParams.get('symbols'), 'SPY')
  assert.equal(u.searchParams.get('timeframe'), '1Day')
  assert.equal(u.searchParams.get('limit'), '50')
  assert.equal(u.searchParams.get('feed'), 'iex')
})

test('fetchAlpacaStockBars sets Alpaca headers', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(input), /data\.alpaca\.markets/)
    const h = init?.headers as Record<string, string> | undefined
    assert.equal(h?.['APCA-API-KEY-ID'], 'kid')
    assert.equal(h?.['APCA-API-SECRET-KEY'], 'sec')
    return new Response(
      JSON.stringify({
        bars: { SPY: [{ t: '2024-01-01T00:00:00Z', o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }] },
      }),
      { status: 200 },
    )
  }
  try {
    const r = await fetchAlpacaStockBars('kid', 'sec', 'https://data.alpaca.markets', {
      symbols: 'SPY',
      timeframe: '1Day',
      limit: 1,
    })
    assert.ok(r.bars?.SPY?.length)
  } finally {
    globalThis.fetch = original
  }
})
