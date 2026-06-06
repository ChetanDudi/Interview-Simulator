import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSharedInterview } from '../api/sessions'
import type { ReportResponse, QuestionFeedbackResponse } from '../api/types'

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

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36, circ = 2 * Math.PI * r, fill = (score / 100) * circ
  return (
    <div className="score-ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e2235" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 44 44)" />
      </svg>
      <div className="score-ring-inner">
        <span className="score-ring-value" style={{ color }}>{score}</span>
      </div>
      <p className="score-ring-label">{label}</p>
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  MCQ: '#6366f1', ShortAnswer: '#10b981', LongAnswer: '#3b82f6',
  Coding: '#f59e0b', Other: '#94a3b8',
}
const TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ', ShortAnswer: 'Short', LongAnswer: 'Long', Coding: 'Coding', Other: 'Other',
}

function McqReport({ qf }: { qf: QuestionFeedbackResponse }) {
  const correct   = qf.options[qf.correctOptionIndex ?? -1]
  const userWrong = qf.answerText && qf.answerText !== correct
  return (
    <div className="report-mcq-grid">
      {qf.options.map((opt, i) => {
        const isCorrectOpt = i === qf.correctOptionIndex
        const isUserPick   = opt === qf.answerText
        let cls = 'report-mcq-opt'
        if (isCorrectOpt)                 cls += ' report-mcq-opt--correct'
        else if (isUserPick && userWrong) cls += ' report-mcq-opt--wrong'
        return (
          <div key={i} className={cls}>
            <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
            <span>{opt}</span>
            {isCorrectOpt              && <span className="mcq-tick">✓</span>}
            {isUserPick && userWrong   && <span className="mcq-cross">✗ Picked</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function SharedInterviewPage() {
  const { token } = useParams<{ token: string }>()

  const [report,  setReport]  = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) return
    getSharedInterview(token)
      .then(r => { setReport(r); setLoading(false) })
      .catch(() => { setError('This interview report is not available or the link has expired.'); setLoading(false) })
  }, [token])

  if (loading) return <div className="loading-screen"><span className="spinner" /></div>

  if (error || !report) return (
    <div className="shared-page">
      <div className="shared-page-inner">
        <p className="form-error">{error || 'Not found.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Go to Home</Link>
      </div>
    </div>
  )

  return (
    <div className="shared-page">
      <header className="shared-header">
        <div className="shared-header-inner">
          <span className="navbar-brand">Interview <span>Simulator</span></span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login"    className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Create Free Account</Link>
          </div>
        </div>
      </header>

      <main className="report-main">
        <div className="shared-cta-banner">
          <span>🎯 Someone shared their interview results with you!</span>
          <Link to="/register" className="btn btn-primary btn-sm">Practice yourself — it's free</Link>
        </div>

        <div className="report-header">
          <h1 className="page-title">Interview Report</h1>
          <p className="page-sub">
            {new Date(report.generatedAtUtc).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {report.timeTakenSeconds != null && (
              <span className="report-time-taken"> · ⏱ {formatTimeTaken(report.timeTakenSeconds)}</span>
            )}
          </p>
        </div>

        <div className="score-rings">
          <ScoreRing score={report.overallScore}       label="Overall"       color={scoreColor(report.overallScore)} />
          <ScoreRing score={report.technicalScore}     label="Technical"     color={scoreColor(report.technicalScore)} />
          <ScoreRing score={report.communicationScore} label="Communication" color={scoreColor(report.communicationScore)} />
        </div>

        <div className="report-summary"><h2>AI Assessment</h2><p>{report.summary}</p></div>

        <div className="report-questions">
          <h2>Question Breakdown</h2>
          {report.questionFeedbacks.map((qf, i) => (
            <div key={qf.questionId} className="report-q-card">
              <div className="report-q-header">
                <span className="report-q-num">Q{i + 1}</span>
                <span className="report-q-type-badge" style={{
                  background: `${TYPE_COLORS[qf.questionType] ?? '#6366f1'}22`,
                  color: TYPE_COLORS[qf.questionType] ?? '#6366f1',
                  border: `1px solid ${TYPE_COLORS[qf.questionType] ?? '#6366f1'}44`,
                }}>
                  {TYPE_LABELS[qf.questionType] ?? qf.questionType}
                </span>
                <p className="report-q-text">{qf.questionText}</p>
                <span className="report-q-score" style={{ color: scoreColor(qf.score * 10) }}>{qf.score}/10</span>
              </div>

              {qf.questionType === 'MCQ' ? (
                <div className="report-q-answer">
                  <span className="report-label">Options</span>
                  <McqReport qf={qf} />
                </div>
              ) : (
                <div className="report-q-answer">
                  <span className="report-label">Answer given</span>
                  {qf.answerText
                    ? qf.questionType === 'Coding'
                      ? <pre className="report-code-block">{qf.answerText}</pre>
                      : <p>{qf.answerText}</p>
                    : <p><em style={{ color: 'var(--text-muted)' }}>No answer given</em></p>
                  }
                </div>
              )}

              <div className="report-q-feedback">
                <div className="report-q-section">
                  <span className="report-label">Feedback</span><p>{qf.feedback}</p>
                </div>
                <div className="report-q-section">
                  <span className="report-label report-label--tip">💡 Tip</span><p>{qf.suggestion}</p>
                </div>
              </div>

              {qf.idealAnswer && (
                <div className="report-ideal-answer">
                  <span className="report-label report-label--ideal">
                    {qf.questionType === 'Coding' ? '✅ Model Solution' : '✅ Ideal Answer'}
                  </span>
                  {qf.questionType === 'Coding'
                    ? <pre className="report-code-block" style={{ marginTop: 6 }}>{qf.idealAnswer}</pre>
                    : <p>{qf.idealAnswer}</p>
                  }
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="shared-cta-footer">
          <p>Want to practice your own interviews with AI feedback?</p>
          <Link to="/register" className="btn btn-primary">Create Free Account</Link>
        </div>
      </main>
    </div>
  )
}
