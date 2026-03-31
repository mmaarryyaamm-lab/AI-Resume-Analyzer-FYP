import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WORKSPACE_KEY = 'resume_workspace'

function buildText(sections) {
  return sections
    .map((section) => `${section.heading || 'Section'}\n${section.draft || ''}`.trim())
    .join('\n\n')
    .trim()
}

export default function Builder() {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [activeSectionId, setActiveSectionId] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}')
      const builderSections = saved.builderSections || []
      setSections(builderSections)
      setActiveSectionId(builderSections[0]?.id || '')
    } catch {
      setSections([])
    }
  }, [])

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0],
    [sections, activeSectionId],
  )

  function updateSection(id, key, value) {
    const nextSections = sections.map((section) => (
      section.id === id ? { ...section, [key]: value } : section
    ))
    setSections(nextSections)

    try {
      const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}')
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({
          ...saved,
          builderSections: nextSections,
        }),
      )
    } catch {
      // ignore
    }
  }

  function openPreview() {
    const originalText = sections.map((section) => `${section.heading}\n${section.original}`.trim()).join('\n\n')
    const updatedText = buildText(sections)

    sessionStorage.setItem('preview_original', originalText)
    sessionStorage.setItem('preview_updated', updatedText)
    navigate('/preview', {
      state: {
        originalText,
        updatedText,
      },
    })
  }

  if (!sections.length) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Builder is ready when your resume is.</h2>
              <p>Upload and parse a resume from the workspace first. The builder now uses those parsed sections as editable blocks instead of a blank textarea.</p>
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
        <div className="container builder-layout">
          <div className="builder-sidebar card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Builder</p>
                <h2>Edit by section</h2>
              </div>
            </div>

            <div className="builder-nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`builder-nav-item ${activeSection?.id === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <strong>{section.heading || 'Untitled section'}</strong>
                  <small>{(section.draft || '').split(/\s+/).filter(Boolean).length} words</small>
                </button>
              ))}
            </div>
          </div>

          <div className="builder-main">
            <div className="card builder-editor">
              <div className="panel-header">
                <h3>{activeSection?.heading || 'Section'}</h3>
                <button type="button" className="btn btn-secondary" onClick={openPreview}>Preview draft</button>
              </div>

              <label className="field">
                <span>Section heading</span>
                <input
                  value={activeSection?.heading || ''}
                  onChange={(e) => updateSection(activeSection.id, 'heading', e.target.value)}
                />
              </label>

              <div className="compare-grid">
                <label className="field">
                  <span>Original content</span>
                  <textarea rows={16} value={activeSection?.original || ''} readOnly />
                </label>
                <label className="field">
                  <span>Editable draft</span>
                  <textarea
                    rows={16}
                    value={activeSection?.draft || ''}
                    onChange={(e) => updateSection(activeSection.id, 'draft', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="card">
              <div className="panel-header">
                <h3>Compiled resume</h3>
                <span className="status-pill">{buildText(sections).split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <pre className="resume-pane">{buildText(sections)}</pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
