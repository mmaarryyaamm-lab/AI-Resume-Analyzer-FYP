import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { downloadUpdated, previewDiff } from '../api'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Preview() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const originalText = state.originalText || sessionStorage.getItem('preview_original') || ''
  const updatedText = state.updatedText || sessionStorage.getItem('preview_updated') || ''

  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  const summary = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('preview_summary') || '{}')
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    if (!originalText || !updatedText) return

    setLoading(true)
    previewDiff(originalText, updatedText)
      .then((result) => {
        setHtml(result?.html || '')
        setError('')
      })
      .catch((requestError) => setError(requestError.message || 'Unable to build preview'))
      .finally(() => setLoading(false))
  }, [originalText, updatedText])

  async function handleDownload(format) {
    try {
      setDownloading(format)
      const blob = await downloadUpdated(updatedText, format)
      downloadBlob(blob, format === 'docx' ? 'resume_preview.docx' : 'resume_preview.pdf')
    } catch (downloadError) {
      setError(downloadError.message || 'Download failed')
    } finally {
      setDownloading('')
    }
  }

  if (!originalText || !updatedText) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>No preview data yet</h2>
              <p>Return to the workspace, upload a resume, and create a smart rewrite before opening preview.</p>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>Back to workspace</button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>Compare your original resume with the improved draft</h2>
            </div>
            <div className="action-row">
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
              <button type="button" className="btn btn-secondary" onClick={() => handleDownload('pdf')} disabled={!!downloading}>
                {downloading === 'pdf' ? 'Downloading...' : 'Download PDF'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleDownload('docx')} disabled={!!downloading}>
                {downloading === 'docx' ? 'Downloading...' : 'Download DOCX'}
              </button>
            </div>
          </div>

          <div className="workspace-scoreboard metrics-row">
            <div className="metric-card">
              <span>Changed sections</span>
              <strong>{summary.changedSections ?? '--'}</strong>
              <small>Section-level updates prepared in the workspace</small>
            </div>
            <div className="metric-card">
              <span>Accepted sections</span>
              <strong>{summary.acceptedSections ?? '--'}</strong>
              <small>Rewrites included in this preview</small>
            </div>
            <div className="metric-card">
              <span>Missing keywords</span>
              <strong>{summary.missingKeywords ?? '--'}</strong>
              <small>ATS gaps still worth reviewing</small>
            </div>
          </div>

          {error ? <div className="notice notice-error">{error}</div> : null}

          <div className="card preview-card">
            <div className="panel-header">
              <h3>Difference view</h3>
              <span className="status-pill">{loading ? 'Generating' : 'Ready'}</span>
            </div>
            {loading ? (
              <div className="empty-state compact">
                <h3>Building diff preview</h3>
                <p>The app is comparing your original and updated resume line by line.</p>
              </div>
            ) : (
              <iframe title="Resume diff preview" className="preview-frame" srcDoc={html} />
            )}
          </div>

          <div className="compare-grid">
            <div className="card">
              <div className="panel-header">
                <h3>Original text</h3>
              </div>
              <pre className="resume-pane">{originalText}</pre>
            </div>
            <div className="card">
              <div className="panel-header">
                <h3>Updated text</h3>
              </div>
              <pre className="resume-pane">{updatedText}</pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
