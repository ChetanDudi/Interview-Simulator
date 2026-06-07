import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { reviewResume } from '../api/resumes'
import type { ResumeReviewResponse, ReviewSection } from '../api/types'

function scoreColor(score: number) {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <div style={{ flex: 1, height: 6, background: '#1e2235', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color, fontWeight: 600, fontSize: '0.85rem', minWidth: 32, textAlign: 'right' }}>{score}</span>
    </div>
  )
}

function SectionCard({ title, section }: { title: string; section: ReviewSection }) {
  return (
    <div className="practice-card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        <span style={{ color: scoreColor(section.score), fontWeight: 700, fontSize: '1rem' }}>{section.score}/100</span>
      </div>
      <ScoreBar score={section.score} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '10px 0 8px' }}>{section.feedback}</p>
      {section.suggestions.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {section.suggestions.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
        </ul>
      )}
    </div>
  )
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = scoreColor(score)
  const r = 36, circ = 2 * Math.PI * r, fill = (score / 100) * circ
  return (
    <div className="score-ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e2235" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 44 44)" />
      </svg>
      <div className="score-ring-inner">
        <span className="score-ring-value" style={{ color }}>{score}</span>
      </div>
      <p className="score-ring-label">{label}</p>
    </div>
  )
}

export default function ResumeReviewPage() {
  const { id }     = useParams<{ id: string }>()
  const { token }  = useAuth()
  const [review,   setReview]  = useState<ResumeReviewResponse | null>(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState('')

  useEffect(() => {
    if (!id || !token) return
    reviewResume(id, token)
      .then(r => { setReview(r); setLoading(false) })
      .catch(err => { setError(err instanceof Error ? err.message : 'Failed to load review.'); setLoading(false) })
  }, [id, token])

  if (loading) return (
    <>
      <NavBar />
      <div className="loading-screen">
        <span className="spinner" />
        <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Analysing your resume… this may take 10–20 seconds</p>
      </div>
    </>
  )

  if (error || !review) return (
    <>
      <NavBar />
      <main className="report-main">
        <p className="form-error">{error || 'Review not available.'}</p>
        <Link to="/resumes" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to Resumes</Link>
      </main>
    </>
  )

  return (
    <>
      <NavBar />
      <main className="report-main">

        <div className="report-header">
          <Link to="/resumes" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back</Link>
          <h1 className="page-title">Resume Review</h1>
          <p className="page-sub">AI-powered analysis of your resume</p>
        </div>

        {/* Score rings inside a card */}
        <div className="practice-card" style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 24, flexWrap: 'wrap' }}>
          <ScoreRing score={review.overallScore} label="Overall Score" />
          <ScoreRing score={review.atsScore}     label="ATS Score" />
        </div>

        <div className="report-summary" style={{ marginBottom: 24 }}>
          <h2>Summary</h2>
          <p>{review.summary}</p>
        </div>

        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Section Analysis</h3>
        <SectionCard title="Professional Summary"  section={review.summarySection} />
        <SectionCard title="Work Experience"       section={review.experienceSection} />
        <SectionCard title="Skills"                section={review.skillsSection} />
        <SectionCard title="Education"             section={review.educationSection} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="practice-card">
            <h3 style={{ color: '#10b981', marginBottom: 12, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>✅ Top Strengths</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
              {review.topStrengths.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
            </ul>
          </div>
          <div className="practice-card">
            <h3 style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚠ Critical Gaps</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
              {review.criticalGaps.map((g, i) => <li key={i} style={{ marginBottom: 6 }}>{g}</li>)}
            </ul>
          </div>
        </div>

        <div className="practice-card" style={{ marginTop: 14 }}>
          <h3 style={{ color: '#f59e0b', marginBottom: 12, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🤖 ATS Optimisation Tips</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
            {review.atsTips.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
          </ul>
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <Link to={`/resumes/${id}/job-match`}    className="btn btn-primary">🎯 Match a Job Description</Link>
          <Link to={`/resumes/${id}/cover-letter`} className="btn btn-outline">✉ Generate Cover Letter</Link>
          <Link to="/resumes"                       className="btn btn-ghost">← Back to Resumes</Link>
        </div>

      </main>
    </>
  )
}
