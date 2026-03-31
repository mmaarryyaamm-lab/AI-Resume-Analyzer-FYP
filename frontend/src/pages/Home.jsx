import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  aiSuggest,
  analyzeResume,
  extractNer,
  retrainAtsModel,
  rewriteResume,
  smartDownloadResume,
  smartParseResume,
  smartRewriteResume,
  uploadResume,
} from '../api'

const JD_PRESETS = [
  {
    id: 'frontend',
    label: 'Frontend Developer',
    text: 'Build responsive React interfaces, collaborate with design, optimize performance, and ship accessible product experiences using modern JavaScript, CSS, and REST APIs.',
  },
  {
    id: 'analyst',
    label: 'Data Analyst',
    text: 'Translate business questions into dashboards, SQL queries, and executive-ready insights with strong communication, Excel, BI tooling, and data storytelling.',
  },
  {
    id: 'pm',
    label: 'Product Manager',
    text: 'Own roadmap, align cross-functional teams, write clear product requirements, track outcomes, and turn customer insight into shipped improvements.',
  },
]

const WORKSPACE_KEY = 'resume_workspace'

function normalizeList(items) {
  if (!Array.isArray(items)) return []
  return items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
}

function inferKeywords(analysis) {
  if (!analysis) return { matched: [], missing: [] }
  return {
    matched: normalizeList(analysis.matched_keywords),
    missing: normalizeList(analysis.missing_keywords),
  }
}

function buildSmartUpdatedText(mappings = [], acceptedIds = []) {
  const accepted = new Set(acceptedIds)
  const lines = []

  mappings.forEach((mapping) => {
    const heading = mapping.original_heading || ''
    const sectionId = mapping.original_id
    const content = accepted.has(sectionId) && mapping.has_changes
      ? mapping.improved_content || mapping.original_content || ''
      : mapping.original_content || ''

    if (heading) lines.push(heading)
    if (content) lines.push(content)
    lines.push('')
  })

  return lines.join('\n').trim()
}

function buildFallbackSmartResume(text, file) {
  const content = String(text || '').trim()
  if (!content) {
    return {
      success: true,
      file_name: file?.name || 'resume',
      file_type: String(file?.name || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
      full_text: '',
      sections: [],
      mappings: [],
      section_count: 0,
    }
  }

  const section = {
    id: 'full_resume',
    heading: 'Resume',
    content,
  }

  return {
    success: true,
    file_name: file?.name || 'resume',
    file_type: String(file?.name || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
    full_text: content,
    sections: [section],
    mappings: [{
      original_id: 'full_resume',
      original_heading: 'Resume',
      original_content: content,
      improved_content: content,
      has_changes: false,
    }],
    section_count: 1,
  }
}

function countEntities(nerData) {
  if (!nerData || typeof nerData !== 'object') return 0
  return Object.values(nerData).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length
    if (value) return total + 1
    return total
  }, 0)
}

function formatPercentScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--'
  }
  return `${Math.round(Number(value) * 100)}%`
}

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

