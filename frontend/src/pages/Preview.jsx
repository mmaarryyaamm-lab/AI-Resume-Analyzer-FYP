import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { downloadUpdated, previewDiff } from '../api'

export default function Preview() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const originalText = state.originalText || (typeof window !== 'undefined' ? sessionStorage.getItem('preview_original') || '' : '')
  const updatedTextInitial = state.updatedText || (typeof window !== 'undefined' ? sessionStorage.getItem('preview_updated') || '' : '')
  const uploadedFormat = (typeof window !== 'undefined' ? sessionStorage.getItem('preview_uploaded_format') || '' : '').toLowerCase()

  const [updatedText] = useState(updatedTextInitial)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [showChanges, setShowChanges] = useState(true)

  const canPreview = useMemo(() => (originalText || '').length > 0 && (updatedText || '').length > 0, [originalText, updatedText])

  useEffect(() => {
    if (!canPreview) return
    setLoading(true)
    setError('')
    previewDiff(originalText, updatedText)
      .then((res) => setHtml(res?.html || ''))
      .catch((e) => setError(e.message || 'Failed to generate preview'))
      .finally(() => setLoading(false))
  }, [originalText, updatedText, canPreview])

  async function handleDownload(format) {
    try {
      setDownloading(true)
      setError('')
      if (!canPreview) return
      const blob = await downloadUpdated(updatedText, format)
      // surface server errors returned as JSON instead of a file
      if (blob && blob.type && blob.type.indexOf('application/json') !== -1) {
        const txt = await blob.text()
        throw new Error((() => { try { return (JSON.parse(txt).error || txt) } catch { return txt } })())
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'docx' ? 'resume_updated.docx' : 'resume_updated.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  // Compute added lines to highlight (lines present in updated but not in original, coarse check)
  const addedLineSet = useMemo(() => {
    const origLines = new Set(String(originalText || '').split(/\r?\n/).map((s) => s.trim()))
    const add = new Set()
    String(updatedText || '').split(/\r?\n/).forEach((ln) => {
      const t = ln.trim()
      if (!t) return
      if (!origLines.has(t)) add.add(ln)
    })
    return add
  }, [originalText, updatedText])

  // Gather original headings to mark entirely new sections
  const originalHeadingSet = useMemo(() => {
    const lines = String(originalText || '').split(/\r?\n/)
    const isHeading = (line) => /^(summary|professional summary|profile|objective|experience|work experience|employment history|professional experience|education|academic background|skills|key skills|technical skills|projects|personal projects|selected projects|certifications|certification|achievements|accomplishments)\b/i.test(line.trim().replace(/:$/, ''))
    const set = new Set()
    lines.forEach((ln) => { if (isHeading(ln)) set.add(ln.trim().replace(/:$/, '').toLowerCase()) })
    return set
  }, [originalText])

  // Break updated text into sections by common headings
  const sectioned = useMemo(() => {
    const text = String(updatedText || '')
    const lines = text.split(/\r?\n/)
    const sections = []
    let current = { title: 'Summary', content: [] }
    const isHeading = (line) => /^(summary|professional summary|profile|objective|experience|work experience|employment history|professional experience|education|academic background|skills|key skills|technical skills)\b/i.test(line.trim().replace(/:$/, ''))
    lines.forEach((ln) => {
      if (isHeading(ln)) {
        if (current.content.length) sections.push(current)
        current = { title: ln.trim().replace(/:$/, ''), content: [] }
      } else {
        current.content.push(ln)
      }
    })
    if (current.content.length) sections.push(current)
    return sections
  }, [updatedText])

  const primaryIsDocx = uploadedFormat === 'docx'

  if (!canPreview) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div className="card">
              <div className="preview-header">Preview</div>
              <div className="output-box">
                <div className="muted">No resume loaded. Please upload a resume on the main page to preview changes.</div>
              </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Preview Updated Resume</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => navigate(-1)}>Back</button>
              {primaryIsDocx ? (
                <>
                  <button className="btn" onClick={() => handleDownload('pdf')} disabled={!updatedText || downloading}>{downloading ? 'Downloading…' : 'Download PDF'}</button>
                  <button className="btn btn-primary" onClick={() => handleDownload('docx')} disabled={!updatedText || downloading}>{downloading ? 'Downloading…' : 'Download Word'}</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => handleDownload('pdf')} disabled={!updatedText || downloading}>{downloading ? 'Downloading…' : 'Download PDF'}</button>
                  <button className="btn" onClick={() => handleDownload('docx')} disabled={!updatedText || downloading}>{downloading ? 'Downloading…' : 'Download Word'}</button>
                </>
              )}
            </div>
          </div>

          {/* Changes vs Sections toggle */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="preview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>Changes Preview (Original vs Updated)</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn ${showChanges ? 'btn-primary' : ''}`} onClick={() => setShowChanges(true)}>Changes</button>
                <button className={`btn ${!showChanges ? 'btn-primary' : ''}`} onClick={() => setShowChanges(false)}>By sections</button>
              </div>
            </div>
            {showChanges ? (
              <div className="output-box" style={{ maxHeight: 520, overflow: 'auto', background: '#fff', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, padding: '8px 10px', borderBottom: '1px solid var(--line)', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
                  <span className="chip" style={{ background: '#e6ffed', color: '#096a2e' }}>Added</span>
                  <span className="chip" style={{ background: '#fff5b1', color: '#7a5d0a' }}>Changed</span>
                  <span className="chip" style={{ background: '#ffeef0', color: '#8a1c1c' }}>Removed</span>
                </div>
                {loading ? (
                  <div className="muted" style={{ padding: 12 }}>Generating diff…</div>
                ) : error ? (
                  <div className="muted" style={{ padding: 12 }}>{error}</div>
                ) : html ? (
                  <iframe title="Resume Changes" style={{ width: '100%', height: 500, border: '0' }} srcDoc={html} />
                ) : (
                  <div className="muted" style={{ padding: 12 }}>No changes to show.</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 16, display: showChanges ? 'none' : 'block' }}>
            <div className="preview-header">Resume Preview (by sections)</div>
            <div className="output-box" style={{ maxHeight: 700, overflow: 'auto' }}>
              {sectioned.length === 0 ? (
                <div className="muted">No sections detected.</div>
              ) : (
                sectioned.map((sec, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: '4px 0 8px' }}>
                      {sec.title}
                      {!originalHeadingSet.has(String(sec.title || '').toLowerCase()) && (
                        <span className="badge ok" style={{ marginLeft: 8 }}>New</span>
                      )}
                    </h4>
                    {sec.content.map((ln, i) => {
                      const isAdded = addedLineSet.has(ln)
                      return (
                        <div key={i} style={{ whiteSpace: 'pre-wrap', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {isAdded ? (
                            <span aria-hidden="true" style={{ display: 'inline-block', width: 6, minWidth: 6, height: '1.2em', background: '#e6ffed', borderLeft: '4px solid #16a34a', marginTop: 2 }}></span>
                          ) : (
                            <span aria-hidden="true" style={{ display: 'inline-block', width: 6, minWidth: 6, height: '1.2em', background: 'transparent', marginTop: 2 }}></span>
                          )}
                          <span style={{ background: isAdded ? '#e6ffed' : 'transparent' }}>{ln || ' '}</span>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


