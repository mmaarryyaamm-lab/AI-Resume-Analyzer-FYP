const samples = [
  {
    id: 'engineering',
    role: 'Software Engineer',
    summary: 'Transforms vague build work into measurable impact, clearer stack ownership, and role-aligned keywords.',
    strengths: ['Performance metrics added', 'Tech stack clarified', 'Leadership impact made visible'],
  },
  {
    id: 'analytics',
    role: 'Data Analyst',
    summary: 'Pulls buried tools and reporting wins into recruiter-friendly bullets with business language.',
    strengths: ['SQL and BI tools surfaced', 'Stakeholder outcomes emphasized', 'Dashboards tied to decisions'],
  },
  {
    id: 'product',
    role: 'Product Manager',
    summary: 'Reframes task-oriented descriptions around ownership, roadmap decisions, and shipped outcomes.',
    strengths: ['Discovery work clarified', 'Cross-functional leadership highlighted', 'Outcome language strengthened'],
  },
]

export default function Templates() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reference gallery</p>
              <h2>Templates that show what “professional” looks like</h2>
            </div>
          </div>

          <div className="templates-grid">
            {samples.map((sample) => (
              <article key={sample.id} className="card template-card">
                <div className="template-head">
                  <span className="status-pill">{sample.role}</span>
                  <h3>{sample.summary}</h3>
                </div>
                <div className="template-preview">
                  <div className="template-sheet before">
                    <strong>Before</strong>
                    <p>Generic bullets, low keyword clarity, and no visual hierarchy between strengths and filler.</p>
                  </div>
                  <div className="template-sheet after">
                    <strong>After</strong>
                    <p>Sharper bullets, cleaner structure, and stronger role alignment for both ATS and recruiter scanning.</p>
                  </div>
                </div>
                <div className="chips-wrap">
                  {sample.strengths.map((strength) => (
                    <span key={strength} className="chip chip-good">{strength}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
