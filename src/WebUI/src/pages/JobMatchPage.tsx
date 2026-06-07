import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { matchJob } from '../api/resumes'
import type { JobMatchResponse } from '../api/types'

function matchColor(pct: number) {
  if (pct >= 70) return '#10b981'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

export default function JobMatchPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()
  const [jd,      setJd]      = useState('')
  const [result,  setResult]  = useState<JobMatchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !token || !jd.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await matchJob(id, jd.trim(), token)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to match.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="report-main">
        <div className="report-header">
          <Link to="/resumes" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back</Link>
          <h1 className="page-title">Job Description Match</h1>
          <p className="page-sub">See how well your resume matches a specific role</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <label className="form-label">Paste the Job Description</label>
          <textarea
            className="form-input"
            style={{ minHeight: 160, resize: 'vertical', fontFamily: 'inherit' }}
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            required
          />
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? <><span className="spinner-sm" /> Analysing…</> : '🎯 Analyse Match'}
          </button>
        </form>

        {result && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                {(() => {
                  const r = 40, circ = 2 * Math.PI * r
                  const fill = (result.matchPercentage / 100) * circ
                  const color = matchColor(result.matchPercentage)
                  return (
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2235" strokeWidth="10" />
                      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
                        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                      <text x="50" y="54" textAnchor="middle" fill={color} fontSize="18" fontWeight="700">{result.matchPercentage}%</text>
                    </svg>
                  )
                })()}
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>Match Score</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 480 }}>{result.summary}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="practice-card">
                <h3 style={{ color: '#10b981', marginBottom: 12, fontSize: '0.95rem' }}>✅ Present Keywords ({result.presentKeywords.length})</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.presentKeywords.map((k, i) => (
                    <span key={i} style={{ background: '#10b98122', color: '#10b981', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>{k}</span>
                  ))}
                </div>
              </div>
              <div className="practice-card">
                <h3 style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.95rem' }}>❌ Missing Keywords ({result.missingKeywords.length})</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.missingKeywords.map((k, i) => (
                    <span key={i} style={{ background: '#ef444422', color: '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {result.highlights.length > 0 && (
              <div className="practice-card" style={{ marginBottom: 12 }}>
                <h3 style={{ color: '#f59e0b', marginBottom: 10, fontSize: '0.95rem' }}>🌟 Highlights</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {result.highlights.map((h, i) => <li key={i} style={{ marginBottom: 5 }}>{h}</li>)}
                </ul>
              </div>
            )}

            {result.gapAnalysis.length > 0 && (
              <div className="practice-card" style={{ marginBottom: 12 }}>
                <h3 style={{ color: '#a78bfa', marginBottom: 10, fontSize: '0.95rem' }}>🔍 Gap Analysis</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {result.gapAnalysis.map((g, i) => <li key={i} style={{ marginBottom: 5 }}>{g}</li>)}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="practice-card">
                <h3 style={{ color: '#38bdf8', marginBottom: 10, fontSize: '0.95rem' }}>💡 Recommendations</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {result.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 5 }}>{r}</li>)}
                </ul>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link to={`/resumes/${id}/cover-letter`} className="btn btn-primary">✉ Generate Cover Letter</Link>
              <Link to={`/resumes/${id}/review`}       className="btn btn-outline">📋 Full Resume Review</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
