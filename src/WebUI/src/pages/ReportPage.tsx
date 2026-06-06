import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getReport } from '../api/sessions'
import type { ReportResponse, QuestionFeedbackResponse } from '../api/types'

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r    = 36
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
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

function scoreColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function formatTimeTaken(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s > 0 ? ` ${s}s` : ''}`
}

function McqReport({ qf }: { qf: QuestionFeedbackResponse }) {
  const correct  = qf.options[qf.correctOptionIndex ?? -1]
  const userWrong = qf.answerText && qf.answerText !== correct
  return (
    <div className="report-mcq-grid">
      {qf.options.map((opt, i) => {
        const isCorrectOpt  = i === qf.correctOptionIndex
        const isUserPick    = opt === qf.answerText
        let cls = 'report-mcq-opt'
        if (isCorrectOpt)           cls += ' report-mcq-opt--correct'
        else if (isUserPick && userWrong) cls += ' report-mcq-opt--wrong'
        return (
          <div key={i} className={cls}>
            <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
            <span>{opt}</span>
            {isCorrectOpt && <span className="mcq-tick">✓</span>}
            {isUserPick && userWrong && <span className="mcq-cross">✗ Your pick</span>}
          </div>
        )
      })}
      {!qf.answerText && <p className="report-no-answer">No option selected.</p>}
    </div>
  )
}

function AnswerBlock({ qf }: { qf: QuestionFeedbackResponse }) {
  if (qf.questionType === 'MCQ') {
    return (
      <div className="report-q-answer">
        <span className="report-label">Options</span>
        <McqReport qf={qf} />
      </div>
    )
  }
  return (
    <div className="report-q-answer">
      <span className="report-label">Your answer</span>
      {qf.answerText
        ? qf.questionType === 'Coding'
          ? <pre className="report-code-block">{qf.answerText}</pre>
          : <p>{qf.answerText}</p>
        : <p><em style={{ color: 'var(--text-muted)' }}>No answer given</em></p>
      }
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
    <><NavBar /><div className="report-main"><p className="form-error">{error || 'Report not found.'}</p></div></>
  )

  return (
    <>
      <NavBar />
      <main className="report-main">

        <div className="report-header">
          <h1 className="page-title">Interview Report</h1>
          <p className="page-sub">
            {new Date(report.generatedAtUtc).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {report.timeTakenSeconds != null && (
              <span className="report-time-taken"> · ⏱ Time taken: {formatTimeTaken(report.timeTakenSeconds)}</span>
            )}
          </p>
        </div>

        <div className="score-rings">
          <ScoreRing score={report.overallScore}       label="Overall"       color={scoreColor(report.overallScore)} />
          <ScoreRing score={report.technicalScore}     label="Technical"     color={scoreColor(report.technicalScore)} />
          <ScoreRing score={report.communicationScore} label="Communication" color={scoreColor(report.communicationScore)} />
        </div>

        <div className="report-summary">
          <h2>AI Assessment</h2>
          <p>{report.summary}</p>
        </div>

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

              <AnswerBlock qf={qf} />

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

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/resumes" className="btn btn-outline">← Start Another Interview</Link>
        </div>

      </main>
    </>
  )
}
