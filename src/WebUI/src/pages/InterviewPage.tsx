import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getSession, submitAnswers } from '../api/sessions'
import type { QuestionResponse } from '../api/types'

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

type QuestionStatus = 'unanswered' | 'answered' | 'review'

export default function InterviewPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [questions,      setQuestions]     = useState<QuestionResponse[]>([])
  const [answers,        setAnswers]       = useState<Record<string, string>>({})
  const [flags,          setFlags]         = useState<Record<string, 'review' | undefined>>({})
  const [currentIndex,   setCurrentIndex]  = useState(0)
  const [loading,        setLoading]       = useState(true)
  const [submitting,     setSubmitting]    = useState(false)
  const [error,          setError]         = useState('')
  const [listening,      setListening]     = useState(false)
  const [interimText,    setInterimText]   = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)

  const recognitionRef  = useRef<SpeechRecognition | null>(null)
  const baseAnswerRef   = useRef('')
  const sessionFinalRef = useRef('')
  const currentIdRef    = useRef('')

  useEffect(() => {
    setVoiceSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  useEffect(() => {
    if (!id || !token) return
    getSession(id, token)
      .then(s => { setQuestions(s.questions); setLoading(false) })
      .catch(() => { setError('Failed to load session.'); setLoading(false) })
  }, [id, token])

  const current = questions[currentIndex]
  const total   = questions.length

  function setAnswer(questionId: string, text: string) {
    setAnswers(prev => ({ ...prev, [questionId]: text }))
  }

  function toggleReview(questionId: string) {
    setFlags(prev => ({
      ...prev,
      [questionId]: prev[questionId] === 'review' ? undefined : 'review',
    }))
  }

  function getStatus(q: QuestionResponse): QuestionStatus {
    if (flags[q.id] === 'review') return 'review'
    if (answers[q.id]?.trim()) return 'answered'
    return 'unanswered'
  }

  // ── Voice ─────────────────────────────────────────────────────────────────

  function startVoice() {
    if (!current) return
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    currentIdRef.current    = current.id
    baseAnswerRef.current   = (answers[current.id] ?? '').trimEnd()
    sessionFinalRef.current = ''

    const rec = new SR()
    rec.lang            = 'en-US'
    rec.continuous      = true
    rec.interimResults  = true

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let newFinals = ''
      let interim   = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) newFinals += text
        else interim += text
      }

      if (newFinals) sessionFinalRef.current += newFinals + ' '

      const base = baseAnswerRef.current
      const full = [base, (sessionFinalRef.current + interim).trim()]
        .filter(Boolean).join(' ').trim()

      setAnswer(currentIdRef.current, full)
      setInterimText(interim)
    }

    rec.onerror = () => { setListening(false); setInterimText('') }
    rec.onend   = () => { setListening(false); setInterimText('') }

    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
    setInterimText('')
  }

  function navigate_question(index: number) {
    if (listening) stopVoice()
    setCurrentIndex(index)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!id || !token) return
    if (listening) stopVoice()
    setSubmitting(true)
    setError('')
    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id]?.trim() ?? '',
      }))
      await submitAnswers(id, payload, token)
      navigate(`/report/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      setSubmitting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const categoryColor: Record<string, string> = {
    Technical: '#6366f1', Behavioral: '#f59e0b',
    Project:   '#10b981', Experience: '#3b82f6',
  }
  const difficultyColor: Record<string, string> = {
    Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444',
  }

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length
  const reviewCount   = questions.filter(q => flags[q.id] === 'review').length
  const isReview      = flags[current?.id] === 'review'

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error && questions.length === 0) return <><NavBar /><div className="interview-main"><p className="form-error">{error}</p></div></>

  return (
    <>
      <NavBar />
      <main className="interview-main">

        {/* Progress bar */}
        <div className="interview-progress-bar">
          <div className="interview-progress-fill" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>

        {/* Header row */}
        <div className="interview-header">
          <span className="interview-step">Question {currentIndex + 1} of {total}</span>
          <div className="interview-badges">
            <span className="badge-pill" style={{ background: `${categoryColor[current?.category] ?? '#6366f1'}22`, color: categoryColor[current?.category] ?? '#6366f1', border: `1px solid ${categoryColor[current?.category] ?? '#6366f1'}44` }}>
              {current?.category}
            </span>
            <span className="badge-pill" style={{ background: `${difficultyColor[current?.difficulty] ?? '#6366f1'}22`, color: difficultyColor[current?.difficulty] ?? '#6366f1', border: `1px solid ${difficultyColor[current?.difficulty] ?? '#6366f1'}44` }}>
              {current?.difficulty}
            </span>
          </div>
        </div>

        {/* Question card */}
        <div className={`question-card${isReview ? ' question-card--review' : ''}`}>
          {isReview && <span className="review-tag">🔖 Marked for Review</span>}
          <p className="question-text">{current?.questionText}</p>
        </div>

        {/* Answer area */}
        <div className="answer-area">
          <div className="answer-label-row">
            <label htmlFor="answer">Your Answer</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Mark for review toggle */}
              <button
                type="button"
                className={`review-btn${isReview ? ' review-btn--active' : ''}`}
                onClick={() => toggleReview(current?.id ?? '')}
                title={isReview ? 'Remove review flag' : 'Mark for review'}
              >
                {isReview ? '🔖 Marked' : '🔖 Review'}
              </button>
              {/* Voice */}
              {voiceSupported && (
                <button
                  type="button"
                  className={`mic-btn${listening ? ' mic-btn--active' : ''}`}
                  onClick={listening ? stopVoice : startVoice}
                  title={listening ? 'Stop recording' : 'Start voice input'}
                >
                  {listening ? '⏹ Stop' : '🎙 Speak'}
                </button>
              )}
            </div>
          </div>
          <textarea
            id="answer"
            className="answer-textarea"
            placeholder="Type your answer here, or click the mic to speak…"
            value={answers[current?.id] ?? ''}
            onChange={e => setAnswer(current?.id ?? '', e.target.value)}
            rows={7}
          />
          {listening && (
            <p className="voice-hint">
              🔴 Listening… speak now
              {interimText && <span style={{ color: '#94a3b8', marginLeft: 8 }}>{interimText}</span>}
            </p>
          )}
        </div>

        {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

        {/* Nav buttons */}
        <div className="interview-nav">
          <button
            className="btn btn-ghost"
            onClick={() => navigate_question(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          {currentIndex < total - 1 ? (
            <button className="btn btn-primary" onClick={() => navigate_question(currentIndex + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : '✓ Submit Interview'}
            </button>
          )}
        </div>

        {/* Dot navigation + legend */}
        <div className="dot-nav">
          {questions.map((q, i) => {
            const st = getStatus(q)
            return (
              <button
                key={q.id}
                className={`dot dot--${st}${i === currentIndex ? ' dot--active' : ''}`}
                onClick={() => navigate_question(i)}
                title={`Q${i + 1} — ${st}`}
              />
            )
          })}
        </div>

        <div className="dot-legend">
          <span className="dot-legend-item"><span className="dot dot--unanswered dot-legend-dot" />Unanswered</span>
          <span className="dot-legend-item"><span className="dot dot--answered   dot-legend-dot" />Answered</span>
          <span className="dot-legend-item"><span className="dot dot--review     dot-legend-dot" />Review</span>
        </div>

        {/* Summary bar */}
        <div className="interview-summary-bar">
          <span>{answeredCount}/{total} answered</span>
          {reviewCount > 0 && <span className="review-count-badge">{reviewCount} for review</span>}
        </div>

      </main>
    </>
  )
}
