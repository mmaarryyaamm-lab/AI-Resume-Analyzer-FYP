import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark" aria-hidden="true"><Logo size={22} /></span>
            <span>
              <strong>AI Resume Analyzer</strong>
              <small>Sharper resumes, faster.</small>
            </span>
          </div>
          <p className="footer-copy">
            Upload, analyze, rewrite, preview, and ship a cleaner resume from one workspace instead of juggling separate tools.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="/">Workspace</a>
          <a href="/builder">Builder</a>
          <a href="/preview">Preview</a>
        </div>
        <div>
          <h4>Guidance</h4>
          <a href="/templates">Templates</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} AI Resume Analyzer</small>
        <small>Designed for ATS-safe resume workflows</small>
      </div>
    </footer>
  )
}
