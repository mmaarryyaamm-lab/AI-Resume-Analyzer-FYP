import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="site-footer" style={{ padding: 0 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0b5ed7 0%, #6f42c1 100%)',
          color: '#fff',
        }}
      >
        <div className="container" style={{ padding: '36px 0' }}>
          <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div aria-hidden="true"><Logo size={24} /></div>
                <strong style={{ fontSize: 18 }}>AI Resume Analyzer</strong>
              </div>
              <p style={{ marginTop: 8, opacity: 0.9 }}>
                Build ATS‑friendly resumes with AI insights to get more interviews.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <a href="#" aria-label="Twitter" style={{ color: 'inherit' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.3 1.7-2.3-.8.5-1.7.9-2.6 1.1C18 4.5 17 4 15.9 4c-2.1 0-3.8 1.8-3.8 3.9 0 .3 0 .6.1.8-3.2-.2-6-1.8-7.9-4.3-.4.7-.6 1.3-.6 2.1 0 1.4.7 2.7 1.8 3.4-.6 0-1.3-.2-1.8-.5 0 2 1.5 3.6 3.3 4-.4.1-.8.2-1.2.2-.3 0-.6 0-.8-.1.6 1.8 2.3 3.1 4.3 3.2-1.6 1.3-3.6 2-5.7 2-.4 0-.7 0-1.1-.1 2 1.3 4.3 2 6.8 2 8.1 0 12.5-6.9 12.5-12.8v-.6c.8-.6 1.5-1.3 2-2.1z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" style={{ color: 'inherit' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.98h5V24H0V8.98zM8.5 8.98h4.78v2.05h.07c.66-1.24 2.27-2.55 4.68-2.55 5 0 5.92 3.29 5.92 7.56V24h-5v-6.81c0-1.62-.03-3.7-2.26-3.7-2.26 0-2.61 1.76-2.61 3.58V24h-5V8.98z"/></svg>
                </a>
                <a href="#" aria-label="GitHub" style={{ color: 'inherit' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9 7.6 10.5.6.1.8-.3.8-.6v-2c-3.1.7-3.7-1.3-3.7-1.3-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 . 1 2.6 1.7 1.2 2.6 3.1 1.8 3.9 1.4.1-.9.5-1.8.9-2.2-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.5 3-.5s2 .2 3 .5c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.5-5.2 5.8.4.3.9 1.1 1 2.3v3.4c0 .3.2.7.8.6 4.4-1.5 7.6-5.6 7.6-10.5C23.1 5.3 18.3.5 12 .5z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <strong>Product</strong>
              <ul className="footer-list">
                <li><a href="/#features">Features</a></li>
                <li><a href="/templates">Templates</a></li>
                <li><a href="/builder">Builder</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>
            <div>
              <strong>Resources</strong>
              <ul className="footer-list">
                <li><a href="#">Resume tips</a></li>
                <li><a href="#">Cover letter tips</a></li>
                <li><a href="#">Interview prep</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div>
              <strong>Company</strong>
              <ul className="footer-list">
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#0a4bb1', color: '#dfe9ff' }}>
        <div className="container" style={{ padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <small>© {new Date().getFullYear()} AI Resume Analyzer</small>
          <small>Built with ❤️ for job seekers</small>
        </div>
      </div>
    </footer>
  )
}



