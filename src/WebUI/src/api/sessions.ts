import type { ReportResponse, SessionResponse } from './types'

const BASE = '/api/sessions'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: ['Unexpected server error'] })) as { errors?: string[] }
    throw new Error(body.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function createSession(resumeId: string, questionCount: number, token: string): Promise<SessionResponse> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ resumeId, questionCount }),
  })
  return handleResponse<SessionResponse>(res)
}

export async function getSession(sessionId: string, token: string): Promise<SessionResponse> {
  const res = await fetch(`${BASE}/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<SessionResponse>(res)
}

export async function getMySessions(token: string): Promise<SessionResponse[]> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<SessionResponse[]>(res)
}

export async function submitAnswers(
  sessionId: string,
  answers: { questionId: string; answerText: string }[],
  token: string
): Promise<void> {
  const res = await fetch(`${BASE}/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(answers),
  })
  await handleResponse<void>(res)
}

export async function getReport(sessionId: string, token: string): Promise<ReportResponse> {
  const res = await fetch(`${BASE}/${sessionId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<ReportResponse>(res)
}
