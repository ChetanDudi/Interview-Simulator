import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OtpInput from '../components/OtpInput'
import { verifyEmail, resendOtp } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const COOLDOWN = 120

export default function VerifyEmailPage() {
  const { signIn }    = useAuth()
  const navigate      = useNavigate()
  const location      = useLocation()
  const emailFromState = (location.state as { email?: string } | null)?.email ?? ''

  const [email,     setEmail]     = useState(emailFromState)
  const [otp,       setOtp]       = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [countdown, setCountdown] = useState(COOLDOWN)
  const [resending, setResending] = useState(false)

  // Tick the countdown
  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (otp.length < 6) { setError('Please enter the full 6-digit code.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await verifyEmail({ email, otp })
      signIn(data)
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      const result = await resendOtp({ email, purpose: 'EmailVerification' })
      setCountdown(result.secondsUntilResend > 0 ? result.secondsUntilResend : COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">Interview <span>Simulator</span></div>
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong style={{ color: '#e2e8f0' }}>{email || 'your email'}</strong>.
          <br />The code is valid for <strong style={{ color: '#e2e8f0' }}>10 minutes</strong>. You can resend after 2 minutes.
        </p>

        {/* Show email input if navigated directly without state */}
        {!emailFromState && (
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          <div className="resend-row">
            {countdown > 0 ? (
              <>
                <span>Resend in</span>
                <span className="resend-timer">{countdown}s</span>
              </>
            ) : (
              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  )
}
