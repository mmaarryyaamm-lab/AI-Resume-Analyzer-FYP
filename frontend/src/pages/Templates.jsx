export default function Templates() {
  const templates = [
    { id: 'classic', name: 'Classic', hint: 'Clean and ATS-friendly' },
    { id: 'modern', name: 'Modern', hint: 'Bold headings, strong accents' },
    { id: 'compact', name: 'Compact', hint: 'Single-page focus' },
    { id: 'elegant', name: 'Elegant', hint: 'Subtle lines and spacing' },
  ]
  return (
    <main>
      <section className="section">
        <div className="container">
          <h2>Templates</h2>
          <div className="grid templates-grid">
            {templates.map(t => (
              <div key={t.id} className="card template">
                <div className="template-thumb" aria-hidden="true"></div>
                <h3>{t.name}</h3>
                <p className="muted">{t.hint}</p>
                <a className="btn btn-outline" href="/builder">Use Template</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}










