import type { ResumeResponse, ResumeReviewResponse, JobMatchResponse } from './types'

import { apiBase } from './config'

const BASE = `${apiBase}/api/resumes`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: ['Unexpected server error'] })) as { errors?: string[] }
    const message = body.errors?.join(', ') ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function uploadResume(file: File, token: string): Promise<ResumeResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  return handleResponse<ResumeResponse>(res)
}

export async function getMyResumes(token: string): Promise<ResumeResponse[]> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<ResumeResponse[]>(res)
}

export async function deleteResume(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  await handleResponse<void>(res)
}

export async function reviewResume(id: string, token: string): Promise<ResumeReviewResponse> {
  const res = await fetch(`${BASE}/${id}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse<ResumeReviewResponse>(res)
}

export async function matchJob(id: string, jobDescription: string, token: string): Promise<JobMatchResponse> {
  const res = await fetch(`${BASE}/${id}/job-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jobDescription }),
  })
  return handleResponse<JobMatchResponse>(res)
}

export async function generateCoverLetter(id: string, jobDescription: string, token: string): Promise<string> {
  const res = await fetch(`${BASE}/${id}/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jobDescription }),
  })
  const data = await handleResponse<{ coverLetter: string }>(res)
  return data.coverLetter
}
