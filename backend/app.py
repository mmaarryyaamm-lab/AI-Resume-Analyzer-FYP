from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import logging
from werkzeug.utils import secure_filename
import io
import difflib

from resume_parser import extract_text_from_pdf, extract_text_from_docx
from ats_matcher import calculate_similarity, find_missing_keywords, ml_score
from ai_feedback import generate_ai_suggestions
from sentence_rewriter import rewrite_sentences
from resume_ner import extract_entities

app = Flask(__name__)
CORS(app)

# Make uploads directory absolute to avoid cwd issues when running the server
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Basic logging for server-side diagnostics
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🏠 Route: Home
@app.route('/')
def home():
    return "✅ Resume Analyzer API is running!"

# Return JSON for any uncaught exceptions to aid debugging in frontend Network tab
@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception('Unhandled exception: %s', e)
    return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

# 📤 Route 1: Upload Resume and Extract Text
@app.route('/upload', methods=['POST'])
def upload_resume():
    try:
        if 'resume' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 200

        file = request.files['resume']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 200

        safe_name = secure_filename(file.filename)
        if not safe_name:
            return jsonify({'success': False, 'error': 'Invalid file name'}), 200

        filepath = os.path.join(UPLOAD_FOLDER, safe_name)
        try:
            file.save(filepath)
        except Exception as save_err:
            logger.exception('Failed to save upload: %s', save_err)
            return jsonify({'success': False, 'error': 'Failed to save file on server'}), 200

        filename_lower = safe_name.lower()
        text = ''
        warning = None

        try:
            if filename_lower.endswith('.pdf'):
                text = extract_text_from_pdf(filepath)
            elif filename_lower.endswith('.docx'):
                text = extract_text_from_docx(filepath)
            else:
                return jsonify({'success': False, 'error': 'Unsupported file type'}), 200
        except Exception as parse_err:
            logger.exception('Failed to parse uploaded file: %s', parse_err)
            # Avoid 500 on tricky PDFs/Docs; return empty text with a warning instead
            warning = 'File uploaded but text extraction failed. Try another file format.'

        return jsonify({'success': True, 'resume_text': (text or ''), 'warning': warning})
    except Exception as err:
        logger.exception('Unexpected error in /upload: %s', err)
        return jsonify({'success': False, 'error': 'Unexpected server error'}), 200

# 🧠 Route 2: Analyze Resume vs JD (ATS + ML + Keywords)
@app.route('/analyze', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files or 'jd' not in request.form:
        return jsonify({'error': 'Missing resume or job description'}), 400

    file = request.files['resume']
    jd_text = request.form['jd']

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    if file.filename.endswith('.pdf'):
        resume_text = extract_text_from_pdf(filepath)
    elif file.filename.endswith('.docx'):
        resume_text = extract_text_from_docx(filepath)
    else:
        return jsonify({'error': 'Unsupported file type'}), 400

    score = calculate_similarity(resume_text, jd_text)
    keywords = find_missing_keywords(resume_text, jd_text)
    ml_result = ml_score(resume_text, jd_text)

    return jsonify({
        'ats_score': score,
        'missing_keywords': keywords['missing_keywords'],
        'matched_keywords': keywords['matched_keywords'],
        'ml_score': ml_result.get('ml_score'),
        'ml_label': ml_result.get('ml_label')
    })

# 🤖 Route 3: AI Suggestions (NLP + NER + Grammar)
@app.route('/ai-suggest', methods=['POST'])
def ai_suggest():
    if 'resume' not in request.files:
        return jsonify({'error': 'Resume file is required'}), 400

    file = request.files['resume']
    jd_text = request.form.get('jd', '')

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    if file.filename.endswith('.pdf'):
        resume_text = extract_text_from_pdf(filepath)
    elif file.filename.endswith('.docx'):
        resume_text = extract_text_from_docx(filepath)
    else:
        return jsonify({'error': 'Unsupported file type'}), 400

    suggestions = generate_ai_suggestions(resume_text, jd_text)
    return jsonify({'ai_feedback': suggestions})

# 📊 Route 4: NER Extraction Endpoint
@app.route('/extract-ner', methods=['POST'])
def extract_ner():
    file = request.files['resume']
    filename = file.filename.lower()
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    if filename.endswith('.pdf'):
        resume_text = extract_text_from_pdf(filepath)
    elif filename.endswith('.docx'):
        resume_text = extract_text_from_docx(filepath)
    else:
        return jsonify({'error': 'Unsupported file format'}), 400

    ner_data = extract_entities(resume_text)
    return jsonify(ner_data)

# ✍️ Route 5: Dynamic Resume Sentence Rewriting
@app.route('/rewrite', methods=['POST'])
def rewrite_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'Resume file is required'}), 400

    file = request.files['resume']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    if file.filename.endswith('.pdf'):
        resume_text = extract_text_from_pdf(filepath)
    elif file.filename.endswith('.docx'):
        resume_text = extract_text_from_docx(filepath)
    else:
        return jsonify({'error': 'Unsupported file type'}), 400

    rewritten = rewrite_sentences(resume_text)
    return jsonify(rewritten)


