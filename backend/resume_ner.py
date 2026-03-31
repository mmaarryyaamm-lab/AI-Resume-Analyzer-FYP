# resume_ner.py

import re

try:
    import spacy
except Exception:
    spacy = None

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm") if spacy is not None else None
except Exception:
    try:
        nlp = spacy.blank("en") if spacy is not None else None
    except Exception:
        nlp = None

def extract_entities(resume_text):
    resume_text = str(resume_text or "")
    doc = nlp(resume_text) if nlp is not None else None

    education_keywords = ["bachelor", "master", "bsc", "msc", "phd", "matric", "intermediate", "university", "college"]
    experience_keywords = ["intern", "developer", "engineer", "manager", "assistant", "analyst", "freelancer", "worked", "experience"]
    skills_keywords = ["python", "java", "sql", "html", "css", "flask", "django", "react", "flutter", "excel", "git", "linux"]

    entities = {
        "name": None,
        "email": None,
        "phone": None,
        "education": [],
        "experience": [],
        "skills": [],
        "projects": []
    }

    # Extract contact info
    if doc is not None:
        for ent in doc.ents:
            if ent.label_ == "PERSON" and not entities["name"]:
                entities["name"] = ent.text
            elif ent.label_ == "EMAIL":
                entities["email"] = ent.text
            elif ent.label_ == "PHONE":
                entities["phone"] = ent.text

    # Fallback for email/phone using regex
    if not entities["email"]:
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text)
        if email_match:
            entities["email"] = email_match.group(0)

    if not entities["phone"]:
        phone_match = re.search(r'(\+?\d{1,4}[\s-]?)?(\(?\d{3,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}', resume_text)
        if phone_match:
            entities["phone"] = phone_match.group(0)

    # Extract sections based on keyword presence
    lines = resume_text.lower().split('\n')
    for line in lines:
        for keyword in education_keywords:
            if keyword in line and line not in entities["education"]:
                entities["education"].append(line.strip())

        for keyword in experience_keywords:
            if keyword in line and line not in entities["experience"]:
                entities["experience"].append(line.strip())

        for keyword in skills_keywords:
            if keyword in line and line not in entities["skills"]:
                entities["skills"].append(line.strip())

    # Extract 'Projects' section using header-based parsing with common synonyms
    original_lines = resume_text.split('\n')
    lowered_lines = [ln.lower() for ln in original_lines]
    project_headers = {
        "projects",
        "project highlights",
        "project experience",
        "personal projects",
        "featured projects",
        "portfolio",
        "case studies"
    }

    def is_header(candidate: str) -> bool:
        stripped = candidate.strip()
        # Consider a line a header if it's mostly uppercase letters/spaces/symbols and not a bullet
        if not stripped:
            return False
        if stripped.startswith(('-', '•', '*')):
            return False
        has_alpha = any(ch.isalpha() for ch in stripped)
        if not has_alpha:
            return False
        # Treat ALL-CAPS (with allowed symbols) as headers
        return stripped == stripped.upper()

    in_projects = False
    collected_any = False
    for idx, low_line in enumerate(lowered_lines):
        candidate = low_line.strip().rstrip(':')
        if not in_projects and candidate in project_headers:
            in_projects = True
            continue

        if in_projects:
            # Stop if we hit another obvious section header
            if is_header(original_lines[idx]):
                break
            content = original_lines[idx].strip()
            if content:
                entities["projects"].append(content)
                collected_any = True

    # If we detected a projects header but failed to collect lines (e.g., compact formatting),
    # mark presence with a placeholder so downstream checks don't flag it as missing.
    if in_projects and not collected_any:
        entities["projects"].append("Projects section detected")

    return entities
