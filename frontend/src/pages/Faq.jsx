import { useState } from 'react'

export default function Faq() {
  const [open, setOpen] = useState(null)
  const faqs = [
    {
      q: 'What formats can I upload?',
      a: 'We support .pdf and .docx files. For best results, upload a text-based PDF (not a scanned image).',
      icon: 'file',
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. Your resume is processed securely on our server and not shared with third parties. Uploaded files are deleted on a rolling basis. Contact us if you need immediate removal.',
      icon: 'shield',
    },
    {
      q: 'What does ATS analysis include?',
      a: 'We score ATS match, highlight matched and missing keywords, and provide a machine-learning assessment to estimate recruiter fit.',
      icon: 'chart',
    },
    {
      q: 'Do I need a job description?',
      a: 'It is optional for upload preview and AI suggestions, but required for the full ATS analysis so we can compare against the role.',
      icon: 'doc',
    },
    {
      q: 'What are AI Suggestions and Rewrites?',
      a: 'AI Suggestions provide actionable improvements specific to your resume and the target job. Rewrite Bullets uses AI to rephrase selected lines to be clearer and more impactful.',
      icon: 'spark',
    },
    {
      q: 'Can you extract entities (NER)?',
      a: 'Yes. The Extract NER tool pulls entities like skills, organizations, locations and dates to help you verify parsing quality.',
      icon: 'tag',
    },
    {
      q: 'Why is my score low?',
      a: 'Common reasons are missing core keywords from the job posting, vague bullet points, or formatting that hides content. Use the missing keywords list and the AI Rewrite tool to improve quickly.',
      icon: 'warning',
    },
    {
      q: 'How long does it take?',
      a: 'Upload preview is usually under 2 seconds. Full ATS analysis may take 5–15 seconds depending on file size and server load.',
      icon: 'clock',
    },
    {
      q: 'Does this replace a human review?',
      a: 'No. Our tools accelerate editing and improve ATS compatibility, but we still recommend getting feedback from a human mentor or recruiter.',
      icon: 'people',
    },
    {
      q: 'Is there a free version?',
      a: 'Yes. You can upload and preview for free. Some advanced AI features may require a paid plan; see the Pricing page for details.',
      icon: 'credit',
    },
  ]
  return (
    <main>
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: -6 }}>Everything you need to know about using AI Resume Analyzer</p>
          <div className="faq">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
                <button
                  className="faq-q"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  aria-controls={`faq-a-${i}`}
                >
                  <span className={`faq-icon ${f.icon}`} aria-hidden="true">
                    {/* icons drawn with inline SVG */}
                    {f.icon === 'file' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'shield' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'chart' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M7 15v3M12 11v7M17 7v11" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'doc' && (<svg width="16" height="16" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M8 7h8M8 11h8M8 15h6" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'spark' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>)}
                    {f.icon === 'tag' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 10l11 11 7-7-11-11H3v7z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>)}
                    {f.icon === 'warning' && (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2l10 18H2L12 2z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'clock' && (<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2"/></svg>)}
                    {f.icon === 'people' && (<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" fill="none"/></svg>)}
                    {f.icon === 'credit' && (<svg width="16" height="16" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/></svg>)}
                  </span>
                  <span className="faq-q-text">{f.q}</span>
                  <span className="chev" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                  </span>
                </button>
                {open === i && <div id={`faq-a-${i}`} className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}



