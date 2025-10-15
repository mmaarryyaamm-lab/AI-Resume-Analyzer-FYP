# ai_feedback.py

import language_tool_python
import spacy
from resume_ner import extract_entities

# Load tools
# Prefer the public API to avoid requiring a local Java install
try:
    tool = language_tool_python.LanguageToolPublicAPI('en-US')
except Exception:
    tool = None
nlp = spacy.load("en_core_web_sm")

# Weak phrases and their rephrasings
weak_phrases = {
    "hardworking": "Explain how you demonstrated this — e.g., 'Met all project deadlines under pressure.'",
    "team player": "Mention a project where you collaborated successfully with others.",
    "good communication": "Be specific — e.g., 'Presented project updates to stakeholders weekly.'",
    "fast learner": "Show what you learned — e.g., 'Learned React.js within 2 weeks and built UI.'"
}

# Strong action verbs
strong_action_verbs = ["developed", "led", "designed", "created", "built", "managed", "implemented", "analyzed"]

def generate_ai_suggestions(resume_text, jd_text=None):
    suggestions = []

    # ✅ 1. NER Extraction
    ner_data = extract_entities(resume_text)

    # ✅ 2. Missing sections
    expected_sections = ["education", "experience", "skills", "projects"]
    for section in expected_sections:
        if not ner_data.get(section):
            suggestions.append(f"⚠️ Your resume is missing a section for {section.title()}.")

    # ✅ 3. Weak phrases
    for phrase, tip in weak_phrases.items():
        if phrase in resume_text.lower():
            suggestions.append(f"💡 Weak phrase detected: '{phrase}' → Suggestion: {tip}")

    # ✅ 4. Strong action verbs
    doc = nlp(resume_text.lower())
    tokens = [token.text for token in doc]
    used_verbs = [v for v in strong_action_verbs if v in tokens]
    if not used_verbs:
        suggestions.append("⚠️ No strong action verbs found. Start bullet points with verbs like 'developed', 'led', 'implemented'.")

    # ✅ 5. Passive voice (simple)
    passive_aux = ["was", "were", "been", "being", "is", "are", "be"]
    passive_count = sum(1 for token in doc if token.text in passive_aux and token.pos_ == "AUX")
    if passive_count > 5:
        suggestions.append("🔄 Your resume may overuse passive voice. Try to use active voice with strong verbs.")

    # ✅ 6. Grammar issues (skip if tool unavailable)
    if tool is not None:
        try:
            matches = tool.check(resume_text[:1000])  # Limit for speed
            if matches:
                issues = [f"✏️ {match.message} (e.g., \"{match.context}\")" for match in matches[:5]]
                suggestions.append("🧹 Grammar suggestions:\n" + "\n".join(issues))
        except Exception:
            pass

    # ✅ 7. JD vs Resume skill match
    if jd_text:
        jd_doc = nlp(jd_text.lower())
        jd_keywords = set([token.text for token in jd_doc if token.pos_ in ['NOUN', 'PROPN', 'ADJ'] and len(token.text) > 2])
        resume_skills_text = " ".join(ner_data.get("skills", []))
        resume_keywords = set(resume_skills_text.lower().split())

        matched = resume_keywords.intersection(jd_keywords)
        missing = jd_keywords - resume_keywords

        if matched:
            suggestions.append(f"✅ Matched job-related keywords: {', '.join(list(matched)[:5])}")
        if missing:
            suggestions.append(f"🧠 Consider including: {', '.join(list(missing)[:5])}")

    # ✅ 8. Final result
    if not suggestions:
        return "✅ Your resume is well-structured and uses strong language."

    return "\n".join(suggestions)
