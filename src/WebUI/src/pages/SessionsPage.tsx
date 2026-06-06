import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getMySessions } from '../api/sessions'
import type { SessionResponse } from '../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function scoreColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export default function SessionsPage() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!token) return
    getMySessions(token)
      .then(s => { setSessions(s); setLoading(false) })
      .catch(() => { setError('Failed to load history.'); setLoading(false) })
  }, [token])

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>

  return (
    <>
      <NavBar />
      <main className="sessions-main">

        <div className="page-header">
          <h1 className="page-title">Interview History</h1>
          <p className="page-sub">All your past and in-progress interview sessions.</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        {sessions.length === 0 && !error && (
          <div className="sessions-empty">
            <p>No interviews yet.</p>
            <Link to="/resumes" className="btn btn-primary" style={{ marginTop: 16 }}>
              Upload Resume & Start
            </Link>
          </div>
        )}

        <div className="sessions-list">
          {sessions.map(s => (
            <div key={s.id} className="session-card">

              <div className="session-card-left">
                <span className="session-icon">🎯</span>
                <div>
                  <p className="session-resume">{s.resumeFileName}</p>
                  <p className="session-date">{formatDate(s.createdAtUtc)}</p>
                  <p className="session-qcount">{s.questions.length} questions</p>
                </div>
              </div>

              <div className="session-card-right">
                {s.status === 'Completed' && s.overallScore != null ? (
                  <div className="session-score" style={{ color: scoreColor(s.overallScore) }}>
                    <span className="session-score-num">{s.overallScore}</span>
                    <span className="session-score-label">/100</span>
                  </div>
                ) : (
                  <span className="session-status-badge session-status-badge--progress">
                    In Progress
                  </span>
                )}

                {s.status === 'Completed' ? (
                  <Link to={`/report/${s.id}`} className="btn btn-outline btn-sm">
                    View Report
                  </Link>
                ) : (
                  <Link to={`/interview/${s.id}`} className="btn btn-primary btn-sm">
                    Continue
                  </Link>
                )}
              </div>

            </div>
          ))}
        </div>

      </main>
    </>
  )
}
