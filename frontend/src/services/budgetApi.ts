const BUDGET_USER_KEY = 'dalali:budget:userId'

export function getOrCreateBudgetUserId(): string {
  try {
    const existing = localStorage.getItem(BUDGET_USER_KEY)?.trim()
    if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing)) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(BUDGET_USER_KEY, id)
    return id
  } catch {
    return `local_${Math.random().toString(36).slice(2)}_${Date.now()}`
  }
}

function apiBase(): string {
  const b = import.meta.env.VITE_PORTFOLIO_API_BASE?.trim()
  return b || ''
}

export async function fetchBudgetFromCloud(userId: string): Promise<{ data: unknown; updatedAt: string } | null> {
  const base = apiBase()
  const url = `${base}/api/budget/${encodeURIComponent(userId)}`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const j = (await res.json()) as { ok?: boolean; data?: unknown; updatedAt?: string; error?: string }
  if (!j.ok || j.data === undefined) throw new Error(j.error || 'Bad response')
  return { data: j.data, updatedAt: j.updatedAt ?? '' }
}

export async function saveBudgetToCloud(userId: string, data: unknown): Promise<string> {
  const base = apiBase()
  const url = `${base}/api/budget/${encodeURIComponent(userId)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const j = (await res.json()) as { ok?: boolean; updatedAt?: string; error?: string }
  if (!j.ok) throw new Error(j.error || 'Save failed')
  return j.updatedAt ?? ''
}
