import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getReport } from '../api/sessions'
import type { ReportResponse } from '../api/types'

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r   = 36
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ

  return (
    <div className="score-ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e2235" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="score-ring-inner">
        <span className="score-ring-value" style={{ color }}>{score}</span>
      </div>
      <p className="score-ring-label">{label}</p>
    </div>
  )
}

function scoreColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export default function ReportPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()

  const [report,  setReport]  = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id || !token) return
    getReport(id, token)
      .then(r => { setReport(r); setLoading(false) })
      .catch(() => { setError('Failed to load report.'); setLoading(false) })
  }, [id, token])

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error || !report) return (
    <><NavBar />
      <div className="report-main">
        <p className="form-error">{error || 'Report not found.'}</p>
      </div>
    </>
  )

  return (
    <>
      <NavBar />
      <main className="report-main">

        <div className="report-header">
          <h1 className="page-title">Interview Report</h1>
          <p className="page-sub">{new Date(report.generatedAtUtc).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Score rings */}
        <div className="score-rings">
          <ScoreRing score={report.overallScore}       label="Overall"       color={scoreColor(report.overallScore)} />
          <ScoreRing score={report.technicalScore}     label="Technical"     color={scoreColor(report.technicalScore)} />
          <ScoreRing score={report.communicationScore} label="Communication" color={scoreColor(report.communicationScore)} />
        </div>

        {/* AI Summary */}
        <div className="report-summary">
          <h2>AI Assessment</h2>
          <p>{report.summary}</p>
        </div>

        {/* Per-question breakdown */}
        <div className="report-questions">
          <h2>Question Breakdown</h2>
          {report.questionFeedbacks.map((qf, i) => (
            <div key={qf.questionId} className="report-q-card">
              <div className="report-q-header">
                <span className="report-q-num">Q{i + 1}</span>
                <p className="report-q-text">{qf.questionText}</p>
                <span
                  className="report-q-score"
                  style={{ color: scoreColor(qf.score * 10) }}
                >
                  {qf.score}/10
                </span>
              </div>

              <div className="report-q-answer">
                <span className="report-label">Your answer</span>
                <p>{qf.answerText || <em style={{ color: 'var(--text-muted)' }}>No answer given</em>}</p>
              </div>

              <div className="report-q-feedback">
                <div className="report-q-section">
                  <span className="report-label">Feedback</span>
                  <p>{qf.feedback}</p>
                </div>
                <div className="report-q-section">
                  <span className="report-label report-label--tip">💡 Tip</span>
                  <p>{qf.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/resumes" className="btn btn-outline">← Start Another Interview</Link>
        </div>

      </main>
    </>
  )
}
