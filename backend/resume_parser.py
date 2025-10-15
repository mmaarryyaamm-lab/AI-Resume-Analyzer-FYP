from pdfminer.high_level import extract_text as extract_pdf_text
import docx

def extract_text_from_pdf(file_path):
    return extract_pdf_text(file_path)

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])
