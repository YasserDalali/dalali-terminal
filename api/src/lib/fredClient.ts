/** FRED API v1 JSON — https://fred.stlouisfed.org/docs/api/fred/ */

export const FRED_API_BASE = 'https://api.stlouisfed.org/fred'

export type FredObservationsParams = {
  series_id: string
  observation_start?: string
  observation_end?: string
  /** Max rows returned (most recent last). */
  limit?: number
}

export function buildFredObservationsUrl(params: FredObservationsParams): URL {
  const u = new URL(`${FRED_API_BASE}/series/observations`)
  u.searchParams.set('series_id', params.series_id)
  u.searchParams.set('file_type', 'json')
  if (params.observation_start) u.searchParams.set('observation_start', params.observation_start)
  if (params.observation_end) u.searchParams.set('observation_end', params.observation_end)
  if (params.limit != null) u.searchParams.set('limit', String(params.limit))
  return u
}

export type FredObservationRow = {
  date?: string
  value?: string
}

export type FredObservationsResponse = {
  observations?: FredObservationRow[]
}

export function normalizeFredObservations(body: FredObservationsResponse): { date: string; value: string }[] {
  const rows = body.observations ?? []
  return rows
    .filter((r) => r.date && r.value && r.value !== '.')
    .map((r) => ({ date: r.date!, value: r.value! }))
}

export async function fetchFredObservations(
  apiKey: string,
  params: FredObservationsParams,
): Promise<FredObservationsResponse> {
  const u = buildFredObservationsUrl(params)
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`FRED ${res.status}: ${text.slice(0, 500)}`)
  }
  return JSON.parse(text) as FredObservationsResponse
}
