import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getBehavioralReport } from '../api/behavioral'
import type { BehavioralReportResponse } from '../api/types'

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - score / 100)
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="score-ring-wrap">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2a45" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="score-ring-inner">
        <span className="score-ring-value" style={{ color, fontSize: size > 100 ? '1.6rem' : '1.1rem' }}>{score}</span>
        <span className="score-ring-label">{label}</span>
      </div>
    </div>
  )
}

export default function BehavioralReportPage() {
  const { id }     = useParams<{ id: string }>()
  const { token }  = useAuth()
  const [report, setReport] = useState<BehavioralReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id || !token) return
    getBehavioralReport(id, token)
      .then(setReport)
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [id, token])

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error || !report) return (
    <><NavBar /><div className="practice-main"><p className="form-error">{error || 'Report not found.'}</p></div></>
  )

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <>
      <NavBar />
      <main className="report-main">
        <div className="page-header">
          <h1 className="page-title">Behavioral Interview Report</h1>
        </div>

        {/* Overall score */}
        <div className="practice-card" style={{ textAlign: 'center', marginBottom: 20 }}>
          <ScoreRing score={report.overallScore} label="Overall" size={120} />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16, maxWidth: 600, margin: '16px auto 0' }}>
            {report.summary}
          </p>
        </div>

        {/* Per-question feedback */}
        {report.feedbacks.map((f, i) => (
          <div key={i} className="practice-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Question {i + 1}</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.questionText}</p>
              </div>
              <div style={{
                minWidth: 52, height: 52, borderRadius: '50%',
                background: `${scoreColor(f.score)}22`, border: `2px solid ${scoreColor(f.score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: scoreColor(f.score), fontSize: '1.05rem',
              }}>
                {f.score}
              </div>
            </div>

            {f.answerText && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Your answer</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{f.answerText}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ background: '#0d1b2a', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: '#10b981', fontSize: '0.75rem', marginBottom: 4 }}>Feedback</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{f.feedback}</p>
              </div>
              <div style={{ background: '#0d1b2a', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: 4 }}>Suggestion</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{f.suggestion}</p>
              </div>
            </div>

            {f.idealAnswer && (
              <div style={{ background: '#0d1b2a', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: '#6366f1', fontSize: '0.75rem', marginBottom: 4 }}>Ideal Answer</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{f.idealAnswer}</p>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link to="/behavioral" className="btn btn-primary">Try Another Topic</Link>
          <Link to="/sessions"   className="btn btn-ghost">Back to History</Link>
        </div>
      </main>
    </>
  )
}
