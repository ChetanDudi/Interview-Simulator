import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { createBehavioralSession } from '../api/behavioral'

const TOPIC_PRESETS = [
  'Leadership & Management',
  'Teamwork & Collaboration',
  'Conflict Resolution',
  'Problem Solving',
  'Communication Skills',
  'Adaptability & Change',
]

const COUNT_PRESETS = [3, 5, 8, 10]

export default function BehavioralPage() {
  const { token }  = useAuth()
  const navigate   = useNavigate()

  const [topic,   setTopic]   = useState('')
  const [count,   setCount]   = useState(5)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleStart() {
    const t = topic.trim()
    if (!t) { setError('Please enter a topic or select one below.'); return }
    if (!token) return
    setLoading(true); setError('')
    try {
      const session = await createBehavioralSession(t, count, token)
      navigate(`/behavioral/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session.')
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="practice-main">
        <div className="page-header">
          <h1 className="page-title">Behavioral Interview</h1>
          <p className="page-sub">Practice STAR method questions (Situation, Task, Action, Result) — no resume needed.</p>
        </div>

        <div className="practice-card">
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Topic / Focus Area</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Conflict Resolution, Leadership, Communication…"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8 }}>Quick select topic</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TOPIC_PRESETS.map(t => (
                <button
                  key={t}
                  className={`q-count-btn${topic === t ? ' q-count-btn--active' : ''}`}
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Number of questions</label>
            <div className="q-count-presets" style={{ marginTop: 8 }}>
              {COUNT_PRESETS.map(n => (
                <button
                  key={n}
                  className={`q-count-btn${count === n ? ' q-count-btn--active' : ''}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart} disabled={loading}>
            {loading ? 'Generating questions…' : `Start Behavioral Interview (${count} questions)`}
          </button>
        </div>

        <div className="practice-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>What is STAR method?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { letter: 'S', word: 'Situation', desc: 'Describe the context' },
              { letter: 'T', word: 'Task', desc: 'Explain your responsibility' },
              { letter: 'A', word: 'Action', desc: 'What you specifically did' },
              { letter: 'R', word: 'Result', desc: 'Outcome and impact' },
            ].map(s => (
              <div key={s.letter} style={{
                background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px',
                borderLeft: '3px solid #6366f1',
              }}>
                <div style={{ fontWeight: 700, color: '#6366f1', fontSize: '1.3rem' }}>{s.letter}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{s.word}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
