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

function MatchRing({ pct }: { pct: number }) {
  const color = matchColor(pct)
  const r = 44, circ = 2 * Math.PI * r, fill = (pct / 100) * circ
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1e2235" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 55 55)" />
      <text x="55" y="51" textAnchor="middle" fill={color} fontSize="22" fontWeight="800">{pct}%</text>
      <text x="55" y="68" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">MATCH</text>
    </svg>
  )
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
      setResult(await matchJob(id, jd.trim(), token))
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
          <Link to="/resumes" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back to Resumes</Link>
          <h1 className="page-title">Job Description Match</h1>
          <p className="page-sub">See how well your resume matches a specific role</p>
        </div>

        <div className="practice-card" style={{ marginBottom: 28 }}>
          <form onSubmit={handleSubmit}>
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Paste the Job Description</label>
            <textarea
              className="form-input"
              style={{ minHeight: 180, resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here — the more detail the better…"
              required
            />
            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><span className="spinner-sm" />Analysing match…</> : '🎯 Analyse Match'}
              </button>
              {loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>This may take 10–20 seconds</span>}
            </div>
          </form>
        </div>

        {result && (
          <div>
            {/* Score header */}
            <div className="practice-card" style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 20 }}>
              <MatchRing pct={result.matchPercentage} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Overall Match</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>
                  {result.matchPercentage >= 70 ? '🟢 Strong match' : result.matchPercentage >= 40 ? '🟡 Moderate match' : '🔴 Weak match'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.summary}</p>
              </div>
            </div>

            {/* Keywords grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="practice-card">
                <h3 style={{ color: '#10b981', marginBottom: 12, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✅ Present Keywords <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({result.presentKeywords.length})</span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.presentKeywords.map((k, i) => (
                    <span key={i} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500 }}>{k}</span>
                  ))}
                </div>
              </div>
              <div className="practice-card">
                <h3 style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ❌ Missing Keywords <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({result.missingKeywords.length})</span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.missingKeywords.map((k, i) => (
                    <span key={i} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500 }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {result.highlights.length > 0 && (
              <div className="practice-card" style={{ marginBottom: 14 }}>
                <h3 style={{ color: '#f59e0b', marginBottom: 10, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🌟 Highlights</h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {result.highlights.map((h, i) => <li key={i} style={{ marginBottom: 5 }}>{h}</li>)}
                </ul>
              </div>
            )}

            {result.gapAnalysis.length > 0 && (
              <div className="practice-card" style={{ marginBottom: 14 }}>
                <h3 style={{ color: '#a78bfa', marginBottom: 10, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🔍 Gap Analysis</h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {result.gapAnalysis.map((g, i) => <li key={i} style={{ marginBottom: 5 }}>{g}</li>)}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="practice-card" style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#38bdf8', marginBottom: 10, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>💡 Recommendations</h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {result.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 5 }}>{r}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <Link to={`/resumes/${id}/cover-letter`} className="btn btn-primary">✉ Generate Cover Letter</Link>
              <Link to={`/resumes/${id}/review`}       className="btn btn-outline">📋 Full Resume Review</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
