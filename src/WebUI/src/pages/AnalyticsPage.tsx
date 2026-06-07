import { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getAnalytics } from '../api/analytics'
import type { AnalyticsResponse } from '../api/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [data,    setData]    = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) return
    getAnalytics(token)
      .then(setData)
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <><NavBar /><div className="loading-screen"><span className="spinner" /></div></>
  if (error)   return <><NavBar /><div className="practice-main"><p className="form-error">{error}</p></div></>

  const d = data!
  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <>
      <NavBar />
      <main className="practice-main">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Track your progress and identify areas to improve.</p>
        </div>

        {/* Stats row */}
        <div className="analytics-stats">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon">🔥</div>
            <div className="analytics-stat-value">{d.streak}</div>
            <div className="analytics-stat-label">Day Streak</div>
          </div>
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon">📊</div>
            <div className="analytics-stat-value">{d.totalInterviews}</div>
            <div className="analytics-stat-label">Total Interviews</div>
          </div>
          {d.averageScore != null && (
            <div className="analytics-stat-card">
              <div className="analytics-stat-icon">⭐</div>
              <div className="analytics-stat-value" style={{ color: scoreColor(d.averageScore) }}>
                {Math.round(d.averageScore)}
              </div>
              <div className="analytics-stat-label">Avg Score</div>
            </div>
          )}
          {d.bestScore != null && (
            <div className="analytics-stat-card">
              <div className="analytics-stat-icon">🏆</div>
              <div className="analytics-stat-value" style={{ color: '#10b981' }}>{d.bestScore}</div>
              <div className="analytics-stat-label">Best Score</div>
            </div>
          )}
        </div>

        {/* Score trend chart */}
        {d.scoreHistory.length > 1 && (
          <div className="practice-card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: '1.05rem' }}>Score Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.scoreHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #1e2a45', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Line
                  type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weak areas */}
        {d.weakAreas.length > 0 && (
          <div className="practice-card">
            <h2 style={{ marginBottom: 16, fontSize: '1.05rem' }}>Performance by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.weakAreas} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #1e2a45', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {d.weakAreas.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {d.weakAreas.map(a => (
                <div key={a.category} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: scoreColor(a.score), display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-muted)' }}>{a.category}:</span>
                  <span style={{ color: scoreColor(a.score), fontWeight: 600 }}>{a.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.totalInterviews === 0 && (
          <div className="practice-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📈</p>
            <p>Complete at least one interview to see your analytics.</p>
          </div>
        )}
      </main>
    </>
  )
}