# 🖍️ Route 6: Generate HTML diff preview for highlighted changes
@app.route('/preview-diff', methods=['POST'])
def preview_diff():
    data = request.get_json(silent=True) or {}
    original_text = data.get('original_text', '')
    updated_text = data.get('updated_text', '')
    if not isinstance(original_text, str) or not isinstance(updated_text, str):
        return jsonify({'error': 'original_text and updated_text must be strings'}), 400

    # Use difflib to build an inline HTML diff
    differ = difflib.HtmlDiff(wrapcolumn=80)
    html = differ.make_table(
        original_text.splitlines(),
        updated_text.splitlines(),
        fromdesc='Original',
        todesc='Updated',
        context=True,
        numlines=2
    )
    # Wrap in minimal HTML so frontend can directly render
    doc = f"""
<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }}
    table.diff {{ font-size: 14px; border-collapse: collapse; width: 100%; }}
    .diff_header {{ background: #f6f7f9; }}
    .diff_add {{ background: #e6ffed; }}
    .diff_chg {{ background: #fff5b1; }}
    .diff_sub {{ background: #ffeef0; }}
    td, th {{ border: 1px solid #dfe2e5; padding: 4px 6px; vertical-align: top; }}
  </style>
  <title>Resume Changes Preview</title>
</head>
<body>
{html}
</body>
</html>
"""
    return jsonify({'html': doc})


# ⬇️ Route 7: Download updated resume as PDF or DOCX
@app.route('/download-updated', methods=['POST'])
def download_updated():
    fmt = request.args.get('format', 'pdf').lower()

    # Accept either JSON body or multipart (for future extensibility)
    text = ''
    if request.is_json:
        text = (request.get_json(silent=True) or {}).get('updated_text', '')
    else:
        text = request.form.get('updated_text', '')

    if not isinstance(text, str) or not text.strip():
        return jsonify({'error': 'updated_text is required'}), 400

    if fmt == 'docx':
        # Generate DOCX using python-docx (already in requirements)
        try:
            from docx import Document  # type: ignore
        except Exception as e:
            return jsonify({'error': f'DOCX generation unavailable: {e}'}), 500

        doc = Document()
        for para in text.split('\n\n'):
            for line in para.split('\n'):
                doc.add_paragraph(line)
            doc.add_paragraph('')
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return send_file(
            buf,
            as_attachment=True,
            download_name='resume_updated.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    # Default: PDF using reportlab if available; fallback to plain text PDF-like
    try:
        from reportlab.lib.pagesizes import LETTER  # type: ignore
        from reportlab.pdfgen import canvas  # type: ignore
        from reportlab.lib.units import inch  # type: ignore
    except Exception as e:
        return jsonify({'error': f'PDF generation unavailable: {e}'}), 500

    # Prefer Platypus for safer wrapping; fallback to low-level canvas
    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer  # type: ignore
        from reportlab.lib.styles import getSampleStyleSheet  # type: ignore
        styles = getSampleStyleSheet()
        normal = styles['Normal']

        # sanitize: replace problematic unicode, and escape HTML-ish chars
        def esc(s: str) -> str:
            s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            s = s.replace('\u2022', '-').replace('•', '-')
            s = s.replace('\u2013', '-').replace('\u2014', '-').replace('–', '-').replace('—', '-')
            try:
                s.encode('latin-1')
            except Exception:
                s = s.encode('ascii', 'ignore').decode('ascii')
            return s

        story = []
        for para in text.split('\n\n'):
            p = Paragraph(esc(para).replace('\n', '<br/>'), normal)
            story.append(p)
            story.append(Spacer(1, 6))
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=LETTER)
        doc.build(story)
        buf.seek(0)
        return send_file(buf, as_attachment=True, download_name='resume_updated.pdf', mimetype='application/pdf')
    except Exception:
        # Fallback to manual canvas rendering
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=LETTER)
        width, height = LETTER
        left_margin = 1 * inch
        top_margin = height - 1 * inch
        line_height = 12

        def _sanitize_for_pdf(s: str) -> str:
            try:
                s = s.replace('\u2022', '-').replace('\u2013', '-').replace('\u2014', '-')
                s = s.replace('•', '-').replace('–', '-').replace('—', '-')
                return s.encode('ascii', 'ignore').decode('ascii')
            except Exception:
                return s

        y = top_margin
        for raw_line in text.split('\n'):
            line = raw_line.replace('\t', '    ')
            line = _sanitize_for_pdf(line)
            words = line.split(' ')
            current = ''
            for w in words:
                test = (current + ' ' + w).strip()
                if c.stringWidth(test, 'Helvetica', 10) > (width - 2 * left_margin):
                    c.setFont('Helvetica', 10)
                    c.drawString(left_margin, y, current)
                    y -= line_height
                    current = w
                    if y < 1 * inch:
                        c.showPage()
                        y = top_margin
                else:
                    current = test
            if current:
                c.setFont('Helvetica', 10)
                c.drawString(left_margin, y, current)
                y -= line_height
                if y < 1 * inch:
                    c.showPage()
                    y = top_margin
        c.save()
        buf.seek(0)
        return send_file(buf, as_attachment=True, download_name='resume_updated.pdf', mimetype='application/pdf')


# 🔚 App runner — always keep this LAST
if __name__ == '__main__':
    app.run(debug=True)
