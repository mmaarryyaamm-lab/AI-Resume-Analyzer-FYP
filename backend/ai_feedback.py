# ai_feedback.py

try:
    import language_tool_python
except Exception:
    language_tool_python = None

try:
    import spacy
except Exception:
    spacy = None
from resume_ner import extract_entities

# Load tools
# Prefer the public API to avoid requiring a local Java install
try:
    tool = language_tool_python.LanguageToolPublicAPI('en-US') if language_tool_python is not None else None
except Exception:
    tool = None

try:
    nlp = spacy.load("en_core_web_sm") if spacy is not None else None
except Exception:
    try:
        nlp = spacy.blank("en") if spacy is not None else None
    except Exception:
        nlp = None

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
    resume_text = str(resume_text or "")
    jd_text = str(jd_text or "")
    suggestions = []

    # ✅ 1. NER Extraction
    ner_data = extract_entities(resume_text)

    # ✅ 2. Missing sections
    expected_sections = ["education", "experience", "skills", "projects"]
    for section in expected_sections:
        if not ner_data.get(section):
            suggestions.append(f"⚠️ Your resume is missing a section for {section.title()}.")

    # ✅ 3. Weak phrases — with specific rewrite instructions
    for phrase, tip in weak_phrases.items():
        if phrase in resume_text.lower():
            suggestions.append(f"REWRITE: Replace the weak phrase '{phrase}' with concrete, results-oriented language. {tip}")

    # ✅ 4. Strong action verbs
    doc = nlp(resume_text.lower()) if nlp is not None else None
    tokens = [token.text for token in doc] if doc is not None else resume_text.lower().split()
    used_verbs = [v for v in strong_action_verbs if v in tokens]
    if not used_verbs:
        suggestions.append("REWRITE: Rewrite bullet points to start with strong action verbs like 'Developed', 'Led', 'Implemented', 'Designed', 'Managed', 'Analyzed', 'Optimized', 'Delivered'. Each bullet should begin with a powerful verb.")

    # ✅ 5. Passive voice (simple)
    passive_aux = ["was", "were", "been", "being", "is", "are", "be"]
    passive_count = sum(1 for token in doc if token.text in passive_aux and token.pos_ == "AUX") if doc is not None else 0
    if passive_count > 5:
        suggestions.append("REWRITE: Convert passive voice sentences to active voice. For example, change 'was responsible for managing' to 'Managed', change 'was involved in developing' to 'Developed'.")

    # ✅ 6. Vague bullet point detection
    vague_indicators = ["various", "multiple", "several", "some", "many", "etc", "things", "stuff", "duties included", "responsibilities include"]
    found_vague = [v for v in vague_indicators if v in resume_text.lower()]
    if found_vague:
        suggestions.append(f"REWRITE: Replace vague words ({', '.join(found_vague)}) with specific details — numbers, tools, outcomes, or measurable impact.")

    # ✅ 7. Quantification check
    import re
    numbers_found = re.findall(r'\d+[%+]?', resume_text)
    if len(numbers_found) < 3:
        suggestions.append("REWRITE: Add quantifiable achievements where possible. For example, instead of 'improved performance', write 'improved performance by 25%'. Add metrics like team size, project scope, revenue impact, or time saved.")

    # ✅ 8. Grammar issues (skip if tool unavailable)
    if tool is not None:
        try:
            matches = tool.check(resume_text[:1000])  # Limit for speed
            if matches:
                issues = [f"Fix: {match.message}" for match in matches[:5]]
                suggestions.append("REWRITE: Fix these grammar issues:\n" + "\n".join(issues))
        except Exception:
            pass

    # ✅ 9. JD vs Resume skill match — with actionable rewrite instructions
    if jd_text:
        jd_doc = nlp(jd_text.lower()) if nlp is not None else None
        jd_keywords = set([token.text for token in jd_doc if token.pos_ in ['NOUN', 'PROPN', 'ADJ'] and len(token.text) > 2]) if jd_doc is not None else set(jd_text.lower().split())
        resume_skills_text = " ".join(ner_data.get("skills", []))
        resume_keywords = set(resume_skills_text.lower().split())

        matched = resume_keywords.intersection(jd_keywords)
        missing = jd_keywords - resume_keywords

        if matched:
            suggestions.append(f"KEEP: These keywords already match the job description: {', '.join(list(matched)[:8])}. Ensure they remain prominent.")
        if missing:
            missing_list = list(missing)[:8]
            suggestions.append(f"REWRITE: Naturally incorporate these job-relevant keywords into existing bullet points where the candidate's experience supports them: {', '.join(missing_list)}. Do NOT fabricate experience — only weave in keywords that align with what is already described.")

    # ✅ 10. Summary/objective check
    summary_indicators = ["summary", "objective", "profile", "about"]
    has_summary = any(ind in resume_text.lower()[:500] for ind in summary_indicators)
    if has_summary:
        suggestions.append("REWRITE: Strengthen the summary/objective section to be tailored and impactful. It should clearly state the candidate's value proposition and align with the target role.")

    # ✅ 11. Final result
    if not suggestions:
        return "Your resume is well-structured and uses strong language. Minor improvements may include adding more quantifiable metrics to bullet points."

    return "\n".join(suggestions)
