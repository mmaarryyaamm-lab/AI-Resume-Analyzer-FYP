import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analyzeResume, aiSuggest, extractNer, rewriteResume, uploadResume, downloadUpdated } from '../api'
import Logo from '../components/Logo'

export default function Home() {
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(true)
  const [splashStep, setSplashStep] = useState(0)
  const [resumeFile, setResumeFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [nerData, setNerData] = useState(null)
  const [rewritten, setRewritten] = useState(null)
  const [showIntro, setShowIntro] = useState(false)
  const [cvDraft, setCvDraft] = useState('')
  const [showAdded, setShowAdded] = useState(false)
  const [composedText, setComposedText] = useState('')
  const [lastAddition, setLastAddition] = useState('')
  const [targetSection, setTargetSection] = useState('summary')
  const [uploadedFormat, setUploadedFormat] = useState('')

  function getDefaultTarget(sectionLabel) {
    const key = String(sectionLabel || '').toLowerCase()
    if (key.includes('rewrite')) return 'experience'
    if (key.includes('entity')) return 'skills'
    if (key.includes('suggest')) return 'summary'
    return 'summary'
  }

  function cleanSuggestion(text) {
    const lines = String(text || '').split(/\r?\n/)
    const filtered = lines.filter((ln) => {
      const t = ln.trim()
      if (!t) return false
      // Non-actionable or advisory lines should not be applied to CV
      if (/^✅/u.test(t)) return false
      if (/^⚠️/u.test(t)) return false
      if (/^🧹/u.test(t)) return false
      if (/^✏️/u.test(t)) return false
      if (/^🧠/u.test(t)) return false
      if (/^🔄/u.test(t)) return false
      if (/^your resume is missing/i.test(t)) return false
      if (/^grammar suggestions:/i.test(t)) return false
      return true
    })
    return filtered.join('\n').trim()
  }

  function detectTargetSectionFromText(text, fallback) {
    const t = String(text || '').toLowerCase()
    if (/education|degree|b\.?sc|m\.?sc|bachelor|master|university|college/.test(t)) return 'education'
    if (/experience|worked at|responsibilit|accomplish|deliver|manage|lead|develop/.test(t)) return 'experience'
    if (/skill|proficienc|tools|technolog|stack|framework/.test(t)) return 'skills'
    if (/project|github|repository|demo|portfolio/.test(t)) return 'projects'
    if (/certif|license|credential/.test(t)) return 'certifications'
    if (/achievement|award|accomplish|honor/.test(t)) return 'achievements'
    if (/summary|objective|profile|overview/.test(t)) return 'summary'
    return fallback || 'summary'
  }

  function parseAndInsert(baseText, additionText, sectionName) {
    const base = String(baseText || '')
    const rawAddition = String(additionText || '')
    let addition = cleanSuggestion(rawAddition)
    if (!addition) return base

    // Transform advisory like "Your resume is missing a section for X" into constructive content
    const missingMatch = rawAddition.match(/(^|\n)[\-•\*\s]*your resume is missing a section for\s+([A-Za-z ][A-Za-z ]*)\.?/i)
    let normalized = sectionName.toLowerCase()
    if (missingMatch) {
      const raw = missingMatch[2].trim().replace(/\s+/g, ' ')
      const key = raw.toLowerCase()
      // start with any cleaned content (excluding warnings) and, if empty, provide a scaffold
      // choose destination and scaffold if empty
      if (key.includes('project')) {
        normalized = 'projects'
        if (!addition) {
          addition = [
            '• Project: Title — one‑line impact summary (include metrics)',
            '• Tech: Technologies used',
            '• Link: URL or GitHub (optional)'
          ].join('\n')
        }
      } else if (key.includes('cert')) {
        normalized = 'certifications'
        if (!addition) addition = '• Certification Name — Issuer (Year)'
      } else if (key.includes('achievement') || key.includes('accomplishment')) {
        normalized = 'achievements'
        if (!addition) addition = '• Achievement: What you did — quantified result'
      }
    }

    const headingAliases = {
      summary: ['summary', 'professional summary', 'profile', 'objective', 'career summary', 'executive summary'],
      experience: ['experience', 'work experience', 'employment history', 'professional experience', 'work history', 'career history'],
      education: ['education', 'academic background', 'education and training', 'academic history'],
      skills: ['skills', 'key skills', 'technical skills', 'skills & abilities', 'technical proficiencies', 'tools & technologies'],
      projects: ['projects', 'personal projects', 'selected projects', 'notable projects', 'side projects'],
      certifications: ['certifications', 'certification', 'licenses', 'licenses & certifications'],
      achievements: ['achievements', 'accomplishments', 'awards', 'honors']
    }

    const lines = base.split(/\r?\n/)
    const isHeading = (line) => /^(\s)*([A-Z][A-Z\s]{2,}|[A-Za-z][A-Za-z\s]+:)\s*$/.test(line.trim())
    const headingMatches = (line, aliases) => aliases.some(a => line.trim().toLowerCase().startsWith(a))

    let start = -1
    let end = lines.length
    const aliases = headingAliases[normalized] || [normalized]

    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim().toLowerCase().replace(/:$/, '')
      if (headingMatches(t, aliases)) {
        start = i + 1
        // find next heading
        for (let j = start; j < lines.length; j++) {
          if (isHeading(lines[j])) { end = j; break }
        }
        break
      }
    }

    const insertBlock = addition.includes('\n') ? addition : `• ${addition}`
    if (start === -1) {
      // section not found -> insert new section in logical order relative to existing headings
      const title = aliases[0].replace(/\b\w/g, c => c.toUpperCase())
      const standardOrder = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements']
      const norm = (s) => String(s || '').trim().toLowerCase().replace(/:$/, '')
      const isHeading = (line) => /^(\s)*([A-Z][A-Z\s]{2,}|[A-Za-z][A-Za-z\s]+:)\s*$/.test(String(line || '').trim())
      const headingAt = []
      for (let i = 0; i < lines.length; i++) {
        if (isHeading(lines[i])) headingAt.push({ idx: i, text: norm(lines[i]) })
      }
      const presentKeys = headingAt.map(h => {
        for (const [key, list] of Object.entries(headingAliases)) {
          if (list.some(a => h.text.startsWith(a))) return { key, idx: h.idx }
        }
        return null
      }).filter(Boolean)
      let insertIdx = lines.length
      // find first section AFTER our target to insert before
      const targetOrderIndex = Math.max(0, standardOrder.indexOf(normalized))
      for (let oi = targetOrderIndex + 1; oi < standardOrder.length; oi++) {
        const nextKey = standardOrder[oi]
        const hit = presentKeys.find(p => p && p.key === nextKey)
        if (hit) { insertIdx = hit.idx; break }
      }
      const before = lines.slice(0, insertIdx)
      const after = lines.slice(insertIdx)
      const block = [`${title}`, `${insertBlock}`]
      return (before.concat(['', ...block, '']).concat(after).join('\n')).trim()
    }

    const before = lines.slice(0, end)
    const after = lines.slice(end)
    // ensure a bullet spacing
    before.push(insertBlock)
    return (before.concat(after).join('\n')).trim()
  }

  useEffect(() => {
    // sequential checklist animation
    let step = 0
    const iv = setInterval(() => {
      step += 1
      setSplashStep(step)
      if (step >= 4) {
        clearInterval(iv)
        setTimeout(() => setShowSplash(false), 400)
      }
    }, 450)
    const seen = localStorage.getItem('intro_seen')
    if (!seen) setShowIntro(true)
    return () => clearInterval(iv)
  }, [])

  // Restore persisted state (for back navigation without full reload)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('home_state')
      if (saved) {
        const st = JSON.parse(saved)
        if (st && typeof st === 'object') {
          if (typeof st.jdText === 'string') setJdText(st.jdText)
          if (st.uploadResult) setUploadResult(st.uploadResult)
          if (st.analysis) setAnalysis(st.analysis)
          if (st.aiFeedback) setAiFeedback(st.aiFeedback)
          if (st.nerData) setNerData(st.nerData)
          if (st.rewritten) setRewritten(st.rewritten)
          if (typeof st.cvDraft === 'string') setCvDraft(st.cvDraft)
          if (typeof st.composedText === 'string') setComposedText(st.composedText)
          if (typeof st.lastAddition === 'string') setLastAddition(st.lastAddition)
          if (typeof st.targetSection === 'string') setTargetSection(st.targetSection)
          if (typeof st.uploadedFormat === 'string') setUploadedFormat(st.uploadedFormat)
        }
      }
    } catch {}
  }, [])

  // Persist key state to sessionStorage to preserve when navigating away/back
  useEffect(() => {
    try {
      const toSave = {
        jdText,
        uploadResult,
        analysis,
        aiFeedback,
        nerData,
        rewritten,
        cvDraft,
        composedText,
        lastAddition,
        targetSection,
        uploadedFormat
      }
      sessionStorage.setItem('home_state', JSON.stringify(toSave))
    } catch {}
  }, [jdText, uploadResult, analysis, aiFeedback, nerData, rewritten, cvDraft, composedText, lastAddition, targetSection, uploadedFormat])

  function dismissIntro() {
    localStorage.setItem('intro_seen', '1')
    setShowIntro(false)
  }

  async function handleUpload() {
    if (!resumeFile) return
    setError('')
    setLoading('upload')
    try {
      const res = await uploadResume(resumeFile)
      setUploadResult(res)
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setLoading('')
    }
  }

  function handleRemoveCv() {
    try {
      const input = document.getElementById('resume-input')
      if (input) input.value = ''
    } catch {}
    setResumeFile(null)
    setUploadResult(null)
    setAnalysis(null)
    setAiFeedback(null)
    setNerData(null)
    setRewritten(null)
    setCvDraft('')
    setShowAdded(false)
    setComposedText('')
    setLastAddition('')
    setTargetSection('summary')
    setUploadedFormat('')
    setError('')
  }

  async function handleAnalyze() {
    if (!resumeFile || !jdText.trim()) {
      setError('Please select a resume and enter a job description.')
      return
    }
    setError('')
    setLoading('analyze')
    try {
      const res = await analyzeResume(resumeFile, jdText)
      setAnalysis(res)
      if (!uploadResult?.resume_text) {
        try { const up = await uploadResume(resumeFile); setUploadResult(up) } catch {}
      }
    } catch (e) {
      setError(e.message || 'Analyze failed')
    } finally {
      setLoading('')
    }
  }

  async function handleSuggest() {
    if (!resumeFile) {
      setError('Please select a resume.')
      return
    }
    setError('')
    setLoading('suggest')
    try {
      const res = await aiSuggest(resumeFile, jdText)
      setAiFeedback(res?.ai_feedback || res)
      if (!uploadResult?.resume_text) {
        try { const up = await uploadResume(resumeFile); setUploadResult(up) } catch {}
      }
    } catch (e) {
      setError(e.message || 'AI suggestions failed')
    } finally {
      setLoading('')
    }
  }

  async function handleNer() {
    if (!resumeFile) {
      setError('Please select a resume.')
      return
    }
    setError('')
    setLoading('ner')
    try {
      const res = await extractNer(resumeFile)
      setNerData(res)
      if (!uploadResult?.resume_text) {
        try { const up = await uploadResume(resumeFile); setUploadResult(up) } catch {}
      }
    } catch (e) {
      setError(e.message || 'NER extraction failed')
    } finally {
      setLoading('')
    }
  }

  async function handleRewrite() {
    if (!resumeFile) {
      setError('Please select a resume.')
      return
    }
    setError('')
    setLoading('rewrite')
    try {
      const res = await rewriteResume(resumeFile)
      setRewritten(res)
      if (!uploadResult?.resume_text) {
        try { const up = await uploadResume(resumeFile); setUploadResult(up) } catch {}
      }
    } catch (e) {
      setError(e.message || 'Rewrite failed')
    } finally {
      setLoading('')
    }
  }

  function applyToCv(section) {
    // Placeholder for integrating with builder/editor
    let addition = ''
    if (section === 'AI Suggestions' && aiFeedback) {
      const text = typeof aiFeedback === 'string' ? aiFeedback : JSON.stringify(aiFeedback, null, 2)
      addition = cleanSuggestion(text)
    } else if (section === 'Extracted Entities' && nerData) {
      try {
        const parts = Object.entries(nerData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        addition = parts.join('\n')
      } catch { addition = JSON.stringify(nerData, null, 2) }
    } else if (section === 'Rewritten Content' && rewritten) {
      if (typeof rewritten === 'object' && rewritten.rewritten_text) addition = String(rewritten.rewritten_text)
      else if (Array.isArray(rewritten)) addition = rewritten.join('\n')
      else addition = String(rewritten)
    }

    // Do not proceed if there is nothing actionable to apply
    if (!String(addition || '').trim()) {
      setError('No actionable changes to apply.')
      return
    }

    const header = `\n\n### ${section}\n`
    const nextDraft = (cvDraft || '') + header + addition
    setCvDraft(nextDraft)
    setLastAddition(addition)
    const inferred = detectTargetSectionFromText(addition, getDefaultTarget(section))
    setTargetSection(inferred)
    // Prepare composed text to preview/download — export only the merged CV (no raw appendix)
    const base = uploadResult?.resume_text || ''
    const merged = parseAndInsert(base, addition, inferred)
    const finalText = merged.trim()
    setComposedText(finalText)
    setShowAdded(true)
  }

  function downloadCv() {
    const base = uploadResult?.resume_text || ''
    const finalText = base.trim()
    const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume_updated.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function openPreview(finalTextOverride) {
    const base = uploadResult?.resume_text || ''
    const fallback = base
    const finalText = finalTextOverride || composedText || fallback
    if (!base || !finalText) return
    try {
      sessionStorage.setItem('preview_original', base)
      sessionStorage.setItem('preview_updated', finalText)
      if (uploadedFormat) sessionStorage.setItem('preview_uploaded_format', uploadedFormat)
    } catch {}
    navigate('/preview', { state: { originalText: base, updatedText: finalText } })
  }

  async function downloadUpdatedNow(format) {
    try {
      setLoading('download')
      const base = uploadResult?.resume_text || ''
      const merged = lastAddition ? parseAndInsert(base, lastAddition, targetSection) : base
      const finalText = (composedText || merged).trim()
      if (!finalText) return
      const blob = await downloadUpdated(finalText, format)
      // Handle server-side JSON error bodies masquerading as files
      if (blob && blob.type && blob.type.indexOf('application/json') !== -1) {
        const txt = await blob.text()
        const msg = (() => { try { return (JSON.parse(txt).error || txt) } catch { return txt } })()
        throw new Error(msg || 'Download failed')
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
      setLoading('')
    }
  }

  function renderAiSuggestions(content) {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    const lines = text.split(/\n+/)
    const bullets = []
    const paragraphs = []
    lines.forEach((ln) => {
      const t = ln.trim()
      if (!t) return
      if (/^[\-•\*]/.test(t)) bullets.push(t.replace(/^[\-•\*]\s?/, ''))
      else paragraphs.push(t)
    })
    return (
      <div className="output-box">
        {paragraphs.length > 0 && paragraphs.map((p, idx) => (<p key={`p-${idx}`}>{p}</p>))}
        {bullets.length > 0 && (
          <ul className="pretty-list">
            {bullets.map((b, idx) => (<li key={`b-${idx}`}>{b}</li>))}
          </ul>
        )}
      </div>
    )
  }

  function renderNer(data) {
    if (!data) return null
    if (typeof data === 'string') return <div className="output-box"><p>{data}</p></div>
    const entries = Object.entries(data)
    return (
      <div className="kv-grid">
        {entries.map(([k, v]) => (
          <div key={k} className="kv-item">
            <div className="kv-key">{k}</div>
            <div className="kv-val">
              {Array.isArray(v) ? v.map((x, i) => (<span key={i} className="chip">{String(x)}</span>)) : <span className="chip">{String(v)}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderRewrites(data) {
    if (!data) return null
    if (typeof data === 'string') return renderAiSuggestions(data)
    if (typeof data === 'object' && data.rewritten_text) {
      return renderAiSuggestions(String(data.rewritten_text))
    }
    if (Array.isArray(data)) return (
      <ul className="pretty-list">
        {data.map((x, i) => (<li key={i}>{String(x)}</li>))}
      </ul>
    )
    // object fallback
    return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
  }

  if (showSplash) {
    return (
      <div className="splash" role="status" aria-live="polite">
        <div className="splash-inner">
          <div style={{ color: '#0b5ed7', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Logo size={56} />
            <strong style={{ fontSize: 24 }}>AI Resume Analyzer</strong>
          </div>
          <div className="splash-title">Loading...</div>
          <ul className="splash-list">
            <li className={`splash-item ${splashStep >= 1 ? 'ready' : ''}`}><span className={`tick ${splashStep >= 1 ? 'ready' : ''}`}></span> 32+ Professional Resume Designs</li>
            <li className={`splash-item ${splashStep >= 2 ? 'ready' : ''}`}><span className={`tick ${splashStep >= 2 ? 'ready' : ''}`}></span> 100,000+ Pre‑Written Phrases</li>
            <li className={`splash-item ${splashStep >= 3 ? 'ready' : ''}`}><span className={`tick ${splashStep >= 3 ? 'ready' : ''}`}></span> 15,000+ Job Titles</li>
            <li className={`splash-item ${splashStep >= 4 ? 'ready' : ''}`}><span className={`tick ${splashStep >= 4 ? 'ready' : ''}`}></span> 9 Template Color Options</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <main>

      {/* Why use this builder */}
      <section className="section" id="features">
        <div className="container">
          <h2 style={{ textAlign: 'center' }}>Why use our resume builder?</h2>
          <div className="grid features-grid">
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l2.39 4.84L20 7.27l-3.8 3.7.9 5.24L12 14.77 6.9 16.2l.9-5.24L4 7.27l5.61-.43L12 2z" fill="currentColor"/>
                </svg>
              </div>
              <h3>ATS‑optimized templates</h3>
              <p>Choose from professionally designed templates that pass Applicant Tracking Systems.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 13h8M8 17h8M8 9h4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Unlimited creation & editing</h3>
              <p>Create and download as many resumes as you need with pro‑grade tools.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                  <path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Skills tailored to your role</h3>
              <p>Get personalized, job‑specific keyword suggestions that help you stand out.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps section removed as requested */}

      {/* Upload and AI tools */}
      <section className="hero" id="pricing">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Optimize your resume to pass ATS and get more interviews</h1>
            <p>Upload your resume and add a job description. Get instant scores, gaps, and suggestions.</p>
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <div className="upload-area">
                {loading === 'upload' && (
                  <div className="upload-loading" role="status" aria-live="polite">
                    <div className="spinner" aria-hidden="true"></div>
                    <div>Uploading…</div>
                  </div>
                )}
                <div className="upload-body">
                  <h3>Upload your resume to get started</h3>
                  <button className="upload-button" onClick={() => document.getElementById('resume-input')?.click()}>
                    Upload your resume
                  </button>
                  {(resumeFile || uploadResult?.resume_text) && (
                    <button className="btn" style={{ marginLeft: 8 }} onClick={handleRemoveCv} disabled={!!loading}>
                      Remove CV
                    </button>
                  )}
                  <input id="resume-input" className="upload-hidden" type="file" accept=".pdf,.docx" onChange={async (e) => {
                    const file = e.target.files?.[0] || null
                    setResumeFile(file)
                    setError('')
                    setUploadResult(null)
                    if (file?.name) {
                      const lower = file.name.toLowerCase()
                      if (lower.endsWith('.pdf')) setUploadedFormat('pdf')
                      else if (lower.endsWith('.docx')) setUploadedFormat('docx')
                      else setUploadedFormat('')
                    }
                    // Auto-upload for better UX
                    if (file) {
                      try {
                        setLoading('upload')
                        const res = await uploadResume(file)
                        if (res && res.error) {
                          setError(String(res.error))
                        }
                        setUploadResult(res)
                      } catch (err) {
                        setError(err?.message || 'Upload failed')
                      } finally {
                        setLoading('')
                      }
                    }
                  }} />
                  <div className="upload-help">
                    as .pdf or .docx file
                    {resumeFile ? ` — Selected: ${resumeFile.name}` : ''}
                  </div>
                </div>
              </div>
              <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the target job description here (optional for suggestions, required for analyze)"
                  rows={6}
                  aria-label="Job description"
                />
                <div className="cta-actions" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={handleUpload} disabled={!resumeFile || !!loading}>
                    {loading === 'upload' ? 'Uploading…' : 'Quick Upload Preview'}
                  </button>
                  <button className="btn btn-primary" onClick={handleAnalyze} disabled={!resumeFile || !jdText.trim() || !!loading}>
                    {loading === 'analyze' ? 'Analyzing…' : 'Analyze ATS Match'}
                  </button>
                  <button className="btn" onClick={handleSuggest} disabled={!resumeFile || !!loading}>
                    {loading === 'suggest' ? 'Generating…' : 'AI Suggestions'}
                  </button>
                  <button className="btn" onClick={handleNer} disabled={!resumeFile || !!loading}>
                    {loading === 'ner' ? 'Extracting…' : 'Extract Info'}
                  </button>
                  <button className="btn" onClick={handleRewrite} disabled={!resumeFile || !!loading}>
                    {loading === 'rewrite' ? 'Rewriting…' : 'Rewrite Bullets'}
                  </button>
                </div>
                {resumeFile && !uploadResult?.resume_text && !loading && (
                  <div className="notice info" role="status">CV selected — click "Quick Upload Preview" to view</div>
                )}
                {uploadResult?.resume_text && (
                  <div className="notice success" role="status">CV uploaded</div>
                )}
                {error && (
                  <div className="card" style={{ background: '#fee', color: '#900' }}>{error}</div>
                )}
                {cvDraft && (
                  <div className="cta-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => {
                      const base = uploadResult?.resume_text || ''
                      const finalText = composedText || (base + (cvDraft ? `\n\n--- Added by AI Resume Analyzer ---\n${cvDraft}` : '')).trim()
                      openPreview(finalText)
                    }}>Preview Changes</button>
                    <button className="btn btn-primary" onClick={downloadCv}>Download CV</button>
                  </div>
                )}
              </div>

              {/* Left-side full preview removed; preview is shown compact on the right */}

              {analysis && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="preview-header">ATS Analysis</div>
                  <div className="preview-score">
                    <strong>{Math.round((analysis.ats_score ?? 0) * 100)}</strong><span>/100</span>
                  </div>
                  <div className="grid" style={{ gap: 12 }}>
                    <div>
                      <h4>ML Assessment</h4>
                      <p>Score: <strong>{Math.round((analysis.ml_score ?? 0) * 100)}</strong>/100</p>
                      <p>Label: <strong>{analysis.ml_label}</strong></p>
                    </div>
                    <div>
                      <h4>Matched Keywords</h4>
                      <ul className="preview-list">
                        {(analysis.matched_keywords || []).map((k) => (
                          <li key={`m-${k}`} className="ok">{k}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Missing Keywords</h4>
                      <ul className="preview-list">
                        {(analysis.missing_keywords || []).map((k) => (
                          <li key={`x-${k}`} className="warn">{k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {aiFeedback && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="preview-header">AI Suggestions</div>
                  {renderAiSuggestions(aiFeedback)}
                  <div className="cta-actions" style={{ justifyContent: 'flex-end' }}>
                    {(() => {
                      try {
                        const t = typeof aiFeedback === 'string' ? aiFeedback : JSON.stringify(aiFeedback, null, 2)
                        const cleaned = cleanSuggestion(t).trim()
                        return cleaned
                          ? (<button className="btn btn-primary" onClick={() => applyToCv('AI Suggestions')}>Add these changes to my CV</button>)
                          : (<div className="muted">No actionable changes to apply.</div>)
                      } catch {
                        return (<div className="muted">No actionable changes to apply.</div>)
                      }
                    })()}
                  </div>
                </div>
              )}

              {nerData && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="preview-header">Extracted Info</div>
                  {renderNer(nerData)}
                  <div className="cta-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => applyToCv('Extracted Info')}>Add these changes to my CV</button>
                  </div>
                </div>
              )}

              {rewritten && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="preview-header">Rewritten Content</div>
                  {renderRewrites(rewritten)}
                  <div className="cta-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => applyToCv('Rewritten Content')}>Add these changes to my CV</button>
                  </div>
                </div>
              )}
            </div>

            <div className="hero-art" aria-hidden="true">
              {uploadResult?.resume_text ? (
                <div className="cv-mini">
                  <div className="preview-header">Resume Preview</div>
                  <pre>{uploadResult.resume_text}</pre>
                  <div className="insight-actions" style={{ marginTop: 10 }}>
                    <button className="btn btn-primary" onClick={handleSuggest} disabled={!!loading}>Get AI Suggestions</button>
                    <button className="btn" onClick={handleRewrite} disabled={!!loading}>Rewrite Bullets</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Results and AI Suggestions section removed as requested */}
      {/* Discover section with dummy image */}
      <section className="section" id="how">
        <div className="container">
          <div className="grid discover-grid">
            <div>
              <h2>Discover what a winning resume looks like</h2>
              <p>
                Our resumes are designed to get results with clear, simple formatting that hiring systems can easily
                read. While flashy graphics might look nice, they can confuse ATS software and hurt your chances. Our
                builder optimizes your resume to pass ATS effortlessly and get you more interviews.
              </p>
              <ul className="bullet-list">
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  ATS‑friendly formatting
                </li>
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Easy to scan for recruiters
                </li>
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Built‑in keyword guidance
                </li>
              </ul>
            </div>
            <div>
              <div className="video-dummy card" role="img" aria-label="Video placeholder">
                <div className="play-button" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7-11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo: Free builder section */}
      <section className="section">
        <div className="container">
          <div className="grid discover-grid">
            <div>
              <h2>Our resume builder is free</h2>
              <p>
                Many resume builders claim to be free, allowing you to spend valuable time creating your resume.
                However, just when you’re ready to download, you’re hit with a fee. That’s not free— that’s frustrating.
              </p>
              <p>
                We stand by our word. Our resume builder is free to use, with no hidden fees for basic features. For those looking to unlock advanced AI tools, a paid version is available.
              </p>
              <Link className="btn btn-primary" to="/builder">Build my resume now</Link>
            </div>
            <div>
              <div className="promo-shot card" role="img" aria-label="Resume builder preview">
                <div className="window">
                  <div className="window-bar"><span></span><span></span><span></span></div>
                  <div className="window-body">
                    <div className="bar"></div>
                    <div className="bar small"></div>
                    <div className="sheet"></div>
                    <div className="controls">
                      <div className="pill"></div>
                      <div className="btn"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why use an ATS resume */}
      <section className="section">
        <div className="container">
          <div className="grid discover-grid">
            <div>
              <h2>Why use an ATS resume?</h2>
              <p>
                Most companies use ATS software to sort through job applications by scanning for specific keywords.
                If your resume isn’t properly formatted or lacks the right keywords, it might get filtered out before a
                recruiter ever sees it.
              </p>
              <p>
                88% of employers report that qualified candidates are rejected simply because their resumes weren’t
                ATS‑optimized.
              </p>
              <p>
                Our builder ensures your resume is designed to make it through the system and land you an interview.
              </p>
              <ul className="bullet-list" style={{ marginTop: 12 }}>
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/></svg>
                  </span>
                  ATS‑friendly formatting
                </li>
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/></svg>
                  </span>
                  Built‑in keyword guidance
                </li>
                <li>
                  <span className="bullet-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2"/></svg>
                  </span>
                  Easy to scan for recruiters
                </li>
              </ul>
              <Link className="btn btn-primary" to="/builder" style={{ marginTop: 14, display: 'inline-block' }}>Build my resume</Link>
            </div>
            <div>
              <div className="templates-mock card" role="img" aria-label="ATS friendly templates">
                <div className="templates-header">Choose one of our ATS‑friendly resume templates.</div>
                <div className="templates-grid">
                  <div className="tpl">
                    <div className="tpl-sheet"></div>
                    <div className="tpl-caption">Classic Professional</div>
                  </div>
                  <div className="tpl">
                    <div className="tpl-sheet"></div>
                    <div className="tpl-caption">Modern Professional</div>
                  </div>
                  <div className="tpl">
                    <div className="tpl-sheet"></div>
                    <div className="tpl-caption">Modern Student</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results section removed as requested */}

      {/* AI Suggestions Section */}
      <section className="section" id="ai-suggestions">
        <div className="container">
          <h2 style={{ textAlign: 'center' }}>AI Suggestions</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: -6 }}>Quick wins to polish your resume</p>
          <div style={{ maxWidth: 720, margin: '12px auto 0' }}>
            <div className="card insight-panel">
              <div className="insight-header">
                <div className="insight-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.39 4.84L20 7.27l-3.8 3.7.9 5.24L12 14.77 6.9 16.2l.9-5.24L4 7.27l5.61-.43L12 2z" fill="currentColor"/></svg>
                </div>
                <div>
                  <strong>AI Suggestions</strong>
                  <div className="muted">Quick wins to polish your resume</div>
                </div>
              </div>
              <ul className="insight-list">
                <li>
                  <span className="badge ok" aria-hidden="true">✓</span>
                  Use strong verbs at the start of bullets
                </li>
                <li>
                  <span className="badge info" aria-hidden="true">A</span>
                  Quantify impact with numbers where possible
                </li>
                <li>
                  <span className="badge warn" aria-hidden="true">!</span>
                  Keep lines under 2 sentences for readability
                </li>
                <li>
                  <span className="badge key" aria-hidden="true">#</span>
                  Match skills from the job description
                </li>
              </ul>
              <div className="insight-actions">
                <button className="btn btn-primary" onClick={handleSuggest} disabled={!resumeFile || !!loading}>Get AI Suggestions</button>
                <button className="btn" onClick={handleRewrite} disabled={!resumeFile || !!loading}>Rewrite Bullets</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <h2>How to use the resume builder</h2>
          <div className="grid howto-grid">
            <div>
              <ol className="steps">
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Import an existing resume or start from scratch.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 7h12M6 11h12M6 15h8" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Add your job title.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6h16M4 12h10M4 18h14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Select suggested skills for your role.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 10h16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Choose an ATS‑friendly template.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6 20a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Fill in your experience, education, and certificates.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Discover personalized job listings.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Use AI scanner to optimize your resume.
                </li>
                <li>
                  <span className="step-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 3v12" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 21h14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Download your resume as PDF.
                </li>
              </ol>
              <button className="btn btn-primary">Build my resume now</button>
            </div>
            <div className="card" aria-hidden="true">
              <div className="preview-header">Tell us where you worked</div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label>Job Title</label>
                  <input style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} defaultValue="Product Manager" />
                </div>
                <div>
                  <label>Employer</label>
                  <input style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} defaultValue="TradeLot" />
                </div>
                <div>
                  <label>Location</label>
                  <input style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} defaultValue="New York" />
                </div>
                <div>
                  <label>URL</label>
                  <input style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8 }} placeholder="https://" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showIntro && (
        <div className="backdrop fade-in" role="dialog" aria-modal="true">
          <div className="modal float-up" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3 className="modal-title">Welcome to Resume Optimizer</h3>
              <button className="btn btn-outline" onClick={dismissIntro} aria-label="Close">Close</button>
            </div>
            <div className="modal-body">
              <p>
                Upload your resume and (optionally) a job description. We’ll score ATS match, highlight missing keywords, and suggest AI-powered improvements.
              </p>
              <ul className="preview-list">
                <li className="ok">ATS and ML scoring</li>
                <li className="ok">Keyword matching and gaps</li>
                <li className="ok">Bullet rewrites and NER extraction</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={dismissIntro}>Get Started</button>
            </div>
          </div>
        </div>
      )}

      {showAdded && (
        <div className="backdrop fade-in" role="dialog" aria-modal="true">
          <div className="modal float-up" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Next steps</h3>
              <button className="btn btn-outline" onClick={() => setShowAdded(false)} aria-label="Close">Close</button>
            </div>
            <div className="modal-body">
              <p>Your selected updates have been appended to your CV draft.</p>
              <p>Choose an option:</p>
              <div style={{ margin: '8px 0 12px' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Place these changes into section</label>
                <select value={targetSection} onChange={(e) => setTargetSection(e.target.value)}>
                  <option value="summary">Summary</option>
                  <option value="experience">Experience</option>
                  <option value="education">Education</option>
                  <option value="skills">Skills</option>
                </select>
              </div>
              <ul className="preview-list">
                <li className="ok">Preview with highlights (original vs updated)</li>
                <li className="ok">Download as Word or PDF (clean, no highlights)</li>
              </ul>
            </div>
              <div className="modal-actions">
              <button className="btn" onClick={() => { const base = uploadResult?.resume_text || ''; const merged = parseAndInsert(base, lastAddition, targetSection); const finalText = (merged + (cvDraft ? `\n\n--- Added by AI Resume Analyzer ---\n${cvDraft}` : '')).trim(); setComposedText(finalText); setShowAdded(false); openPreview(finalText); }} disabled={!!loading}>Preview with highlights</button>
              <button className="btn" onClick={() => downloadUpdatedNow('pdf')} disabled={!!loading}>{loading === 'download' ? 'Downloading…' : 'Download PDF'}</button>
              <button className="btn btn-primary" onClick={() => downloadUpdatedNow('docx')} disabled={!!loading}>{loading === 'download' ? 'Downloading…' : 'Download Word'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}


