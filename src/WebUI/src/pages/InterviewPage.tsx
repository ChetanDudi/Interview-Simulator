import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getSession, submitAnswers, shareSession } from '../api/sessions'
import type { QuestionResponse } from '../api/types'

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

type QuestionStatus = 'unanswered' | 'answered' | 'review'

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ', ShortAnswer: 'Short Answer',
  LongAnswer: 'Long Answer', Coding: 'Coding', Other: 'Other',
}
const TYPE_COLORS: Record<string, string> = {
  MCQ: '#6366f1', ShortAnswer: '#10b981', LongAnswer: '#3b82f6',
  Coding: '#f59e0b', Other: '#94a3b8',
}

function McqOptions({
  options, selected, onChange,
}: { options: string[]; selected: string; onChange: (v: string) => void }) {
  return (
    <div className="mcq-options">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          className={`mcq-option${selected === opt ? ' mcq-option--selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
          <span>{opt}</span>
        </button>
      ))}
    </div>
  )
}

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
  const [shareToken,     setShareToken]    = useState<string | undefined>()
  const [sharing,        setSharing]       = useState(false)
  const [shareCopied,    setShareCopied]   = useState(false)

  const recognitionRef  = useRef<ISpeechRecognition | null>(null)
  const baseAnswerRef   = useRef('')
  const sessionFinalRef = useRef('')
  const currentIdRef    = useRef('')
  const startTimeRef    = useRef<number | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setVoiceSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  useEffect(() => {
    if (!id || !token) return
    getSession(id, token)
      .then(s => {
        setQuestions(s.questions)
        setLoading(false)
        startTimeRef.current = Date.now()
        timerIntervalRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000))
        }, 1000)
      })
      .catch(() => { setError('Failed to load session.'); setLoading(false) })
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  }, [id, token])

  const current = questions[currentIndex]
  const total   = questions.length
  const isMCQ   = current?.questionType === 'MCQ'

  function setAnswer(questionId: string, text: string) {
    setAnswers(prev => ({ ...prev, [questionId]: text }))
  }

  function toggleReview(questionId: string) {
    setFlags(prev => ({ ...prev, [questionId]: prev[questionId] === 'review' ? undefined : 'review' }))
  }

  function getStatus(q: QuestionResponse): QuestionStatus {
    if (flags[q.id] === 'review') return 'review'
    if (answers[q.id]?.trim()) return 'answered'
    return 'unanswered'
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!id || !token) return
    setSharing(true)
    try {
      let t = shareToken
      if (!t) {
        const res = await shareSession(id, token)
        t = res.token
        setShareToken(t)
      }
      const url = `${window.location.origin}/shared/interview/${t}/attempt`
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch { /* ignore */ }
    finally { setSharing(false) }
  }

  // ── Voice ─────────────────────────────────────────────────────────────────

  function startVoice() {
    if (!current || isMCQ) return
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    currentIdRef.current    = current.id
    baseAnswerRef.current   = (answers[current.id] ?? '').trimEnd()
    sessionFinalRef.current = ''

    const rec          = new SR()
    rec.lang           = 'en-US'
    rec.continuous     = true
    rec.interimResults = true

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
      const full = [base, (sessionFinalRef.current + interim).trim()].filter(Boolean).join(' ').trim()
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

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  async function handleSubmit() {
    if (!id || !token) return
    if (listening) stopVoice()
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsed
    setSubmitting(true); setError('')
    try {
      const payload = questions.map(q => ({ questionId: q.id, answerText: answers[q.id]?.trim() ?? '' }))
      await submitAnswers(id, payload, timeTaken, token)
      navigate(`/report/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      setSubmitting(false)
    }
  }

  const categoryColor: Record<string, string> = {
    Technical: '#6366f1', Behavioral: '#f59e0b', Project: '#10b981', Experience: '#3b82f6',
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

        <div className="interview-progress-bar">
          <div className="interview-progress-fill" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>

        <div className="interview-header">
          <span className="interview-step">Question {currentIndex + 1} of {total}</span>
          <span className="interview-timer">⏱ {formatTime(elapsed)}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleShare} disabled={sharing} title="Share interview questions">
            {shareCopied ? '✓ Copied!' : sharing ? '…' : '🔗 Share'}
          </button>
          <div className="interview-badges">
            {/* Question type badge */}
            <span className="badge-pill" style={{
              background: `${TYPE_COLORS[current?.questionType] ?? '#6366f1'}22`,
              color: TYPE_COLORS[current?.questionType] ?? '#6366f1',
              border: `1px solid ${TYPE_COLORS[current?.questionType] ?? '#6366f1'}44`,
            }}>
              {TYPE_LABELS[current?.questionType] ?? current?.questionType}
            </span>
            <span className="badge-pill" style={{
              background: `${categoryColor[current?.category] ?? '#6366f1'}22`,
              color: categoryColor[current?.category] ?? '#6366f1',
              border: `1px solid ${categoryColor[current?.category] ?? '#6366f1'}44`,
            }}>
              {current?.category}
            </span>
            <span className="badge-pill" style={{
              background: `${difficultyColor[current?.difficulty] ?? '#6366f1'}22`,
              color: difficultyColor[current?.difficulty] ?? '#6366f1',
              border: `1px solid ${difficultyColor[current?.difficulty] ?? '#6366f1'}44`,
            }}>
              {current?.difficulty}
            </span>
          </div>
        </div>

        <div className={`question-card${isReview ? ' question-card--review' : ''}`}>
          {isReview && <span className="review-tag">🔖 Marked for Review</span>}
          <p className="question-text">{current?.questionText}</p>
        </div>

        {/* Answer area — type-specific */}
        <div className="answer-area">

          {isMCQ ? (
            <>
              <div className="answer-label-row">
                <label>Select your answer</label>
                <button
                  type="button"
                  className={`review-btn${isReview ? ' review-btn--active' : ''}`}
                  onClick={() => toggleReview(current?.id ?? '')}
                >
                  {isReview ? '🔖 Marked' : '🔖 Review'}
                </button>
              </div>
              <McqOptions
                options={current?.options ?? []}
                selected={answers[current?.id] ?? ''}
                onChange={v => setAnswer(current?.id ?? '', v)}
              />
            </>
          ) : (
            <>
              <div className="answer-label-row">
                <label htmlFor="answer">
                  {current?.questionType === 'Coding' ? 'Write your code' : 'Your Answer'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`review-btn${isReview ? ' review-btn--active' : ''}`}
                    onClick={() => toggleReview(current?.id ?? '')}
                  >
                    {isReview ? '🔖 Marked' : '🔖 Review'}
                  </button>
                  {voiceSupported && current?.questionType !== 'Coding' && (
                    <button
                      type="button"
                      className={`mic-btn${listening ? ' mic-btn--active' : ''}`}
                      onClick={listening ? stopVoice : startVoice}
                    >
                      {listening ? '⏹ Stop' : '🎙 Speak'}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id="answer"
                className={`answer-textarea${current?.questionType === 'Coding' ? ' answer-textarea--code' : ''}`}
                placeholder={
                  current?.questionType === 'Coding'
                    ? '// Write your code here…'
                    : current?.questionType === 'ShortAnswer'
                    ? 'Give a brief, focused answer (1-2 sentences)…'
                    : 'Type your detailed answer here, or click the mic to speak…'
                }
                value={answers[current?.id] ?? ''}
                onChange={e => setAnswer(current?.id ?? '', e.target.value)}
                rows={current?.questionType === 'ShortAnswer' ? 3 : current?.questionType === 'Coding' ? 10 : 7}
              />
              {listening && (
                <p className="voice-hint">
                  🔴 Listening… speak now
                  {interimText && <span style={{ color: '#94a3b8', marginLeft: 8 }}>{interimText}</span>}
                </p>
              )}
            </>
          )}
        </div>

        {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

        <div className="interview-nav">
          <button className="btn btn-ghost" onClick={() => navigate_question(currentIndex - 1)} disabled={currentIndex === 0}>
            ← Previous
          </button>
          {currentIndex < total - 1 ? (
            <button className="btn btn-primary" onClick={() => navigate_question(currentIndex + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : '✓ Submit Interview'}
            </button>
          )}
        </div>

        <div className="dot-nav">
          {questions.map((q, i) => {
            const st = getStatus(q)
            return (
              <button key={q.id} className={`dot dot--${st}${i === currentIndex ? ' dot--active' : ''}`}
                onClick={() => navigate_question(i)} title={`Q${i + 1} — ${st}`} />
            )
          })}
        </div>

        <div className="dot-legend">
          <span className="dot-legend-item"><span className="dot dot--unanswered dot-legend-dot" />Unanswered</span>
          <span className="dot-legend-item"><span className="dot dot--answered   dot-legend-dot" />Answered</span>
          <span className="dot-legend-item"><span className="dot dot--review     dot-legend-dot" />Review</span>
        </div>

        <div className="interview-summary-bar">
          <span>{answeredCount}/{total} answered</span>
          {reviewCount > 0 && <span className="review-count-badge">{reviewCount} for review</span>}
        </div>

      </main>
    </>
  )
}
