import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFredObservationsUrl,
  fetchFredObservations,
  normalizeFredObservations,
} from './fredClient.js'

test('buildFredObservationsUrl includes series_id, file_type, and limit', () => {
  const u = buildFredObservationsUrl({ series_id: 'UNRATE', limit: 5 })
  assert.equal(u.searchParams.get('series_id'), 'UNRATE')
  assert.equal(u.searchParams.get('file_type'), 'json')
  assert.equal(u.searchParams.get('limit'), '5')
  assert.match(u.toString(), /api\.stlouisfed\.org/)
})

test('normalizeFredObservations drops missing dotted values', () => {
  const out = normalizeFredObservations({
    observations: [
      { date: '2020-01-01', value: '.' },
      { date: '2020-02-01', value: '3.5' },
    ],
  })
  assert.equal(out.length, 1)
  assert.equal(out[0]!.value, '3.5')
})

test('fetchFredObservations sends Bearer auth and parses JSON', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(input), /stlouisfed\.org/)
    const h = init?.headers as Record<string, string> | undefined
    assert.equal(h?.Authorization, 'Bearer sk-test')
    return new Response(JSON.stringify({ observations: [{ date: '2024-01-01', value: '1' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const r = await fetchFredObservations('sk-test', { series_id: 'DFF', limit: 1 })
    assert.equal(r.observations?.length, 1)
  } finally {
    globalThis.fetch = original
  }
})
