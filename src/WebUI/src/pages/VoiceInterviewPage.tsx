import { useEffect, useRef, useState, useCallback } from 'react'
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

type Phase = 'loading' | 'reading' | 'ready' | 'listening' | 'done' | 'submitting'

export default function VoiceInterviewPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [questions,    setQuestions]    = useState<QuestionResponse[]>([])
  const [answers,      setAnswers]      = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase,        setPhase]        = useState<Phase>('loading')
  const [transcript,   setTranscript]   = useState('')
  const [error,        setError]        = useState('')
  const [shareToken,   setShareToken]   = useState<string | undefined>()
  const [sharing,      setSharing]      = useState(false)
  const [shareCopied,  setShareCopied]  = useState(false)

  const recognitionRef   = useRef<ISpeechRecognition | null>(null)
  const finalTextRef     = useRef('')
  const currentIdRef     = useRef('')
  const startTimeRef     = useRef<number | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const current = questions[currentIndex]
  const total   = questions.length
  const isMCQ   = current?.questionType === 'MCQ'

  // ── Load session ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !token) return
    getSession(id, token)
      .then(s => {
        setQuestions(s.questions)
        setPhase('reading')
        startTimeRef.current = Date.now()
        timerIntervalRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000))
        }, 1000)
      })
      .catch(() => { setError('Failed to load session.'); setPhase('done') })
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  }, [id, token])

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

  // ── TTS ───────────────────────────────────────────────────────────────────

  const readAloud = useCallback((q: QuestionResponse) => {
    window.speechSynthesis.cancel()
    let text = q.questionText
    if (q.questionType === 'MCQ' && q.options.length) {
      text += '. ' + q.options.map((o, i) => `${String.fromCharCode(65 + i)}: ${o}`).join('. ')
    }
    const utt   = new SpeechSynthesisUtterance(text)
    utt.lang    = 'en-US'
    utt.rate    = 0.88
    utt.onend   = () => setPhase('ready')
    utt.onerror = () => setPhase('ready')
    window.speechSynthesis.speak(utt)
    setPhase('reading')
  }, [])

  useEffect(() => {
    if (phase === 'reading' && current) {
      setTranscript('')
      finalTextRef.current = answers[current.id] ?? ''
      readAloud(current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions])

  useEffect(() => () => { window.speechSynthesis.cancel() }, [])

  // ── MCQ selection (no mic needed) ─────────────────────────────────────────

  function selectOption(opt: string) {
    if (!current) return
    setAnswers(prev => ({ ...prev, [current.id]: opt }))
    setPhase('done')
  }

  // ── Voice recording (non-MCQ) ─────────────────────────────────────────────

  function startListening() {
    if (!current || isMCQ) return
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) { setError('Voice not supported in this browser.'); return }

    window.speechSynthesis.cancel()
    currentIdRef.current = current.id
    finalTextRef.current = ''
    setTranscript('')

    const rec          = new SR()
    rec.lang           = 'en-US'
    rec.continuous     = true
    rec.interimResults = true

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finals  = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finals += t + ' '
        else interim += t
      }
      if (finals) finalTextRef.current += finals
      setTranscript((finalTextRef.current + interim).trim())
    }

    rec.onerror = () => stopListening()
    rec.onend   = () => {
      setPhase('done')
      setAnswers(prev => ({ ...prev, [currentIdRef.current]: finalTextRef.current.trim() }))
    }

    rec.start()
    recognitionRef.current = rec
    setPhase('listening')
  }

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function goNext() {
    stopListening()
    window.speechSynthesis.cancel()
    if (current && !isMCQ && finalTextRef.current.trim()) {
      setAnswers(prev => ({ ...prev, [current.id]: finalTextRef.current.trim() }))
    }
    setTranscript('')
    finalTextRef.current = ''
    const next = currentIndex + 1
    setCurrentIndex(next)
    setPhase('reading')
    if (questions[next]) setTimeout(() => readAloud(questions[next]), 100)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!id || !token) return
    stopListening()
    window.speechSynthesis.cancel()
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsed
    const finalAnswers = { ...answers }
    if (current && !isMCQ && finalTextRef.current.trim())
      finalAnswers[current.id] = finalTextRef.current.trim()
    setPhase('submitting')
    try {
      const payload = questions.map(q => ({ questionId: q.id, answerText: finalAnswers[q.id]?.trim() ?? '' }))
      await submitAnswers(id, payload, timeTaken, token)
      navigate(`/report/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      setPhase('done')
    }
  }

  const isLast = currentIndex === total - 1

  if (phase === 'loading') return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error && !total) return <><NavBar /><div className="vi-main"><p className="form-error">{error}</p></div></>

  return (
    <>
      <NavBar />
      <main className="vi-main">

        <div className="vi-progress-bar">
          <div className="vi-progress-fill" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>

        <div className="vi-step-row">
          <p className="vi-step">Question {currentIndex + 1} of {total}</p>
          <span className="interview-timer">⏱ {formatTime(elapsed)}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleShare} disabled={sharing} title="Share interview questions">
            {shareCopied ? '✓ Copied!' : sharing ? '…' : '🔗 Share'}
          </button>
        </div>

        <div className="vi-question-card">
          <span className="vi-q-icon">{isMCQ ? '🔘' : '❓'}</span>
          <p className="vi-question-text">{current?.questionText}</p>
        </div>

        <div className="vi-status">
          {phase === 'reading'    && <span className="vi-status-chip vi-status--reading">🔊 Reading question…</span>}
          {phase === 'ready'      && <span className="vi-status-chip vi-status--ready">{isMCQ ? 'Select an option' : 'Tap the mic to answer'}</span>}
          {phase === 'listening'  && <span className="vi-status-chip vi-status--listening">🔴 Listening…</span>}
          {phase === 'done'       && <span className="vi-status-chip vi-status--done">✓ Answer recorded</span>}
          {phase === 'submitting' && <span className="vi-status-chip vi-status--reading">Submitting…</span>}
        </div>

        {/* MCQ — show tappable options */}
        {isMCQ ? (
          <div className="vi-mcq-options">
            {(current?.options ?? []).map((opt, i) => {
              const selected = answers[current.id] === opt
              return (
                <button
                  key={i}
                  className={`vi-mcq-option${selected ? ' vi-mcq-option--selected' : ''}`}
                  onClick={() => selectOption(opt)}
                  disabled={phase === 'reading' || phase === 'submitting'}
                >
                  <span className="vi-mcq-key">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <>
            <div className="vi-mic-wrap">
              {phase === 'listening' ? (
                <button className="vi-mic-btn vi-mic-btn--active" onClick={stopListening}>
                  <span className="vi-mic-ripple" />
                  <span className="vi-mic-ripple vi-mic-ripple--2" />
                  ⏹
                </button>
              ) : (
                <button
                  className="vi-mic-btn"
                  onClick={startListening}
                  disabled={phase === 'reading' || phase === 'submitting'}
                >
                  🎙
                </button>
              )}
            </div>

            <div className="vi-transcript-box">
              {transcript
                ? <p className="vi-transcript-text">{transcript}</p>
                : <p className="vi-transcript-placeholder">
                    {phase === 'listening' ? 'Start speaking…'
                      : answers[current?.id] ? answers[current?.id]
                      : 'Your spoken answer will appear here'}
                  </p>
              }
            </div>
          </>
        )}

        {(phase === 'ready' || phase === 'done') && (
          <button className="btn btn-ghost vi-reread-btn" onClick={() => readAloud(current)}>
            🔊 Re-read question
          </button>
        )}

        {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

        {(phase === 'done' || phase === 'ready') && (
          <div className="vi-nav">
            {isLast ? (
              <button className="btn btn-primary vi-next-btn" onClick={handleSubmit}>✓ Submit Interview</button>
            ) : (
              <button className="btn btn-primary vi-next-btn" onClick={goNext}>Next Question →</button>
            )}
          </div>
        )}

        <div className="dot-nav" style={{ marginTop: 24 }}>
          {questions.map((q, i) => (
            <span key={q.id}
              className={`dot ${answers[q.id]?.trim() ? 'dot--answered' : 'dot--unanswered'}${i === currentIndex ? ' dot--active' : ''}`}
              title={`Q${i + 1}`} />
          ))}
        </div>
        <p className="vi-answered-count">{questions.filter(q => answers[q.id]?.trim()).length}/{total} answered</p>

      </main>
    </>
  )
}
