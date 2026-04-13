# AI Resume Analyzer — Knowledge Base Document
### For ElevenLabs Voice Agent Reference

---

## 1. PRODUCT OVERVIEW

**Product Name:** AI Resume Analyzer  
**Type:** Web application (React + Flask)  
**Purpose:** Help job seekers analyze, score, and AI-improve their resumes to pass ATS screening and land more interviews  
**Target Users:** Students, fresh graduates, and professionals applying for jobs  
**Frontend URL:** http://localhost:5173 (development)  
**Backend URL:** http://localhost:5001 (development)

### Core Value Proposition
Most resumes are rejected before a human ever reads them — filtered out by Applicant Tracking Systems (ATS) that scan for keywords. The AI Resume Analyzer helps users understand exactly why their resume might be getting filtered, what keywords are missing, and then automatically rewrites the resume to be stronger — while keeping the original formatting intact.

---

## 2. TECH STACK (REFERENCE)

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Framer Motion, Three.js |
| Backend | Python 3.12, Flask 3.x |
| AI / NLP | GPT-4o-mini (OpenAI), BART (facebook/bart-large-cnn), spaCy (en_core_web_sm) |
| ML Scoring | scikit-learn Decision Tree, TF-IDF, cosine similarity, Jaccard similarity |
| Document Processing | python-docx (DOCX), pdfminer.six (PDF), ReportLab (PDF generation) |
| Database | SQLite (auth, analysis history) |
| Auth | JWT-style tokens, 60-day expiry |

---

## 3. APPLICATION PAGES

### 3.1 Home Page — Main Workspace
**Route:** `/`  
**Purpose:** The primary workspace where the entire core workflow happens  
**What users do here:**
- Upload resume (PDF or DOCX)
- Paste job description
- Run analysis
- View scores and AI suggestions
- Apply Smart Rewrite or targeted suggestions
- View before/after diffs
- Download improved resume

**Layout:**
- Step Indicator at the top showing: Upload → Analyze → Improve → Export
- Step 1 (Upload) — always visible
- Step 2 (Analyze) — appears after successful upload
- Step 3 (Improve & Export) — appears after analysis completes
- Progressive disclosure: each step only becomes visible when the previous step is completed

---

### 3.2 Builder Page
**Route:** `/builder`  
**Purpose:** Manual section-by-section resume editor  
**What users do here:**
- View each detected resume section individually
- Edit content of any section manually
- Compare original vs. edited content side by side

**Requirements:**
- Resume must have been uploaded from the Home page first
- If no resume is loaded, the page shows an empty state with a "Go to Home" prompt

**Sections shown:** Summary, Experience, Education, Skills, Projects (and any other detected sections)

---

### 3.3 Preview Page
**Route:** `/preview`  
**Purpose:** Visual diff view of original vs. improved resume  
**What users do here:**
- See improvement metrics (score changes)
- View side-by-side or toggled comparison of original vs. improved content per section
- Download final resume as PDF or DOCX

**Requirements:**
- Resume must have been uploaded and improved from the Home page first

---

### 3.4 FAQ Page
**Route:** `/faq`  
**Purpose:** Answers to common questions about the system  
**Format:** Accordion-style Q&A with animated expand/collapse

---

### 3.5 Templates Page
**Route:** `/templates`  
**Purpose:** Preview available resume template styles  
**Format:** Cards showing template previews with feature indicators

---

### 3.6 Pricing Page
**Route:** `/pricing`  
**Plans available:**
- **Free** — Core analysis and download
- **Pro** — Unlimited rewrites, history, priority AI
- **Enterprise** — Team features, bulk processing, custom integrations

---

### 3.7 Privacy Page
**Route:** `/privacy`  
**Covers:** Data collection, processing, storage, cookies, third-party services, user rights

---

### 3.8 Tools Page
**Route:** `/tools`  
**Purpose:** Admin/developer panel  
**Features:**
- System metrics display
- ML model retraining trigger
- Model performance stats

---

## 4. DETAILED USER WORKFLOW

### Step 1: Upload Resume

