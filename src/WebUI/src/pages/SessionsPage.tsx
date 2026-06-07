import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getMySessions, shareSession } from '../api/sessions'
import { getMyBehavioralSessions } from '../api/behavioral'
import type { SessionResponse, BehavioralSessionResponse } from '../api/types'

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

function formatTimeTaken(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s > 0 ? ` ${s}s` : ''}`
}

type CombinedItem =
  | { kind: 'interview'; data: SessionResponse;          date: Date }
  | { kind: 'behavioral'; data: BehavioralSessionResponse; date: Date }

export default function SessionsPage() {
  const { token } = useAuth()
  const [items,       setItems]      = useState<CombinedItem[]>([])
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState('')
  const [shareState,  setShareState] = useState<Record<string, { sharing: boolean; copied: boolean; tok?: string }>>({})

  async function handleShare(sessionId: string) {
    if (!token) return
    setShareState(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], sharing: true, copied: false } }))
    try {
      let t = shareState[sessionId]?.tok
      if (!t) {
        const res = await shareSession(sessionId, token)
        t = res.token
        setShareState(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], tok: t } }))
      }
      const url = `${window.location.origin}/shared/interview/${t}/attempt`
      await navigator.clipboard.writeText(url)
      setShareState(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], copied: true } }))
      setTimeout(() => setShareState(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], copied: false } })), 2500)
    } catch { /* ignore */ }
    finally { setShareState(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], sharing: false } })) }
  }

  useEffect(() => {
    if (!token) return
    Promise.all([getMySessions(token), getMyBehavioralSessions(token)])
      .then(([sessions, behavioral]) => {
        const combined: CombinedItem[] = [
          ...sessions.map(s  => ({ kind: 'interview'  as const, data: s,  date: new Date(s.createdAtUtc) })),
          ...behavioral.map(b => ({ kind: 'behavioral' as const, data: b,  date: new Date(b.createdAtUtc) })),
        ]
        combined.sort((a, b) => b.date.getTime() - a.date.getTime())
        setItems(combined)
        setLoading(false)
      })
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

        {items.length === 0 && !error && (
          <div className="sessions-empty">
            <p>No interviews yet.</p>
            <Link to="/resumes" className="btn btn-primary" style={{ marginTop: 16 }}>
              Upload Resume & Start
            </Link>
          </div>
        )}

        <div className="sessions-list">
          {items.map(item => {
            if (item.kind === 'behavioral') {
              const b = item.data
              return (
                <div key={`b-${b.id}`} className="session-card">
                  <div className="session-card-left">
                    <span className="session-icon">🎤</span>
                    <div>
                      <p className="session-resume">{b.topic}</p>
                      <span style={{
                        display: 'inline-block', fontSize: '0.72rem', background: '#8b5cf622',
                        color: '#a78bfa', borderRadius: 20, padding: '1px 10px', marginBottom: 4,
                      }}>
                        Behavioral / STAR
                      </span>
                      <p className="session-date">{formatDate(b.createdAtUtc)}</p>
                      <p className="session-qcount">
                        {b.questions.length} questions
                        {b.timeTakenSeconds != null && (
                          <span className="session-time"> · ⏱ {formatTimeTaken(b.timeTakenSeconds)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="session-card-right">
                    {b.status === 'Completed' ? (
                      <Link to={`/behavioral/${b.id}/report`} className="btn btn-outline btn-sm">
                        View Report
                      </Link>
                    ) : (
                      <>
                        <span className="session-status-badge session-status-badge--progress">In Progress</span>
                        <Link to={`/behavioral/${b.id}`} className="btn btn-primary btn-sm">Continue</Link>
                      </>
                    )}
                  </div>
                </div>
              )
            }

            // Regular interview session
            const s = item.data
            return (
              <div key={`s-${s.id}`} className="session-card">
                <div className="session-card-left">
                  <span className="session-icon">🎯</span>
                  <div>
                    <p className="session-resume">{s.resumeFileName}</p>
                    {s.targetRole && (
                      <span style={{
                        display: 'inline-block', fontSize: '0.75rem', background: '#3b82f622',
                        color: '#60a5fa', borderRadius: 20, padding: '1px 10px', marginBottom: 4,
                      }}>
                        🎯 {s.targetRole}
                      </span>
                    )}
                    <p className="session-date">{formatDate(s.createdAtUtc)}</p>
                    <p className="session-qcount">
                      {s.questions.length} questions
                      {s.timeTakenSeconds != null && (
                        <span className="session-time"> · ⏱ {formatTimeTaken(s.timeTakenSeconds)}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="session-card-right">
                  {s.status === 'Completed' && s.overallScore != null ? (
                    <div className="session-score" style={{ color: scoreColor(s.overallScore) }}>
                      <span className="session-score-num">{s.overallScore}</span>
                      <span className="session-score-label">/100</span>
                    </div>
                  ) : (
                    <span className="session-status-badge session-status-badge--progress">In Progress</span>
                  )}

                  {s.status === 'Completed' ? (
                    <Link to={`/report/${s.id}`} className="btn btn-outline btn-sm">View Report</Link>
                  ) : (
                    <Link to={`/interview/${s.id}`} className="btn btn-primary btn-sm">Continue</Link>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleShare(s.id)}
                    disabled={shareState[s.id]?.sharing}
                    title="Copy link to share these interview questions"
                  >
                    {shareState[s.id]?.copied ? '✓ Copied!' : shareState[s.id]?.sharing ? '…' : '🔗 Share'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </>
  )
}
