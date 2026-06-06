import { useState } from 'react'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { generatePracticeQuestions, type PracticeQuestion } from '../api/practice'

const PRESETS = [5, 8, 10, 15]

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'MCQ', ShortAnswer: 'Short Answer', LongAnswer: 'Long Answer',
  Coding: 'Coding', Other: 'Other',
}
const TYPE_COLORS: Record<string, string> = {
  MCQ: '#6366f1', ShortAnswer: '#10b981', LongAnswer: '#3b82f6',
  Coding: '#f59e0b', Other: '#94a3b8',
}

function PracticeCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const [revealed,      setRevealed]      = useState(false)
  const [selectedOpt,   setSelectedOpt]   = useState<number | null>(null)
  const isMCQ    = q.questionType === 'MCQ'
  const isCoding = q.questionType === 'Coding'

  function revealAnswer() {
    setRevealed(true)
  }

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

      {/* MCQ options */}
      {isMCQ && q.options.length > 0 && (
        <div className="practice-mcq-options">
          {q.options.map((opt, i) => {
            const isCorrect  = revealed && i === q.correctOptionIndex
            const isSelected = selectedOpt === i
            let cls = 'practice-mcq-opt'
            if (revealed && isCorrect)           cls += ' practice-mcq-opt--correct'
            else if (revealed && isSelected && !isCorrect) cls += ' practice-mcq-opt--wrong'
            else if (!revealed && isSelected)    cls += ' practice-mcq-opt--picked'
            return (
              <button key={i} className={cls} onClick={() => !revealed && setSelectedOpt(i)}>
                <span className="mcq-option-key">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
                {revealed && isCorrect   && <span className="mcq-tick">✓</span>}
                {revealed && isSelected && !isCorrect && <span className="mcq-cross">✗</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Reveal / Answer section */}
      {!revealed ? (
        <button className="btn btn-outline practice-reveal-btn" onClick={revealAnswer}>
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

export default function PracticePage() {
  const { token } = useAuth()

  const [topic,       setTopic]       = useState('')
  const [count,       setCount]       = useState(8)
  const [customCount, setCustomCount] = useState('')
  const [questions,   setQuestions]   = useState<PracticeQuestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [generated,   setGenerated]   = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) { setError('Please enter a topic.'); return }
    const n = customCount !== '' ? parseInt(customCount, 10) : count
    if (!n || n < 3 || n > 20) { setError('Choose between 3 and 20 questions.'); return }
    setError('')
    setLoading(true)
    setQuestions([])
    setGenerated(false)
    try {
      const qs = await generatePracticeQuestions(topic.trim(), n, token!)
      setQuestions(qs)
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <NavBar />
      <main className="practice-main">

        <div className="page-header">
          <h1 className="page-title">Practice Question Generator</h1>
          <p className="page-sub">Enter any interview topic — AI generates questions with full answers for your study.</p>
        </div>

        {/* Generator form */}
        <div className="practice-form">
          <input
            type="text"
            className="practice-topic-input"
            placeholder="e.g. React Hooks, Binary Trees, System Design, SQL Joins…"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />

          <div className="practice-count-row">
            <span className="practice-count-label">Questions:</span>
            <div className="q-count-presets" style={{ flex: 1 }}>
              {PRESETS.map(n => (
                <button
                  key={n}
                  className={`q-count-btn${count === n && customCount === '' ? ' q-count-btn--active' : ''}`}
                  onClick={() => { setCount(n); setCustomCount('') }}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number" min={3} max={20}
              placeholder="Custom"
              value={customCount}
              onChange={e => setCustomCount(e.target.value)}
              className="q-count-input practice-custom-input"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            className="btn btn-primary practice-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating…' : '⚡ Generate Questions'}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p>AI is generating questions on <strong style={{ color: '#e2e8f0' }}>"{topic}"</strong>…</p>
          </div>
        )}

        {/* Results */}
        {generated && questions.length > 0 && (
          <>
            <div className="practice-results-header">
              <h2>{questions.length} Questions on "{topic}"</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setQuestions([]); setGenerated(false) }}>
                Clear
              </button>
            </div>
            <div className="practice-questions-list">
              {questions.map((q, i) => (
                <PracticeCard key={i} q={q} index={i} />
              ))}
            </div>
          </>
        )}

      </main>
    </>
  )
}
