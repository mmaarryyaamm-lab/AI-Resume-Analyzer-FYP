# ml_features.py

import spacy
from resume_ner import extract_entities

nlp = spacy.load("en_core_web_sm")

strong_verbs = {"developed", "led", "created", "designed", "managed", "built", "implemented", "analyzed"}

def extract_features(resume_text, jd_text):
    ner_data = extract_entities(resume_text)

    # Skill matching
    jd_doc = nlp(jd_text.lower())
    jd_keywords = set([token.text for token in jd_doc if token.pos_ in ['NOUN', 'ADJ'] and len(token.text) > 2])

    resume_skills_text = " ".join(ner_data.get("skills", []))
    resume_keywords = set(resume_skills_text.lower().split())

    matched_skills = jd_keywords.intersection(resume_keywords)
    skill_match_ratio = len(matched_skills) / max(len(jd_keywords), 1)

    # Section presence (education, skills, experience)
    section_score = sum(1 for section in ['education', 'experience', 'skills'] if ner_data.get(section))

    # Resume length
    word_count = len(resume_text.split())

    # Action verbs usage
    resume_tokens = set(resume_text.lower().split())
    action_verbs_used = len(resume_tokens.intersection(strong_verbs))

    return [
        skill_match_ratio,
        section_score,
        word_count,
        action_verbs_used
    ]
