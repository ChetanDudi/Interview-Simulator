import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { uploadResume, getMyResumes, deleteResume } from '../api/resumes'
import { createSession } from '../api/sessions'
import type { ResumeResponse } from '../api/types'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const QUESTION_PRESETS = [5, 8, 10, 15]

export default function ResumePage() {
  const { token }    = useAuth()
  const navigate     = useNavigate()

  const [resumes,     setResumes]     = useState<ResumeResponse[]>([])
  const [dragging,    setDragging]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [error,       setError]       = useState('')
  const fileInputRef  = useRef<HTMLInputElement>(null)

  // Question count picker modal
  const [pickerResumeId, setPickerResumeId] = useState<string | null>(null)
  const [interviewMode,  setInterviewMode]  = useState<'text' | 'voice'>('text')
  const [sessionMode,    setSessionMode]    = useState<'regular' | 'warmup' | 'coding'>('regular')
  const [questionCount,  setQuestionCount]  = useState(8)
  const [customCount,    setCustomCount]    = useState('')
  const [targetRole,     setTargetRole]     = useState('')
  const [timedSeconds,   setTimedSeconds]   = useState(0)
  const [starting,       setStarting]       = useState(false)

  useEffect(() => {
    if (!token) return
    getMyResumes(token).then(setResumes).catch(() => setError('Failed to load resumes.'))
  }, [token])

  async function handleFile(file: File) {
    setError('')
    if (file.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('File must be under 10 MB.'); return }
    setUploading(true)
    try {
      const uploaded = await uploadResume(file, token!)
      setResumes(prev => [uploaded, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally { setUploading(false) }
  }

  function onDragOver(e: DragEvent) { e.preventDefault(); setDragging(true) }
  function onDragLeave()            { setDragging(false) }
  function onDrop(e: DragEvent)     { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }
  function onFileInput(e: ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }

  function openPicker(resumeId: string, mode: 'text' | 'voice', sMode: 'regular' | 'warmup' | 'coding' = 'regular') {
    setPickerResumeId(resumeId)
    setInterviewMode(mode)
    setSessionMode(sMode)
    setQuestionCount(sMode === 'warmup' ? 3 : 8)
    setCustomCount('')
    setTargetRole('')
    setTimedSeconds(0)
    setError('')
  }
  function closePicker() { setPickerResumeId(null) }

  async function handleStartInterview() {
    if (!pickerResumeId || !token) return
    const count = sessionMode === 'warmup' ? 3 : (customCount !== '' ? parseInt(customCount, 10) : questionCount)
    if (!count || count < 3 || count > 20) { setError('Choose between 3 and 20 questions.'); return }
    setError('')
    setStarting(true)
    try {
      const sessionType = sessionMode === 'coding' ? 'Coding' : undefined
      const session = await createSession(pickerResumeId, count, token, targetRole.trim() || undefined, sessionType)
      const timedParam = timedSeconds > 0 ? `?timed=${timedSeconds}` : ''
      navigate(interviewMode === 'voice' ? `/voice-interview/${session.id}` : `/interview/${session.id}${timedParam}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview.')
      setStarting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteResume(id, token!)
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally { setDeletingId(null) }
  }

  return (
    <>
      <NavBar />
      <main className="resume-main">
        <div className="page-header">
          <h1 className="page-title">My Resumes</h1>
          <p className="page-sub">Upload a PDF — AI will extract your skills and generate interview questions.</p>
        </div>

        <div
          className={`drop-zone${dragging ? ' dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-icon">{uploading ? '⏳' : '📄'}</div>
          <p className="drop-title">{uploading ? 'Uploading & extracting text…' : 'Drop your PDF here'}</p>
          <p className="drop-sub">or click to browse — PDF only, max 10 MB</p>
          {!uploading && (
            <button type="button" className="btn btn-outline" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
              Choose File
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={onFileInput} />
        </div>

        {error && !pickerResumeId && <p className="form-error" role="alert" style={{ marginBottom: 20 }}>{error}</p>}

        {resumes.length > 0 && (
          <div className="resume-list">
            <h2>Uploaded Resumes</h2>
            {resumes.map(r => (
              <div key={r.id} className="resume-item">
                {/* Row 1: icon + info + status badge */}
                <div className="resume-item-top">
                  <span className="resume-icon">📄</span>
                  <div className="resume-info">
                    <div className="resume-name">{r.originalFileName}</div>
                    <div className="resume-meta">{formatBytes(r.fileSizeBytes)} · {formatDate(r.uploadedAtUtc)}</div>
                    {r.interviewCount > 0 && (
                      <div className="resume-stats">
                        <span className="resume-stat-pill">📊 {r.interviewCount} interview{r.interviewCount !== 1 ? 's' : ''}</span>
                        {r.averageScore != null && (
                          <span className="resume-stat-pill" style={{ color: r.averageScore >= 70 ? '#10b981' : r.averageScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                            Avg {Math.round(r.averageScore)}/100
                          </span>
                        )}
                        {r.bestScore != null && (
                          <span className="resume-stat-pill">Best {r.bestScore}/100</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`resume-badge${r.status === 'Ready' ? ' badge--ready' : r.status === 'TextExtractionFailed' ? ' badge--warn' : ''}`}>
                    {r.status === 'Ready' ? '✓ Ready' : r.status === 'TextExtractionFailed' ? '⚠ No text' : r.status}
                  </span>
                </div>

                {/* Row 2: action buttons */}
                <div className="resume-item-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={r.status !== 'Ready'}
                    onClick={() => openPicker(r.id, 'text')}
                    title={r.status !== 'Ready' ? 'Text extraction failed — cannot generate questions' : 'Start text interview'}
                  >
                    📝 Text Interview
                  </button>
                  <button
                    className="btn btn-voice btn-sm"
                    disabled={r.status !== 'Ready'}
                    onClick={() => openPicker(r.id, 'voice')}
                    title={r.status !== 'Ready' ? 'Text extraction failed — cannot generate questions' : 'Start voice interview'}
                  >
                    🎙 Voice Interview
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={r.status !== 'Ready'}
                    onClick={() => openPicker(r.id, 'text', 'warmup')}
                    title="3-question quick warmup"
                  >
                    ⚡ Quick Warmup
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={r.status !== 'Ready'}
                    onClick={() => openPicker(r.id, 'text', 'coding')}
                    title="DSA coding interview with Monaco editor"
                  >
                    💻 Coding Interview
                  </button>
                  {r.status === 'Ready' && (
                    <>
                      <Link to={`/resumes/${r.id}/review`}       className="btn btn-outline btn-sm">📋 AI Review</Link>
                      <Link to={`/resumes/${r.id}/job-match`}    className="btn btn-outline btn-sm">🎯 Job Match</Link>
                      <Link to={`/resumes/${r.id}/cover-letter`} className="btn btn-outline btn-sm">✉ Cover Letter</Link>
                    </>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}>
                    {deletingId === r.id ? '…' : '🗑 Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {resumes.length === 0 && !uploading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>No resumes uploaded yet.</p>
        )}
      </main>

      {/* Question count picker modal */}
      {pickerResumeId && (
        <div className="modal-overlay" onClick={closePicker}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {sessionMode === 'warmup' ? '⚡ Quick Warmup' : sessionMode === 'coding' ? '💻 Coding Interview' : 'How many questions?'}
            </h2>
            <p className="modal-sub">
              {sessionMode === 'warmup'
                ? '3 rapid-fire questions to loosen up before a real interview.'
                : sessionMode === 'coding'
                ? '💻 DSA problems tailored to your tech stack — Monaco code editor included.'
                : interviewMode === 'voice'
                ? '🎙 Voice mode — questions are read aloud, you answer by speaking.'
                : '📝 Text mode — type or speak your answers at your own pace.'}
            </p>

            {sessionMode === 'regular' && (
              <>
                <div className="q-count-presets">
                  {QUESTION_PRESETS.map(n => (
                    <button
                      key={n}
                      className={`q-count-btn${questionCount === n && customCount === '' ? ' q-count-btn--active' : ''}`}
                      onClick={() => { setQuestionCount(n); setCustomCount('') }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="q-count-custom">
                  <label className="q-count-custom-label">Custom (3 – 20)</label>
                  <input
                    type="number" min={3} max={20} placeholder="e.g. 12"
                    value={customCount} onChange={e => setCustomCount(e.target.value)}
                    className="q-count-input"
                  />
                </div>

                {/* Timed mode */}
                <div className="q-count-custom" style={{ marginTop: 16 }}>
                  <label className="q-count-custom-label">Timed Mode <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {[0, 30, 60, 90].map(s => (
                      <button key={s}
                        className={`q-count-btn${timedSeconds === s ? ' q-count-btn--active' : ''}`}
                        onClick={() => setTimedSeconds(s)}
                      >
                        {s === 0 ? 'Off' : `${s}s`}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    {timedSeconds > 0 ? `Auto-advance after ${timedSeconds}s per question.` : 'No time limit per question.'}
                  </p>
                </div>
              </>
            )}

            {sessionMode === 'coding' && (
              <div className="q-count-presets" style={{ marginTop: 12 }}>
                {[3, 5, 8].map(n => (
                  <button key={n}
                    className={`q-count-btn${questionCount === n && customCount === '' ? ' q-count-btn--active' : ''}`}
                    onClick={() => { setQuestionCount(n); setCustomCount('') }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            <div className="q-count-custom" style={{ marginTop: 16 }}>
              <label className="q-count-custom-label">Target Role <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                type="text" placeholder="e.g. Senior Frontend Engineer"
                value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="q-count-input" style={{ width: '100%', marginTop: 6 }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>AI will tailor questions for this specific role.</p>
            </div>

            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closePicker}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStartInterview} disabled={starting}>
                {starting
                  ? 'Generating questions…'
                  : sessionMode === 'warmup'
                  ? 'Start Warmup (3 questions)'
                  : `Start with ${customCount || questionCount} questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
