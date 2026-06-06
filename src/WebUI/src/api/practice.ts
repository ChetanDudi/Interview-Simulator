import type { PracticeSessionResponse } from './types'

import { apiBase } from './config'

const BASE = `${apiBase}/api/practice`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: ['Unexpected server error'] })) as { errors?: string[] }
    throw new Error(body.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function generatePracticeQuestions(
  topic: string,
  count: number,
  token: string
): Promise<PracticeSessionResponse> {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic, count }),
  })
  return handleResponse<PracticeSessionResponse>(res)
}

export async function getMyPracticeSessions(token: string): Promise<PracticeSessionResponse[]> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<PracticeSessionResponse[]>(res)
}

export async function getPracticeSession(id: string, token: string): Promise<PracticeSessionResponse> {
  const res = await fetch(`${BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<PracticeSessionResponse>(res)
}

export async function sharePracticeSession(id: string, token: string): Promise<{ token: string; shareUrl: string }> {
  const res = await fetch(`${BASE}/${id}/share`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<{ token: string; shareUrl: string }>(res)
}

export async function getSharedPractice(shareToken: string): Promise<PracticeSessionResponse> {
  const res = await fetch(`${apiBase}/api/public/practice/${shareToken}`)
  return handleResponse<PracticeSessionResponse>(res)
}
