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
      const text = await generateCoverLetter(id, jd.trim(), token)
      setLetter(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <NavBar />
      <main className="report-main">
        <div className="report-header">
          <Link to="/resumes" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back</Link>
          <h1 className="page-title">Cover Letter Generator</h1>
          <p className="page-sub">Generate a tailored cover letter based on your resume and a job description</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <label className="form-label">Paste the Job Description</label>
          <textarea
            className="form-input"
            style={{ minHeight: 140, resize: 'vertical', fontFamily: 'inherit' }}
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            required
          />
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? <><span className="spinner-sm" /> Generating…</> : '✉ Generate Cover Letter'}
          </button>
        </form>

        {letter && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Your Cover Letter</h2>
              <button className="btn btn-outline btn-sm" onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div
              style={{
                background: '#0f1526',
                border: '1px solid #1e2a45',
                borderRadius: 10,
                padding: '24px 28px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                fontFamily: 'Georgia, serif',
              }}
            >
              {letter}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={handleCopy}>
                {copied ? '✅ Copied to Clipboard' : '📋 Copy to Clipboard'}
              </button>
              <Link to={`/resumes/${id}/job-match`} className="btn btn-outline">🎯 Job Match Analysis</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
