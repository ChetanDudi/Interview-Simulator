import type { AnalyticsResponse } from './types'
import { apiBase } from './config'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { errors?: string[] } | null
    throw new Error(body?.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function getAnalytics(token: string): Promise<AnalyticsResponse> {
  const res = await fetch(`${apiBase}/api/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<AnalyticsResponse>(res)
}
