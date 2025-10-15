import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ color: '#fff' }}><Logo size={22} /></span>
          <span>AI Resume Analyzer</span>
        </Link>
        <nav className="main-nav">
          <Link to="/#features">Features</Link>
          <a href="/#how">How it works</a>
          
          <Link to="/faq">FAQ</Link>
          <Link to="/preview">Preview</Link>
        </nav>
      </div>
    </header>
  )
}



