# resume_ner.py

import spacy
import re

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

def extract_entities(resume_text):
    doc = nlp(resume_text)

    education_keywords = ["bachelor", "master", "bsc", "msc", "phd", "matric", "intermediate", "university", "college"]
    experience_keywords = ["intern", "developer", "engineer", "manager", "assistant", "analyst", "freelancer", "worked", "experience"]
    skills_keywords = ["python", "java", "sql", "html", "css", "flask", "django", "react", "flutter", "excel", "git", "linux"]

    entities = {
        "name": None,
        "email": None,
        "phone": None,
        "education": [],
        "experience": [],
        "skills": []
    }

    # Extract contact info
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

    return entities
