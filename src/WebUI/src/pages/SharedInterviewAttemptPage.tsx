import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSharedInterviewAttempt } from '../api/sessions'
import type { InterviewAttemptResponse, AttemptQuestion } from '../api/types'

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ', ShortAnswer: 'Short Answer', LongAnswer: 'Long Answer',
  Coding: 'Coding', Other: 'Other',
}
const TYPE_COLORS: Record<string, string> = {
  MCQ: '#6366f1', ShortAnswer: '#10b981', LongAnswer: '#3b82f6',
  Coding: '#f59e0b', Other: '#94a3b8',
}

function AttemptCard({ q, index, hasModelAnswers }: {
  q: AttemptQuestion; index: number; hasModelAnswers: boolean
}) {
  const [revealed,    setRevealed]    = useState(false)
  const [answer,      setAnswer]      = useState('')
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

      {isMCQ && q.options.length > 0 ? (
        <div className="practice-mcq-options">
          {q.options.map((opt, i) => {
            const isCorrect  = revealed && i === q.correctOptionIndex
            const isSelected = selectedOpt === i
            let cls = 'practice-mcq-opt'
            if (revealed && isCorrect)                     cls += ' practice-mcq-opt--correct'
            else if (revealed && isSelected && !isCorrect) cls += ' practice-mcq-opt--wrong'
            else if (!revealed && isSelected)              cls += ' practice-mcq-opt--picked'
            return (
              <button key={i} className={cls} onClick={() => !revealed && setSelectedOpt(i)}>
                <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
                {revealed && isCorrect                    && <span className="mcq-tick">✓</span>}
                {revealed && isSelected && !isCorrect     && <span className="mcq-cross">✗</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <textarea
          className={`answer-textarea${isCoding ? ' answer-textarea--code' : ''}`}
          placeholder={
            isCoding
              ? '// Write your code here…'
              : q.questionType === 'ShortAnswer'
              ? 'Give a brief answer (1–2 sentences)…'
              : 'Type your detailed answer here…'
          }
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={isCoding ? 8 : q.questionType === 'ShortAnswer' ? 3 : 5}
          style={{ marginBottom: 12 }}
        />
      )}

      {hasModelAnswers && (
        !revealed ? (
          <button className="btn btn-outline practice-reveal-btn" onClick={() => setRevealed(true)}>
            {isMCQ ? 'Reveal Correct Answer' : 'Show Model Answer'}
          </button>
        ) : (
          q.idealAnswer ? (
            <div className="practice-answer-box">
              <span className="report-label report-label--ideal">
                {isMCQ ? '✅ Correct Answer' : isCoding ? '✅ Model Solution' : '✅ Model Answer'}
              </span>
              {isCoding
                ? <pre className="report-code-block">{q.idealAnswer}</pre>
                : <p className="practice-answer-text">{q.idealAnswer}</p>
              }
            </div>
          ) : null
        )
      )}
    </div>
  )
}

export default function SharedInterviewAttemptPage() {
  const { token } = useParams<{ token: string }>()

  const [attempt, setAttempt] = useState<InterviewAttemptResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) return
    const load = (retries: number) => {
      getSharedInterviewAttempt(token)
        .then(a => { setAttempt(a); setLoading(false) })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          if (retries > 0 && msg.includes('fetch')) {
            setTimeout(() => load(retries - 1), 3000)
          } else {
            setError(msg.includes('404') || msg.includes('not found')
              ? 'This interview does not exist or the link is invalid.'
              : 'Could not load the interview. The server may be starting up — please try refreshing.')
            setLoading(false)
          }
        })
    }
    load(3)
  }, [token])

  if (loading) return (
    <div className="loading-screen">
      <span className="spinner" />
      <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Loading… (server may be waking up)</p>
    </div>
  )

  if (error || !attempt) return (
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
          <span>🎯 Someone shared their interview — try answering these questions!</span>
          <Link to="/register" className="btn btn-primary btn-sm">Get AI feedback on your own answers</Link>
        </div>

        <div className="page-header">
          <h1 className="page-title">{attempt.resumeTitle}</h1>
          <p className="page-sub">
            {attempt.questions.length} interview questions
            {attempt.hasModelAnswers && ' · Model answers included'}
          </p>
        </div>

        <div className="practice-questions-list">
          {attempt.questions.map((q, i) => (
            <AttemptCard key={i} q={q} index={i} hasModelAnswers={attempt.hasModelAnswers} />
          ))}
        </div>

        <div className="shared-cta-footer">
          <p>Want AI-evaluated interviews tailored to your own resume?</p>
          <Link to="/register" className="btn btn-primary">Create Free Account</Link>
        </div>
      </main>
    </div>
  )
}