**User action:** Drag and drop or click to select a file  
**Supported formats:** `.pdf`, `.docx`  
**What happens internally:**
1. File is sent to `POST /upload` endpoint
2. Text is extracted (pdfminer for PDF, python-docx for DOCX)
3. DOCX files: paragraph metadata is recorded (para index start/end per section) for later format-preserving rewrite
4. The file is stored in a server-side upload folder with a unique session identifier
5. `POST /smart-parse` is called automatically to detect and extract sections
6. Detected sections returned to frontend: Summary, Experience, Education, Skills, Projects, etc.

**Frontend feedback:**
- Green success state with section count: "Resume uploaded — 5 sections detected"
- Step 2 animates into view and page auto-scrolls to it

**Errors handled:**
- Unsupported file type → error message shown
- Empty file → error message shown
- Extraction failure → error message shown

---

### Step 2: Analyze Resume

**User action:** (Optionally paste job description) → Click "Analyze & Get Suggestions"  
**What this button does:** Calls `/analyze` and `/ai-suggest` in parallel  
**Endpoint 1:** `POST /analyze`  
**Endpoint 2:** `POST /ai-suggest`

**What analysis returns:**
```
{
  ats_score: 72,                    // 0-100 integer
  ml_label: "Good",                 // Good / Moderate / Poor
  ml_score: 0.81,                   // 0.0-1.0 float
  verdict: "Good",                  // Excellent / Good / Moderate / Needs Work
  matched_keywords: ["Python", "React", "API"],
  missing_keywords: ["Docker", "CI/CD", "AWS"],
  feedback: ["Use more action verbs", "Add metrics"]
}
```

**What AI suggestions returns:**
```
{
  suggestions: [
    "REWRITE: Replace 'responsible for managing' with 'Led' or 'Managed'",
    "REWRITE: Add quantifiable result to 'improved performance' — e.g., 'by 35%'",
    "KEYWORD: Add missing keyword 'Docker' to Skills section",
    "REWRITE: Remove vague word 'various' — specify exactly what technologies"
  ]
}
```

**Frontend feedback:**
- Metrics grid: ATS score, ML score, verdict
- Matched keywords (green chips), missing keywords (red chips)
- AI suggestions list in a violet panel
- Step 3 animates into view and page auto-scrolls to it

---

### Step 3: Improve & Export

**Two options presented as cards:**

#### Option A — Smart Rewrite
**User action:** Click "Smart Rewrite"  
**Endpoint:** `POST /smart-rewrite`  
**Payload:** All resume sections with their content  
**AI model:** GPT-4o-mini  
**What it does:**
- Rewrites every section simultaneously
- Strong action verbs at start of bullets (Developed, Led, Implemented, Architected, Optimized, Delivered, Spearheaded, etc.)
- ATS keywords from job description embedded naturally
- Passive voice → active voice
- Vague language replaced with specific, results-oriented phrases
- Quantifiable achievements added where possible
- Same line count and bullet structure preserved

#### Option B — Apply Suggestions
**User action:** Click "Apply Suggestions"  
**Endpoint:** `POST /apply-suggestions`  
**Payload:** Resume sections + the AI suggestion list from Step 2  
**AI model:** GPT-4o-mini  
**What it does:**
- Implements only the specific suggestions from the list
- More targeted / surgical than Smart Rewrite
- Same formatting preservation

#### After Improvement — Diff View
- Each section shows: original text (left/faded) vs. improved text (right/highlighted)
- Toggle switch per section to accept or reject individual changes
- "Download PDF" and "Download DOCX" buttons

**Download endpoints:**
- `POST /download-updated?format=pdf`
- `POST /download-updated?format=docx`

---

## 5. SCORING SYSTEM — DEEP DIVE

### 5.1 ATS Score

**What it measures:** Keyword alignment between resume and job description  
**Algorithm:** TF-IDF vectorization + cosine similarity  
**Scale:** 0–100%  
**Interpretation:**
| Score | Meaning |
|---|---|
| 85–100% | Excellent — high chance of passing ATS |
| 70–84% | Good — likely to pass most ATS filters |
| 50–69% | Moderate — may be filtered by strict ATS |
| Below 50% | Poor — significant keyword gaps |

**Without job description:** Score is calculated against a general baseline of common professional terms

---

### 5.2 ML Score

**What it measures:** Overall resume quality based on learned patterns  
**Algorithm:** Blended formula  

