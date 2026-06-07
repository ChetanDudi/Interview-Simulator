import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getBehavioralSession, submitBehavioralAnswers } from '../api/behavioral'
import type { BehavioralQuestion } from '../api/types'

const CATEGORY_COLORS: Record<string, string> = {
  Leadership: '#6366f1', Teamwork: '#10b981', Conflict: '#ef4444',
  Achievement: '#f59e0b', Failure: '#94a3b8', Adaptability: '#3b82f6',
  Communication: '#8b5cf6', 'Problem-Solving': '#06b6d4',
}

export default function BehavioralInterviewPage() {
  const { id }     = useParams<{ id: string }>()
  const { token }  = useAuth()
  const navigate   = useNavigate()

  const [questions,    setQuestions]    = useState<BehavioralQuestion[]>([])
  const [topic,        setTopic]        = useState('')
  const [answers,      setAnswers]      = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [showHint,     setShowHint]     = useState(false)
  const [elapsed,      setElapsed]      = useState(0)

  const startTimeRef    = useRef<number>(Date.now())
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id || !token) return
    getBehavioralSession(id, token)
      .then(s => {
        setQuestions(s.questions)
        setTopic(s.topic)
        setAnswers(new Array(s.questions.length).fill(''))
        setLoading(false)
        timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
      })
      .catch(() => { setError('Failed to load session.'); setLoading(false) })
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id, token])

  function setAnswer(index: number, text: string) {
    setAnswers(prev => { const a = [...prev]; a[index] = text; return a })
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  async function handleSubmit() {
    if (!id || !token) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true); setError('')
    try {
      await submitBehavioralAnswers(id, answers, elapsed, token)
      navigate(`/behavioral/${id}/report`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      setSubmitting(false)
    }
  }

  const current = questions[currentIndex]
  const total   = questions.length

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error && questions.length === 0) return <><NavBar /><div className="practice-main"><p className="form-error">{error}</p></div></>

  return (
    <>
      <NavBar />
      <main className="interview-main">

        <div className="interview-progress-bar">
          <div className="interview-progress-fill" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>

        <div className="interview-header">
          <span className="interview-step">Question {currentIndex + 1} of {total}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Topic: {topic}</span>
          <span className="interview-timer">⏱ {formatTime(elapsed)}</span>
          {current && (
            <span className="badge-pill" style={{
              background: `${CATEGORY_COLORS[current.category] ?? '#6366f1'}22`,
              color: CATEGORY_COLORS[current.category] ?? '#6366f1',
              border: `1px solid ${CATEGORY_COLORS[current.category] ?? '#6366f1'}44`,
            }}>
              {current.category}
            </span>
          )}
        </div>

        <div className="question-card">
          <p className="question-text">{current?.questionText}</p>
        </div>

        {current?.starHint && (
          <div style={{ marginBottom: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHint(h => !h)}
            >
              {showHint ? '▲ Hide STAR hint' : '💡 Show STAR hint'}
            </button>
            {showHint && (
              <div style={{
                background: 'var(--bg-input)', border: '1px solid #1e2a45',
                borderRadius: 8, padding: '10px 14px', marginTop: 8,
                color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6,
              }}>
                <strong style={{ color: '#6366f1' }}>STAR Hint:</strong> {current.starHint}
              </div>
            )}
          </div>
        )}

        <div className="answer-area">
          <div className="answer-label-row">
            <label htmlFor="answer">Your Answer (use STAR method)</label>
          </div>
          <textarea
            id="answer"
            className="answer-textarea"
            placeholder="Describe the Situation, Task, Action, and Result…"
            value={answers[currentIndex] ?? ''}
            onChange={e => setAnswer(currentIndex, e.target.value)}
            rows={8}
          />
        </div>

        {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

        <div className="interview-nav">
          <button className="btn btn-ghost" onClick={() => { setShowHint(false); setCurrentIndex(i => i - 1) }} disabled={currentIndex === 0}>
            ← Previous
          </button>
          {currentIndex < total - 1 ? (
            <button className="btn btn-primary" onClick={() => { setShowHint(false); setCurrentIndex(i => i + 1) }}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : '✓ Submit Interview'}
            </button>
          )}
        </div>

        <div className="dot-nav">
          {questions.map((_, i) => (
            <button key={i}
              className={`dot${answers[i]?.trim() ? ' dot--answered' : ' dot--unanswered'}${i === currentIndex ? ' dot--active' : ''}`}
              onClick={() => { setShowHint(false); setCurrentIndex(i) }}
              title={`Q${i + 1}`}
            />
          ))}
        </div>

        <div className="interview-summary-bar">
          <span>{answers.filter(a => a?.trim()).length}/{total} answered</span>
        </div>
      </main>
    </>
  )
}
