import { useState } from 'react'
import { retrainAtsModel } from '../api'

export default function Tools() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  async function handleRetrain() {
    setLoading(true)
    setError('')
    try {
      const result = await retrainAtsModel()
      setSummary(result?.summary || null)
    } catch (requestError) {
      setError(requestError.message || 'Retraining failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <section className="section">
        <div className="container simple-stack">
          <div className="hero-copy simple-copy">
            <p className="eyebrow">Model tools</p>
            <h1>Maintain the ATS scoring model</h1>
            <p className="hero-text">
              Retrain the pair-scoring model from the dataset already stored in the project and refresh the live matcher artifacts.
            </p>
          </div>

          <div className="card simple-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Training</p>
                <h2>Retrain ATS model</h2>
              </div>
            </div>

            <p className="muted">
              This updates the decision tree classifier and TF-IDF vectorizer used by the ML fit score in resume analysis.
            </p>

            <div className="action-row">
              <button type="button" className="btn btn-primary" onClick={handleRetrain} disabled={loading}>
                {loading ? 'Retraining...' : 'Retrain model'}
              </button>
            </div>

            {error ? <div className="notice notice-error">{error}</div> : null}

            {summary ? (
              <div className="results-grid-simple">
                <div className="metric-card compact-metric">
                  <span>Rows</span>
                  <strong>{summary.rows}</strong>
                </div>
                <div className="metric-card compact-metric">
                  <span>Accuracy</span>
                  <strong>{Math.round((summary.accuracy || 0) * 100)}%</strong>
                </div>
                <div className="metric-card compact-metric">
                  <span>Precision</span>
                  <strong>{Math.round((summary.precision || 0) * 100)}%</strong>
                </div>
                <div className="metric-card compact-metric">
                  <span>Recall</span>
                  <strong>{Math.round((summary.recall || 0) * 100)}%</strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