```
Final Score = (0.45 × Decision Tree probability)
            + (0.35 × cosine similarity score)
            + (0.15 × Jaccard similarity)
            + (0.05 × raw overlap ratio)
```

**Labels:**
- **Good:** Score ≥ 0.65
- **Moderate:** Score 0.40–0.64
- **Poor:** Score < 0.40

**Model:** scikit-learn Decision Tree classifier, trained on resume quality patterns  
**Features used:** TF-IDF vectors of resume text

---

### 5.3 Overall Verdict

Computed from combining ATS score and ML label:

| ATS Score | ML Label | Verdict |
|---|---|---|
| ≥ 80% | Good | Excellent |
| ≥ 65% | Good or Moderate | Good |
| ≥ 50% | Any | Moderate |
| < 50% | Any | Needs Work |

---

## 6. ENTITY EXTRACTION (What the System Detects)

Using spaCy (en_core_web_sm) + custom regex patterns, the system extracts:

| Entity | Method |
|---|---|
| Full Name | spaCy PERSON entity on first 3 lines |
| Email | Regex pattern |
| Phone | Regex pattern |
| Location | spaCy GPE/LOC entity |
| Education | Section keyword detection + spaCy ORG |
| Work Experience | Section keyword detection |
| Skills | Section keyword detection + skill list matching |
| Projects | Section keyword detection |

**Section detection:** Looks for heading-level paragraphs containing keywords like "Experience", "Education", "Skills", "Summary", "Objective", "Projects", "Certifications"

---

## 7. FORMAT PRESERVATION — HOW IT WORKS

This is one of the most important features for users who have professionally designed resumes.

### For DOCX Files:
1. When the resume is uploaded, python-docx reads every paragraph
2. Each paragraph is tagged with its index in the document
3. For each detected section, the system records `content_para_start` and `content_para_end` — the paragraph indices where that section's content begins and ends
4. When the AI rewrites content, the new text is written back into those exact paragraph objects
5. The paragraph's `run` formatting (font name, font size, bold, italic, color, alignment) is preserved
6. Only the text content changes — not the visual appearance

