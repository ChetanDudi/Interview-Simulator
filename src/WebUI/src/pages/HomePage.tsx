import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: '📄',
    title: 'Resume Upload',
    desc: 'Upload your PDF resume. AI extracts your skills, projects, and experience automatically.',
    status: 'live' as const,
    link: '/resumes',
    linkLabel: 'Upload Resume →',
  },
  {
    icon: '🎯',
    title: 'AI Question Generation',
    desc: 'GPT-4o-mini generates 8 personalised interview questions based on your resume.',
    status: 'live' as const,
    link: '/resumes',
    linkLabel: 'Start Interview →',
  },
  {
    icon: '🎙️',
    title: 'Voice Interview',
    desc: 'Answer questions by typing or speaking — your browser converts speech to text in real time.',
    status: 'live' as const,
    link: '/resumes',
    linkLabel: 'Try It →',
  },
  {
    icon: '📊',
    title: 'Feedback Report',
    desc: 'Receive AI-scored feedback for every answer with overall, technical, and communication scores.',
    status: 'live' as const,
    link: '/sessions',
    linkLabel: 'View Reports →',
  },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <>
      <NavBar />
      <main className="home-main">
        <section className="hero-section">
          <h1 className="hero-title">Welcome back, {user?.name ?? 'there'}!</h1>
          <p className="hero-subtitle">
            Your AI-powered interview coach is ready. Upload a resume to get started.
          </p>
          <Link to="/resumes" className="btn btn-primary" style={{ marginTop: 20 }}>
            Get Started →
          </Link>
        </section>

        <section className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card feature-card--live">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <Link to={f.link} className="badge badge--live">{f.linkLabel}</Link>
            </div>
          ))}
        </section>

        <section className="user-info">
          <h2>Your Account</h2>
          <div className="info-grid">
            <div className="info-item"><span className="info-label">Name</span><span>{user?.name}</span></div>
            <div className="info-item"><span className="info-label">Email</span><span>{user?.email}</span></div>
            <div className="info-item"><span className="info-label">Role</span><span>{user?.roles.join(', ') || '—'}</span></div>
          </div>
        </section>
      </main>
    </>
  )
}