export default function Home() {
  const navigate = useNavigate()
  const { user, history, refreshHistory, openAuthModal } = useOutletContext()
  const fileInputRef = useRef(null)

  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiFeedback, setAiFeedback] = useState('')
  const [nerData, setNerData] = useState(null)
  const [rewriteResult, setRewriteResult] = useState(null)
  const [smartResume, setSmartResume] = useState(null)
  const [acceptedSections, setAcceptedSections] = useState([])
  const [trainingSummary, setTrainingSummary] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_KEY)
      if (!saved) return
      const workspace = JSON.parse(saved)
      if (workspace.jobDescription) setJobDescription(workspace.jobDescription)
    } catch {
      localStorage.removeItem(WORKSPACE_KEY)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({
          jobDescription,
          uploadResult,
          analysis,
          aiFeedback,
          nerData,
          rewriteResult,
          smartResume,
          acceptedSections,
        }),
      )
    } catch {
      // ignore persistence issues
    }
  }, [jobDescription, uploadResult, analysis, aiFeedback, nerData, rewriteResult, smartResume, acceptedSections])

  const keywordSummary = useMemo(() => inferKeywords(analysis), [analysis])
  const improvedText = useMemo(() => buildSmartUpdatedText(smartResume?.mappings, acceptedSections), [smartResume, acceptedSections])
  const changedSections = useMemo(() => smartResume?.mappings?.filter((item) => item.has_changes) || [], [smartResume])
  const hasWorkspaceData = Boolean(
    resumeFile
    || uploadResult
    || analysis
    || aiFeedback
    || nerData
    || rewriteResult
    || smartResume
    || acceptedSections.length,
  )

  const metrics = [
    {
      label: 'ATS score',
      value: formatPercentScore(analysis?.ats_score),
    },
    {
      label: 'ML confidence',
      value: formatPercentScore(analysis?.ml_score),
    },
    {
      label: 'Missing keywords',
      value: String(keywordSummary.missing.length),
    },
    {
      label: 'Updated sections',
      value: String(changedSections.length),
    },
  ]

  function syncBuilderWorkspace(nextSmartResume = smartResume, nextAccepted = acceptedSections) {
    const sections = nextSmartResume?.mappings?.map((mapping) => ({
      id: mapping.original_id,
      heading: mapping.original_heading,
      original: mapping.original_content || '',
      draft: nextAccepted.includes(mapping.original_id) && mapping.has_changes
        ? mapping.improved_content || mapping.original_content || ''
        : mapping.original_content || '',
    })) || []

    try {
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({
          jobDescription,
          uploadResult,
          analysis,
          aiFeedback,
          nerData,
          rewriteResult,
          smartResume: nextSmartResume,
          acceptedSections: nextAccepted,
          builderSections: sections,
          builderOriginalText: nextSmartResume?.full_text || uploadResult?.resume_text || '',
        }),
      )
    } catch {
      // ignore persistence issues
    }
  }

  function clearWorkspace() {
    setResumeFile(null)
    setError('')
    setNotice('')
    setUploadResult(null)
    setAnalysis(null)
    setAiFeedback('')
    setNerData(null)
    setRewriteResult(null)
    setSmartResume(null)
    setAcceptedSections([])
    setTrainingSummary(null)

    try {
      localStorage.removeItem(WORKSPACE_KEY)
      sessionStorage.removeItem('preview_original')
      sessionStorage.removeItem('preview_updated')
      sessionStorage.removeItem('preview_summary')
    } catch {
      // ignore
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function withLoading(name, task) {
    setLoading(name)
    setError('')
    setNotice('')
    try {
      await task()
    } catch (taskError) {
      setError(taskError.message || 'Something went wrong')
    } finally {
      setLoading('')
    }
  }

  async function handleUploadAndParse() {
    if (!resumeFile) {
      setError('Choose a PDF or DOCX resume first.')
      return
    }

    await withLoading('upload', async () => {
      const uploadData = await uploadResume(resumeFile)
      setUploadResult(uploadData)

      let nextNotice = uploadData?.warning || 'Resume uploaded. Next, run analysis or smart rewrite.'
      let smartData
      try {
        smartData = await smartParseResume(resumeFile)
      } catch (parseError) {
        smartData = buildFallbackSmartResume(uploadData?.resume_text, resumeFile)
        nextNotice = uploadData?.warning
          ? `${uploadData.warning} Advanced parsing was unavailable, so the app used a basic text fallback.`
          : 'Resume uploaded. Advanced parsing was unavailable, so the app used a basic text fallback.'
      }

      const nextAccepted = (smartData.mappings || smartData.sections || []).map((section) => section.id || section.original_id).filter(Boolean)
      const nextSmartResume = {
        ...smartData,
        mappings: smartData.mappings || smartData.sections?.map((section) => ({
          original_id: section.id,
          original_heading: section.heading,
          original_content: section.content,
          improved_content: section.content,
          has_changes: false,
        })) || [],
      }

      setSmartResume(nextSmartResume)
      setAcceptedSections(nextAccepted)
      syncBuilderWorkspace(nextSmartResume, nextAccepted)
      setNotice(nextNotice)
    })
  }

  async function handleAnalyze() {
    if (!resumeFile || !jobDescription.trim()) {
      setError('Upload a resume and paste a job description to run ATS analysis.')
      return
    }

    await withLoading('analyze', async () => {
      const result = await analyzeResume(resumeFile, jobDescription)
      setAnalysis(result)
      setNotice('Analysis complete.')
      if (user) await refreshHistory()
    })
  }

  async function handleSuggestions() {
    if (!resumeFile) {
      setError('Upload a resume before asking for AI suggestions.')
      return
    }

    await withLoading('suggest', async () => {
      const result = await aiSuggest(resumeFile, jobDescription)
      setAiFeedback(typeof result?.ai_feedback === 'string' ? result.ai_feedback : JSON.stringify(result?.ai_feedback || result, null, 2))
      setNotice('AI suggestions are ready.')
    })
  }

  async function handleEntityExtraction() {
    if (!resumeFile) {
      setError('Upload a resume before extracting entities.')
      return
    }

    await withLoading('ner', async () => {
      const result = await extractNer(resumeFile)
      setNerData(result)
      setNotice('Entity extraction complete.')
    })
  }

  async function handleRewriteBullets() {
    if (!resumeFile) {
      setError('Upload a resume before rewriting.')
      return
    }

    await withLoading('rewrite', async () => {
      const result = await rewriteResume(resumeFile)
      setRewriteResult(result)
      setNotice('Quick rewrite complete.')
    })
  }

  async function handleSmartRewrite() {
    if (!smartResume?.sections?.length && !smartResume?.mappings?.length) {
      setError('Upload your resume first so the app can parse its sections.')
      return
    }

    const sections = smartResume.sections || smartResume.mappings.map((mapping) => ({
      id: mapping.original_id,
      heading: mapping.original_heading,
      content: mapping.original_content,
    }))

    await withLoading('smart-rewrite', async () => {
      const result = await smartRewriteResume(sections, jobDescription)
      const nextSmartResume = {
        ...smartResume,
        mappings: result.mappings || [],
      }
      const nextAccepted = (result.mappings || []).filter((item) => item.has_changes).map((item) => item.original_id)

      setSmartResume(nextSmartResume)
      setAcceptedSections(nextAccepted)
      syncBuilderWorkspace(nextSmartResume, nextAccepted)
      setNotice('Smart rewrite complete. Review the suggested sections below.')
    })
  }

  function handleToggleSection(sectionId) {
    const nextAccepted = acceptedSections.includes(sectionId)
      ? acceptedSections.filter((id) => id !== sectionId)
      : [...acceptedSections, sectionId]

    setAcceptedSections(nextAccepted)
    syncBuilderWorkspace(smartResume, nextAccepted)
  }

  function handlePreview() {
    const originalText = smartResume?.full_text || uploadResult?.resume_text || ''
    const updatedText = improvedText || originalText

    if (!originalText || !updatedText) {
      setError('There is no prepared resume to preview yet.')
      return
    }

    try {
      sessionStorage.setItem('preview_original', originalText)
      sessionStorage.setItem('preview_updated', updatedText)
      sessionStorage.setItem('preview_summary', JSON.stringify({
        changedSections: changedSections.length,
        acceptedSections: acceptedSections.length,
        missingKeywords: keywordSummary.missing.length,
      }))
    } catch {
      // ignore
    }

    navigate('/preview', {
      state: { originalText, updatedText },
    })
  }

  async function handleSmartDownload(format) {
    if (!smartResume?.mappings?.length) {
      setError('Run smart parsing first so the app has section mappings to export.')
      return
    }

    await withLoading('download', async () => {
      const blob = await smartDownloadResume({
        fileName: smartResume.file_name,
        fileType: smartResume.file_type,
        mappings: smartResume.mappings,
        acceptedSections,
        originalText: smartResume.full_text || uploadResult?.resume_text || '',
        outputFormat: format,
      })

      downloadBlob(blob, format === 'docx' ? 'resume_improved.docx' : 'resume_improved.pdf')
      setNotice(`Your ${format.toUpperCase()} export is downloading.`)
    })
  }

  async function handleRetrainModel() {
    await withLoading('retrain', async () => {
      const result = await retrainAtsModel()
      setTrainingSummary(result?.summary || null)
      setNotice('Model retrained successfully.')
    })
  }

  return (
    <main>
      <section className="hero-section hero-simple">
        <div className="container simple-stack">
          <div className="hero-copy simple-copy">
            <p className="eyebrow">Resume workspace</p>
            <h1>Improve your resume without the clutter.</h1>
            <p className="hero-text">
              Upload your resume, compare it to a job description, then apply only the changes you want.
            </p>
          </div>

          <div className="card workspace-card simple-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 1</p>
                <h2>Upload and analyze</h2>
              </div>
              <div className="status-pill">{resumeFile ? resumeFile.name : 'No file selected'}</div>
            </div>

            <input
              id="resume-input"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="upload-hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />

            <button type="button" className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              <strong>{resumeFile ? 'Replace resume file' : 'Choose a PDF or DOCX resume'}</strong>
              <span>Start with your current file and improve it step by step.</span>
            </button>

            <label className="field">
              <span>Job description</span>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description."
              />
            </label>

            <div className="preset-row">
              {JD_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className="chip-button" onClick={() => setJobDescription(preset.text)}>
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="primary-actions">
              <button type="button" className="btn btn-primary" onClick={handleUploadAndParse} disabled={!!loading}>
                {loading === 'upload' ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleAnalyze} disabled={!!loading}>
                {loading === 'analyze' ? 'Analyzing...' : 'Analyze match'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSmartRewrite} disabled={!!loading}>
                {loading === 'smart-rewrite' ? 'Rewriting...' : 'Smart rewrite'}
              </button>
              {hasWorkspaceData ? (
                <button type="button" className="btn btn-ghost" onClick={clearWorkspace} disabled={!!loading}>
                  Remove resume
                </button>
              ) : null}
            </div>

            {(notice || error) ? (
              <div className="stack-block">
                {notice ? <div className="notice notice-success">{notice}</div> : null}
                {error ? <div className="notice notice-error">{error}</div> : null}
              </div>
            ) : null}
          </div>

          <div className="results-grid-simple">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-card compact-metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="card simple-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>Review and export</h2>
              </div>
              <div className="status-pill">{acceptedSections.length} accepted</div>
            </div>

            <div className="summary-grid">
              <div>
                <h3>Model verdict</h3>
                <div className="chips-wrap">
                  <span className="chip">{analysis?.ml_label || 'Run analysis first'}</span>
                </div>
                {analysis?.ml_details ? (
                  <div className="detail-metrics">
                    <span className="chip">Overall match {Math.round((analysis.ml_details.cosine_similarity || 0) * 100)}%</span>
                    <span className="chip">Keyword overlap {Math.round((analysis.ml_details.jaccard_similarity || 0) * 100)}%</span>
                    <span className="chip">Shared terms {analysis.ml_details.overlap_count || 0}</span>
                    <span className="chip">{analysis.ml_details.prediction_source === 'trained_model' ? 'Using trained model' : 'Using basic model'}</span>
                  </div>
                ) : null}
              </div>
              <div>
                <h3>Matched keywords</h3>
                <div className="chips-wrap">
                  {keywordSummary.matched.length
                    ? keywordSummary.matched.slice(0, 8).map((item) => <span key={item} className="chip chip-good">{item}</span>)
                    : <span className="muted">Run analysis to see what already matches.</span>}
                </div>
              </div>
              <div className="summary-full">
                <h3>Missing keywords</h3>
                <div className="chips-wrap">
                  {keywordSummary.missing.length
                    ? keywordSummary.missing.slice(0, 8).map((item) => <span key={item} className="chip chip-warn">{item}</span>)
                    : <span className="muted">No missing keywords to show yet.</span>}
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="btn btn-primary" onClick={handlePreview}>Preview changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => handleSmartDownload('pdf')} disabled={!!loading}>
                {loading === 'download' ? 'Preparing...' : 'Download PDF'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleSmartDownload('docx')} disabled={!!loading}>
                {loading === 'download' ? 'Preparing...' : 'Download DOCX'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/builder')}>Open builder</button>
            </div>
          </div>

          {changedSections.length ? (
            <div className="card simple-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Suggested changes</p>
                  <h2>Choose what to keep</h2>
                </div>
              </div>

              <div className="rewrite-list">
                {changedSections.map((mapping) => (
                  <article key={mapping.original_id} className="rewrite-card">
                    <div className="rewrite-header">
                      <div>
                        <h3>{mapping.original_heading || 'Untitled section'}</h3>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={acceptedSections.includes(mapping.original_id)}
                          onChange={() => handleToggleSection(mapping.original_id)}
                        />
                        <span>Keep</span>
                      </label>
                    </div>

                    <div className="compare-grid">
                      <div>
                        <h4>Original</h4>
                        <pre>{mapping.original_content}</pre>
                      </div>
                      <div>
                        <h4>Improved</h4>
                        <pre>{mapping.improved_content}</pre>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <details className="card disclosure-card">
            <summary>More tools and details</summary>
            <div className="disclosure-body">
              <div className="action-row">
                <button type="button" className="btn btn-secondary" onClick={handleSuggestions} disabled={!!loading}>
                  {loading === 'suggest' ? 'Working...' : 'AI suggestions'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleEntityExtraction} disabled={!!loading}>
                  {loading === 'ner' ? 'Extracting...' : 'Extract entities'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleRewriteBullets} disabled={!!loading}>
                  {loading === 'rewrite' ? 'Rewriting...' : 'Quick rewrite'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleRetrainModel} disabled={!!loading}>
                  {loading === 'retrain' ? 'Retraining...' : 'Retrain ATS model'}
                </button>
              </div>

              {trainingSummary ? (
                <div className="detail-block">
                  <h3>Latest model training</h3>
                  <div className="results-grid-simple">
                    <div className="metric-card compact-metric">
                      <span>Rows</span>
                      <strong>{trainingSummary.rows}</strong>
                    </div>
                    <div className="metric-card compact-metric">
                      <span>Accuracy</span>
                      <strong>{Math.round((trainingSummary.accuracy || 0) * 100)}%</strong>
                    </div>
                    <div className="metric-card compact-metric">
                      <span>Precision</span>
                      <strong>{Math.round((trainingSummary.precision || 0) * 100)}%</strong>
                    </div>
                    <div className="metric-card compact-metric">
                      <span>Recall</span>
                      <strong>{Math.round((trainingSummary.recall || 0) * 100)}%</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              {aiFeedback ? (
                <div className="detail-block">
                  <h3>AI suggestions</h3>
                  <div className="stack-text">
                    {aiFeedback.split('\n').filter(Boolean).slice(0, 10).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                  </div>
                </div>
              ) : null}

              {nerData ? (
                <div className="detail-block">
                  <h3>Extracted entities</h3>
                  <div className="chips-wrap">
                    <span className="chip">{countEntities(nerData)} items found</span>
                  </div>
                </div>
              ) : null}

              {uploadResult?.resume_text ? (
                <div className="detail-block">
                  <h3>Resume text</h3>
                  <pre className="resume-pane">{smartResume?.full_text || uploadResult.resume_text}</pre>
                </div>
              ) : null}

              {rewriteResult ? (
                <div className="detail-block">
                  <h3>Quick rewrite output</h3>
                  <pre className="resume-pane small">{typeof rewriteResult === 'string' ? rewriteResult : JSON.stringify(rewriteResult, null, 2)}</pre>
                </div>
              ) : null}

              {user ? (
                <div className="detail-block">
                  <h3>Recent history</h3>
                  {history.length ? (
                    <div className="history-list">
                      {history.slice(0, 5).map((item) => (
                        <div key={item.id} className="history-item">
                          <strong>{item.file_name || 'Resume run'}</strong>
                          <span>{item.created_at}</span>
                          <small>ATS {Math.round(item.ats || 0)}% | ML {Math.round(item.ml || 0)}%</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Run an analysis while signed in and your recent checks will appear here.</p>
                  )}
                </div>
              ) : (
                <div className="detail-block">
                  <h3>Save your analysis history</h3>
                  <p className="muted">Sign in if you want recent ATS runs saved to your account.</p>
                  <button type="button" className="btn btn-secondary" onClick={openAuthModal}>Sign in</button>
                </div>
              )}
            </div>
          </details>
        </div>
      </section>
    </main>
  )
}
