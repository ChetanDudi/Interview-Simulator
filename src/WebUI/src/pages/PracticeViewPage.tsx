import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getPracticeSession, sharePracticeSession } from '../api/practice'
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
  const [revealed,    setRevealed]    = useState(true)  // revealed by default in view mode
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

export default function PracticeViewPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()

  const [session,   setSession]   = useState<PracticeSessionResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [shareToken, setShareToken] = useState<string | undefined>()
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    if (!id || !token) return
    getPracticeSession(id, token)
      .then(s => { setSession(s); setShareToken(s.shareToken); setLoading(false) })
      .catch(() => { setError('Failed to load practice session.'); setLoading(false) })
  }, [id, token])

  async function handleShare() {
    if (!id || !token) return
    try {
      let t = shareToken
      if (!t) {
        const res = await sharePracticeSession(id, token)
        t = res.token
        setShareToken(t)
      }
      const url = `${window.location.origin}/shared/practice/${t}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* ignore */ }
  }

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error || !session) return (
    <><NavBar /><div className="practice-main"><p className="form-error">{error || 'Session not found.'}</p></div></>
  )

  return (
    <>
      <NavBar />
      <main className="practice-main">

        <div className="report-header">
          <h1 className="page-title">{session.topic}</h1>
          <p className="page-sub">
            {session.questions.length} questions · {new Date(session.createdAtUtc).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Link to="/practice" className="btn btn-ghost btn-sm">← Back to Practice</Link>
          <button className="btn btn-share btn-sm" onClick={handleShare}>
            {copied ? '✓ Copied!' : '🔗 Share this set'}
          </button>
        </div>

        <div className="practice-questions-list">
          {session.questions.map((q, i) => <PracticeCard key={i} q={q} index={i} />)}
        </div>

      </main>
    </>
  )
}
