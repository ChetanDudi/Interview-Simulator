import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSharedPractice } from '../api/practice'
import type { PracticeSessionResponse, PracticeQuestion } from '../api/types'

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ', ShortAnswer: 'Short Answer', LongAnswer: 'Long Answer',
  Coding: 'Coding', Other: 'Other',
}
const TYPE_COLORS: Record<string, string> = {
  MCQ: '#6366f1', ShortAnswer: '#10b981', LongAnswer: '#3b82f6',
  Coding: '#f59e0b', Other: '#94a3b8',
}

function PracticeCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const [revealed,    setRevealed]    = useState(false)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const isMCQ    = q.questionType === 'MCQ'
  const isCoding = q.questionType === 'Coding'

  return (
    <div className="practice-card">
      <div className="practice-card-header">
        <span className="practice-q-num">Q{index + 1}</span>
        <span className="practice-type-badge" style={{
          background: `${TYPE_COLORS[q.questionType] ?? '#6366f1'}22`,
          color: TYPE_COLORS[q.questionType] ?? '#6366f1',
          border: `1px solid ${TYPE_COLORS[q.questionType] ?? '#6366f1'}44`,
        }}>
          {TYPE_LABELS[q.questionType] ?? q.questionType}
        </span>
      </div>

      <p className="practice-question">{q.questionText}</p>

      {isMCQ && q.options.length > 0 && (
        <div className="practice-mcq-options">
          {q.options.map((opt, i) => {
            const isCorrect  = revealed && i === q.correctOptionIndex
            const isSelected = selectedOpt === i
            let cls = 'practice-mcq-opt'
            if (revealed && isCorrect)                    cls += ' practice-mcq-opt--correct'
            else if (revealed && isSelected && !isCorrect) cls += ' practice-mcq-opt--wrong'
            else if (!revealed && isSelected)             cls += ' practice-mcq-opt--picked'
            return (
              <button key={i} className={cls} onClick={() => !revealed && setSelectedOpt(i)}>
                <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
                {revealed && isCorrect     && <span className="mcq-tick">✓</span>}
                {revealed && isSelected && !isCorrect && <span className="mcq-cross">✗</span>}
              </button>
            )
          })}
        </div>
      )}

      {!revealed ? (
        <button className="btn btn-outline practice-reveal-btn" onClick={() => setRevealed(true)}>
          {isMCQ ? 'Reveal Correct Answer' : 'Show Answer'}
        </button>
      ) : (
        <div className="practice-answer-box">
          <span className="report-label report-label--ideal">
            {isMCQ ? '✅ Correct Answer' : isCoding ? '✅ Model Solution' : '✅ Answer'}
          </span>
          {isCoding
            ? <pre className="report-code-block">{q.answer}</pre>
            : <p className="practice-answer-text">{q.answer}</p>
          }
        </div>
      )}
    </div>
  )
}

export default function SharedPracticePage() {
  const { token } = useParams<{ token: string }>()

  const [session, setSession] = useState<PracticeSessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) return
    getSharedPractice(token)
      .then(s => { setSession(s); setLoading(false) })
      .catch(() => { setError('This practice set is not available or the link has expired.'); setLoading(false) })
  }, [token])

  if (loading) return (
    <div className="loading-screen"><span className="spinner" /></div>
  )

  if (error || !session) return (
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

      <main className="practice-main">
        <div className="shared-cta-banner">
          <span>👋 Someone shared this practice set with you!</span>
          <Link to="/register" className="btn btn-primary btn-sm">Create an account to generate your own</Link>
        </div>

        <div className="page-header">
          <h1 className="page-title">{session.topic}</h1>
          <p className="page-sub">{session.questions.length} interview questions with answers</p>
        </div>

        <div className="practice-questions-list">
          {session.questions.map((q, i) => <PracticeCard key={i} q={q} index={i} />)}
        </div>

        <div className="shared-cta-footer">
          <p>Want to generate your own custom practice sets?</p>
          <Link to="/register" className="btn btn-primary">Create Free Account</Link>
        </div>
      </main>
    </div>
  )
}
