import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import PasswordInput from '../components/PasswordInput'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state    = location.state as { email?: string; token?: string } | null

  const [email,       setEmail]       = useState(state?.email ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)

  const token = state?.token ?? ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword({ email, token, newPassword })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">Interview <span>Simulator</span></div>
          <p className="form-success" style={{ marginTop: 12 }}>
            Password reset successfully! Redirecting to sign in…
          </p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">Interview <span>Simulator</span></div>
          <p className="form-error">
            Invalid link. Please start the <Link to="/forgot-password">forgot password</Link> flow again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">Interview <span>Simulator</span></div>
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {!state?.email && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 chars, uppercase, digit, symbol"
              required
              autoComplete="new-password"
              autoFocus
            />
            <small className="form-hint">
              At least 8 characters including uppercase, a digit, and a special character.
            </small>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
