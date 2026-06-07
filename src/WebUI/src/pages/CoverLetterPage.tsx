import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { generateCoverLetter } from '../api/resumes'

export default function CoverLetterPage() {
  const { id }    = useParams<{ id: string }>()
  const { token } = useAuth()
  const [jd,      setJd]      = useState('')
  const [letter,  setLetter]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [copied,  setCopied]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !token || !jd.trim()) return
    setLoading(true); setError(''); setLetter('')
    try {
      setLetter(await generateCoverLetter(id, jd.trim(), token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  return (
    <>
      <NavBar />
      <main className="report-main">
        <div className="report-header">
          <Link to="/resumes" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back to Resumes</Link>
          <h1 className="page-title">Cover Letter Generator</h1>
          <p className="page-sub">AI writes a tailored cover letter from your resume + job description</p>
        </div>

        <div className="practice-card" style={{ marginBottom: 28 }}>
          <form onSubmit={handleSubmit}>
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Paste the Job Description</label>
            <textarea
              className="form-input"
              style={{ minHeight: 160, resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here — the more detail, the better the letter…"
              required
            />
            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><span className="spinner-sm" />Generating…</> : '✉ Generate Cover Letter'}
              </button>
              {loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>This may take 15–30 seconds</span>}
            </div>
          </form>
        </div>

        {letter && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Your Cover Letter</h2>
              <button className="btn btn-outline btn-sm" onClick={handleCopy} style={{ minWidth: 110 }}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div
              style={{
                background: '#0d1423',
                border: '1px solid #1e2a45',
                borderRadius: 12,
                padding: '28px 32px',
                color: '#e2e8f0',
                fontSize: '0.97rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                fontFamily: 'Georgia, "Times New Roman", serif',
                marginBottom: 20,
              }}
            >
              {letter}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? '✅ Copied to Clipboard' : '📋 Copy to Clipboard'}
              </button>
              <Link to={`/resumes/${id}/job-match`} className="btn btn-outline">🎯 Job Match Analysis</Link>
              <Link to={`/resumes/${id}/review`}    className="btn btn-ghost">📋 Resume Review</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