### For PDF Files:
- PDF format cannot be edited in-place (it's a fixed-layout format)
- The extracted text is improved and then re-rendered into a new PDF using ReportLab
- The visual layout of the new PDF is a clean, professional template (not identical to the original)
- For true layout preservation, users should upload DOCX

---

## 8. BACKEND API ENDPOINTS

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/upload` | Upload resume file, extract text |
| POST | `/smart-parse` | Detect and extract resume sections |
| POST | `/analyze` | Run ATS + ML scoring |
| POST | `/ai-suggest` | Generate AI improvement suggestions |
| POST | `/smart-rewrite` | GPT-4o-mini full resume rewrite |
| POST | `/apply-suggestions` | GPT-4o-mini targeted suggestion implementation |
| POST | `/preview-diff` | Generate HTML diff of original vs improved |
| POST | `/download-updated` | Generate and download PDF or DOCX |
| POST | `/auth/signup` | Create new user account |
| POST | `/auth/login` | Login and receive auth token |
| GET | `/history` | Get user's analysis history (auth required) |
| POST | `/retrain` | Retrain ML model (admin) |

---

## 9. AUTHENTICATION SYSTEM

**Type:** Token-based (JWT-style)  
**Storage:** SQLite database  
**Token expiry:** 60 days  

**Signup flow:**
1. User provides name, email, password
2. Password is hashed before storage
3. Auth token generated and returned
4. Token stored in browser localStorage

**What login unlocks:**
- Analysis history — all previous resume scans
- Saved rewrites — previously generated improved versions

**Without account:**
- Full analysis and improvement workflow works
- History not saved between sessions

---

## 10. COMMON TROUBLESHOOTING SCENARIOS

### "Nothing happens when I click Analyze"
- Confirm a resume was uploaded successfully (green success state visible)
- Confirm the Analyze button appeared (Step 2 section is visible)
- Try refreshing and re-uploading

### "The Builder/Preview page shows nothing"
- These pages require a resume to be uploaded from the Home page first
- Navigate to Home, upload a resume and complete the analysis, then return

### "My resume formatting changed after download"
- For DOCX: formatting is preserved — fonts, bullets, spacing should be identical
- For PDF: layout is re-rendered in a clean professional template; upload DOCX for full preservation

### "The AI suggestions seem generic"
- Paste the specific job description in Step 2 for targeted, job-specific suggestions
- Without a job description, suggestions are based on general best practices

### "Download didn't start"
- Check browser download permissions / pop-up blocker
- Try a different browser (Chrome recommended)

### "Upload failed"
- Check file format: only PDF and DOCX are supported
- Check file size: very large files (> 10MB) may time out
- Make sure the file is not password-protected

### "The app is slow"
- AI rewriting (Smart Rewrite / Apply Suggestions) calls GPT-4o-mini which can take 5–15 seconds
- This is normal — a loading spinner is shown during processing

---

## 11. FREQUENTLY ASKED QUESTIONS

**Q: Is this app free to use?**  
A: The core features (upload, analyze, improve, download) are available on the free plan. Pro and Enterprise plans offer unlimited rewrites and history saving.

**Q: Will my resume data be sold or shared?**  
A: No. Resume data is processed to provide the service and is not sold to third parties. See the Privacy page for full details.

**Q: How accurate is the ATS score?**  
A: The ATS score is a strong indicator of keyword alignment. Real-world ATS systems vary by employer, but a score above 70% with the specific job description pasted gives a reliable signal.

**Q: Can I use this for any industry?**  
A: Yes. The system works for any professional resume — tech, finance, healthcare, marketing, engineering, etc. For best results, always paste the job description.

**Q: Does the AI write lies or exaggerated content?**  
A: No. The AI rewrites what you've already written with stronger language and better structure. It does not add false experience, fake companies, or fabricated skills. It only improves how existing content is expressed.

**Q: What happens to my resume after the session?**  
A: Without an account, resume data exists only for the duration of your browser session. With an account, analysis results are saved to your history. Resume files are not permanently stored on the server.

**Q: Can I undo the AI changes?**  
A: Yes — in Step 3's diff view, each section has a toggle switch. If you don't like the AI's version of a section, turn off the toggle for that section and the original will be used in the download.

**Q: How long does analysis take?**  
A: Upload and analysis typically take 2–5 seconds. AI rewriting takes 5–15 seconds depending on resume length.

**Q: What's the maximum resume length?**  
A: The system works best with standard 1–2 page resumes. Longer documents are supported but may take longer to process.

**Q: Can I analyze the same resume multiple times?**  
A: Yes — you can re-upload, try different job descriptions, and compare results.

---

## 12. PRODUCT POSITIONING

The AI Resume Analyzer sits between:
- **DIY resume writing** (user does everything manually) — too time-consuming
- **Professional resume writing services** (expensive, slow, impersonal) — not scalable
- **Generic resume templates** (no personalization, no ATS optimization) — not intelligent

The AI Resume Analyzer provides **instant, personalized, AI-powered resume improvement** at no cost — combining ATS optimization, ML scoring, and GPT-4 rewriting in a single workflow.

---

## 13. GLOSSARY

| Term | Definition |
|---|---|
| ATS | Applicant Tracking System — software used by employers to automatically screen resumes |
| TF-IDF | Term Frequency–Inverse Document Frequency — NLP technique for measuring keyword importance |
| Cosine Similarity | A measure of how similar two text documents are, ranging from 0 (different) to 1 (identical) |
| Jaccard Similarity | The ratio of shared keywords to total unique keywords between two documents |
| NER | Named Entity Recognition — AI technique for detecting names, organizations, locations in text |
| spaCy | Open-source NLP library used for entity extraction |
| BART | Facebook's AI model used for sentence-level rewriting |
| GPT-4o-mini | OpenAI's efficient language model used for full resume rewrites |
| DOCX | Microsoft Word document format — supports full format preservation |
| ReportLab | Python library used to generate PDF files |
| python-docx | Python library used to read and write DOCX files |
| Diff View | Side-by-side comparison showing what text was changed and how |
| Progressive Disclosure | UX pattern where interface elements appear only when needed |

---

*This knowledge base is intended for use with the ElevenLabs voice agent for AI Resume Analyzer. Last updated: April 2026.*
