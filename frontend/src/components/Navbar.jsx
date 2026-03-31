import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar({ user, sessionLoading, onOpenAuth, onLogout }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true"><Logo size={22} /></span>
          <span>
            <strong>AI Resume Analyzer</strong>
            <small>ATS-ready editing workspace</small>
          </span>
        </Link>

        <nav className="main-nav">
          <Link to="/">Workspace</Link>
          <Link to="/builder">Builder</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/preview">Preview</Link>
        </nav>

        {sessionLoading ? (
          <span className="status-pill">Loading...</span>
        ) : user ? (
          <div className="header-actions">
            <span className="status-pill">{user.name || user.email}</span>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>Sign out</button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onOpenAuth}>Sign in</button>
        )}
      </div>
    </header>
  )
}
