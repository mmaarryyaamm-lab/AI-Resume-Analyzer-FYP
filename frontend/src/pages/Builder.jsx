import { useState } from 'react'

export default function Builder() {
  const [activeSection, setActiveSection] = useState('summary')
  return (
    <main>
      <section className="section">
        <div className="container">
          <h2>Resume Builder</h2>
          <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: 16 }}>
            <aside className="card" style={{ padding: 0 }}>
              <nav className="builder-nav">
                {['summary','experience','education','skills'].map((s) => (
                  <button key={s} className={`builder-nav-item ${activeSection===s?'active':''}`} onClick={() => setActiveSection(s)}>
                    {s[0].toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </nav>
            </aside>
            <div className="card">
              <div className="builder-editor">
                <h3 style={{ marginTop: 0 }}>Edit {activeSection}</h3>
                <textarea rows={12} style={{ width: '100%' }} placeholder={`Enter your ${activeSection}...`}></textarea>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="btn">AI Suggest</button>
                  <button className="btn btn-primary">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}










