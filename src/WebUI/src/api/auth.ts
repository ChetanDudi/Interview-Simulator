import type {
  AuthResponse,
  LoginRequest,
  PendingVerification,
  RegisterRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
} from './types'

import { apiBase } from './config'

const BASE = `${apiBase}/api/auth`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: ['Unexpected server error'] })) as { errors?: string[] }
    throw new Error(body.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function register(request: RegisterRequest): Promise<PendingVerification> {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<PendingVerification>(res)
}

export async function login(request: LoginRequest): Promise<AuthResponse | PendingVerification> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<AuthResponse | PendingVerification>(res)
}

export async function verifyEmail(request: { email: string; otp: string }): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<AuthResponse>(res)
}

export async function resendOtp(request: { email: string; purpose: string }): Promise<ResendOtpResponse> {
  const res = await fetch(`${BASE}/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<ResendOtpResponse>(res)
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handleResponse<{ message: string }>(res)
}

export async function verifyResetOtp(request: { email: string; otp: string }): Promise<{ resetToken: string }> {
  const res = await fetch(`${BASE}/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<{ resetToken: string }>(res)
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  const res = await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  await handleResponse<unknown>(res)
}
