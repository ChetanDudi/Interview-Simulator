import type { BehavioralSessionResponse, BehavioralReportResponse } from './types'
import { apiBase } from './config'

const BASE = `${apiBase}/api/behavioral`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { errors?: string[] } | null
    throw new Error(body?.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function createBehavioralSession(
  topic: string,
  questionCount: number,
  token: string
): Promise<BehavioralSessionResponse> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic, questionCount }),
  })
  return handleResponse<BehavioralSessionResponse>(res)
}

export async function getBehavioralSession(
  sessionId: string,
  token: string
): Promise<BehavioralSessionResponse> {
  const res = await fetch(`${BASE}/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<BehavioralSessionResponse>(res)
}

export async function getMyBehavioralSessions(
  token: string
): Promise<BehavioralSessionResponse[]> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<BehavioralSessionResponse[]>(res)
}

export async function submitBehavioralAnswers(
  sessionId: string,
  answers: string[],
  timeTakenSeconds: number,
  token: string
): Promise<BehavioralReportResponse> {
  const res = await fetch(`${BASE}/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answers, timeTakenSeconds }),
  })
  return handleResponse<BehavioralReportResponse>(res)
}

export async function getBehavioralReport(
  sessionId: string,
  token: string
): Promise<BehavioralReportResponse> {
  const res = await fetch(`${BASE}/${sessionId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<BehavioralReportResponse>(res)
}
