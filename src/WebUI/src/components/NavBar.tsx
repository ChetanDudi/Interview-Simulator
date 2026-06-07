import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home"       className="navbar-brand">Interview <span>Simulator</span></Link>
        <Link to="/resumes"    className="navbar-link">Resumes</Link>
        <Link to="/sessions"   className="navbar-link">History</Link>
        <Link to="/practice"   className="navbar-link">Practice</Link>
        <Link to="/behavioral" className="navbar-link">Behavioral</Link>
        <Link to="/analytics"  className="navbar-link">Analytics</Link>
      </div>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">Hi, {user.name}</span>
          <button className="btn btn-outline" onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </nav>
  )
}
