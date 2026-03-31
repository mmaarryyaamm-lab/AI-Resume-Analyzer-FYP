export default function Privacy() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <h2>Privacy & data use</h2>
          <p className="muted" style={{ maxWidth: 760 }}>
            AI Resume Analyzer is designed to help you improve your resume without turning your personal data into a
            product. This page explains, in plain language, what happens to your CV when you use the tool.
          </p>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>What we process</h3>
            <ul className="pretty-list">
              <li>Resume content that you upload as a PDF or DOCX file.</li>
              <li>Optional job descriptions that you paste for ATS analysis.</li>
              <li>Derived text such as extracted keywords, scores, and AI suggestions.</li>
            </ul>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>How your data is used</h3>
            <ul className="pretty-list">
              <li>Files and text are used only to perform scoring, extraction, rewriting, and preview for your session.</li>
              <li>We do not sell your resume data or job descriptions to third parties.</li>
              <li>Aggregate, anonymized metrics (for example, feature usage counts) may be used to improve the product.</li>
            </ul>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Storage & retention</h3>
            <ul className="pretty-list">
              <li>Uploaded files are stored on the server only as long as needed to run analysis and previews.</li>
              <li>Client‑side history (recent analyses) is stored in your browser only and can be cleared at any time.</li>
              <li>If you refresh or change browsers, server‑side state is not carried over.</li>
            </ul>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Your controls</h3>
            <ul className="pretty-list">
              <li>Use the “Remove CV” option on the home page to clear uploaded content from the current session.</li>
              <li>Clear your browser storage to remove local history and cached previews.</li>
              <li>If this tool is deployed for real users, add a contact address here for data‑removal requests.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

