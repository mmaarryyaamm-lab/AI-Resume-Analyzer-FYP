"""
openai_rewriter.py
------------------
OpenAI-backed resume section rewriting with a safe local fallback.
"""

import json
import logging
import os
import re
import urllib.request
import urllib.error
from typing import Dict, List

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

logger = logging.getLogger(__name__)

EXTRA_STOPWORDS = {
    'resume', 'role', 'position', 'job', 'work', 'working', 'use', 'used',
    'year', 'years', 'experience', 'experienced', 'skills', 'skill',
}

WEAK_PHRASE_REPLACEMENTS = {
    'responsible for': 'managed',
    'worked on': 'supported',
    'helped with': 'contributed to',
    'seeking a position': 'offering',
    'seeking position': 'offering',
    'seeking an opportunity': 'offering',
    'dedicated to providing': 'focused on delivering',
    'high level of professionalism': 'strong professionalism',
}

ALIGNMENT_SECTION_IDS = {'summary', 'experience', 'projects', 'skills'}
LOW_VALUE_SECTION_IDS = {'education', 'certifications', 'languages', 'references', 'interests'}
TRANSFERABLE_HINTS = {
    'report': ['reporting', 'documentation'],
    'reporting': ['reporting', 'documentation'],
    'dashboard': ['reporting', 'business communication'],
    'dashboards': ['reporting', 'business communication'],
    'insight': ['analysis support', 'reporting'],
    'insights': ['analysis support', 'reporting'],
    'excel': ['spreadsheets', 'documentation'],
    'query': ['research', 'documentation'],
    'queries': ['research', 'documentation'],
    'analysis': ['analysis support', 'reporting'],
    'analyst': ['analysis support', 'reporting'],
    'business': ['business communication', 'stakeholder support'],
    'communication': ['business communication', 'stakeholder support'],
    'stakeholder': ['stakeholder support', 'coordination'],
}


def _extract_keywords(text: str, limit: int = 6) -> List[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z+\-._/#]*", (text or '').lower())
    found = []
    for token in tokens:
        if len(token) <= 2 or token in ENGLISH_STOP_WORDS or token in EXTRA_STOPWORDS:
            continue
        if token not in found:
            found.append(token)
        if len(found) >= limit:
            break
    return found


def _normalize_sentence(text: str) -> str:
    cleaned = re.sub(r'\s+', ' ', (text or '').replace('&nbsp;', ' ')).strip()
    if not cleaned:
        return ''

    for source, target in WEAK_PHRASE_REPLACEMENTS.items():
        cleaned = re.sub(source, target, cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r'\boffering\s+to\s+apply\b', 'offering', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\boffering\s+apply\b', 'offering', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\ba\s+strong professionalism\b', 'strong professionalism', cleaned, flags=re.IGNORECASE)

    cleaned = cleaned[0].upper() + cleaned[1:] if cleaned else cleaned
    if cleaned and not cleaned.endswith(('.', ';', ':')):
        cleaned += '.'
    return cleaned


def _canonical_compare(text: str) -> str:
    cleaned = (text or '').replace('&nbsp;', ' ')
    cleaned = re.sub(r'[^a-z0-9]+', ' ', cleaned.lower())
    return re.sub(r'\s+', ' ', cleaned).strip()


def _is_meaningful_change(original: str, rewritten: str) -> bool:
    return bool(rewritten and _canonical_compare(original) != _canonical_compare(rewritten))


def _rewrite_paragraph(text: str, job_description: str = '', heading: str = '') -> str:
    cleaned = re.sub(r'\s+', ' ', (text or '').replace('&nbsp;', ' ')).strip()
    if not cleaned:
        return ''

    sentences = [segment.strip() for segment in re.split(r'(?<=[.!?])\s+', cleaned) if segment.strip()]
    rewritten = []
    for sentence in sentences:
        normalized = _normalize_sentence(sentence)
        if normalized:
            rewritten.append(normalized)

    jd_keywords = _extract_keywords(job_description, limit=6)
    resume_keywords = set(_extract_keywords(cleaned, limit=12))
    shared_keywords = [keyword for keyword in jd_keywords if keyword in resume_keywords][:3]

    heading_norm = (heading or '').lower()
    if shared_keywords and ('summary' in heading_norm or 'profile' in heading_norm or 'objective' in heading_norm):
        keyword_line = f"Relevant strengths include {', '.join(shared_keywords)}."
        if keyword_line not in rewritten:
            rewritten.append(keyword_line)
    elif shared_keywords and ('experience' in heading_norm or 'project' in heading_norm):
        keyword_line = f"Relevant work highlights include {', '.join(shared_keywords)}."
        if keyword_line not in rewritten:
            rewritten.append(keyword_line)

    return ' '.join(rewritten).strip() or _normalize_sentence(cleaned)


def _build_transferable_line(content: str, job_description: str, heading: str = '') -> str:
    jd_keywords = _extract_keywords(job_description, limit=10)
    content_lower = (content or '').lower()
    supported = []

    for keyword in jd_keywords:
        if keyword in content_lower:
            supported.append(keyword)
            continue
        for hint in TRANSFERABLE_HINTS.get(keyword, []):
            if hint in content_lower:
                supported.append(keyword)
                break

    supported = list(dict.fromkeys(supported))[:3]
    if not supported:
        return ''

    heading_norm = (heading or '').lower()
    if 'summary' in heading_norm or 'profile' in heading_norm or 'objective' in heading_norm:
        return f"Transferable strengths relevant to this role include {', '.join(supported)}."
    if 'experience' in heading_norm or 'project' in heading_norm:
        return f"This experience also supports work involving {', '.join(supported)}."
    if 'skills' in heading_norm:
        return f"Relevant strengths for the target role include {', '.join(supported)}."
    return ''


def _fallback_rewrite_text(text: str) -> str:
    text = (text or '').strip()
    if not text:
        return text

    rewritten = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower() == '&nbsp;':
            continue
        if line.startswith(('-', '*')):
            cleaned = line.lstrip('-* ').strip()
            if cleaned:
                cleaned = _normalize_sentence(cleaned)
                rewritten.append(f'- {cleaned}')
        else:
            rewritten.append(_normalize_sentence(line))
    return '\n'.join(rewritten)


def _fallback_rewrite_sections(sections: List[Dict], job_description: str = '') -> Dict[str, str]:
    result = {}
    for section in sections:
        sec_id = section.get('id')
        if not sec_id or sec_id == 'personal_info':
            continue
        content = section.get('content', '')
        heading = section.get('heading', sec_id)
        heading_norm = (heading or '').strip().lower()

        if sec_id in LOW_VALUE_SECTION_IDS or 'education' in heading_norm or 'certification' in heading_norm:
            continue

        if content.strip().startswith(('-', '*')):
            rewritten = _fallback_rewrite_text(content)
        else:
            rewritten = _rewrite_paragraph(content, job_description, heading)

        transferable_line = _build_transferable_line(content, job_description, heading)
        if transferable_line and transferable_line not in rewritten:
            rewritten = f"{rewritten} {transferable_line}".strip()

        original_comp = _canonical_compare(content)
        rewritten_comp = _canonical_compare(rewritten)
        has_meaningful_change = rewritten_comp and rewritten_comp != original_comp

        if sec_id not in ALIGNMENT_SECTION_IDS and not has_meaningful_change:
            continue

        if rewritten and has_meaningful_change:
            result[sec_id] = rewritten
    return result


def _get_api_key() -> str:
    key = os.environ.get('OPENAI_API_KEY', '')
    if not key:
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as handle:
                for line in handle:
                    line = line.strip()
                    if line.startswith('OPENAI_API_KEY='):
                        key = line.split('=', 1)[1].strip()
                        break
    return key


def _build_system_prompt() -> str:
    return """You are an expert resume consultant and ATS optimization specialist.

Your task is to improve resume content section by section.
Improve wording, grammar, professional tone, and ATS keyword alignment.
Focus especially on summary, experience, projects, and skills.
Rewrite every meaningful section that can be improved, not just one section.
For career-transition resumes, emphasize truthful transferable strengths that connect to the target role.
Reframe existing experience toward analysis, reporting, business support, communication, coordination, dashboards, Excel, documentation, research, operations, or stakeholder support when the original content supports that framing.
Prefer stronger action verbs, clearer achievements, tighter ATS alignment, and sharper professional wording.
Make substantive, job-relevant improvements instead of tiny punctuation-only edits.
Do not invent new experience, skills, education, dates, or companies.
Do not add tools like SQL, Python, Tableau, Power BI, or Excel unless the resume already supports them.
Education sections usually need no rewrite unless the wording is clearly poor.
Preserve structure and meaning.
Return assertive, useful, job-specific edits that should look noticeably different for different job descriptions."""


def _build_user_prompt(sections: List[Dict], job_description: str = '') -> str:
    prompt_parts = []
    jd_keywords = _extract_keywords(job_description, limit=12)

    if job_description:
        prompt_parts.append(f"TARGET JOB DESCRIPTION:\n{job_description[:2000]}\n")
        prompt_parts.append(
            'Optimize the resume sections below for this specific job. Naturally incorporate relevant keywords from the job description only when they are supported by the original resume. If the candidate is transitioning careers, highlight transferable experience instead of inventing missing skills.\n'
        )
        if jd_keywords:
            prompt_parts.append(f"PRIORITY TARGET TERMS:\n{', '.join(jd_keywords)}\n")

    prompt_parts.append(
        """SECTION GUIDANCE:
- Summary: tailor this clearly to the target role and emphasize transferable strengths.
- Experience: strengthen verbs and connect responsibilities to target-role outcomes where truthful.
- Projects: highlight analysis, reporting, research, documentation, communication, or operations support when present.
- Skills: sharpen wording and organize relevant truthful skills.
- Education: usually leave unchanged unless the wording is poor.
"""
    )

    prompt_parts.append('RESUME SECTIONS TO IMPROVE:\n')

    for sec in sections:
        if sec.get('id') == 'personal_info':
            continue
        content = sec.get('content', '').strip()
        if not content:
            continue
        heading = sec.get('heading', sec.get('id', 'Section'))
        prompt_parts.append(f"=== SECTION: {heading} (id: {sec['id']}) ===")
        prompt_parts.append(content)
        prompt_parts.append('')

    prompt_parts.append(
        """
Return your response as a JSON object where each key is the section id and the value is the improved content string.
Only include sections that you improved. Do not include personal_info.
Do not return sections with only punctuation, spacing, or capitalization changes.
Prefer improving summary, experience, projects, and skills when possible.
If the job description changes, the output should also change noticeably to reflect that role.
Return ONLY valid JSON."""
    )

    return '\n'.join(prompt_parts)


def _call_openai_via_http(api_key: str, model: str, system_prompt: str, user_prompt: str) -> str:
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        'temperature': 0.3,
        'max_tokens': 4000,
        'response_format': {'type': 'json_object'},
    }

    request = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        body = json.loads(response.read().decode('utf-8'))
        return body['choices'][0]['message']['content'].strip()


def rewrite_sections_with_openai(
    sections: List[Dict],
    job_description: str = '',
    model: str = 'gpt-4o-mini',
) -> Dict[str, str]:
    api_key = _get_api_key()
    if not api_key:
        logger.warning('OpenAI API key not configured. Using local fallback rewrite.')
        return _fallback_rewrite_sections(sections, job_description)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        system_prompt = _build_system_prompt()
        user_prompt = _build_user_prompt(sections, job_description)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={'type': 'json_object'},
        )
        raw_content = response.choices[0].message.content.strip()
    except ImportError:
        logger.warning('openai package not installed. Falling back to direct OpenAI HTTP call.')
        system_prompt = _build_system_prompt()
        user_prompt = _build_user_prompt(sections, job_description)
        try:
            raw_content = _call_openai_via_http(api_key, model, system_prompt, user_prompt)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, json.JSONDecodeError) as err:
            logger.exception('Direct OpenAI HTTP call failed, using local fallback: %s', err)
            return _fallback_rewrite_sections(sections, job_description)
    except Exception as err:
        logger.exception('OpenAI call failed, using local fallback: %s', err)
        return _fallback_rewrite_sections(sections, job_description)

    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        logger.error('Failed to parse OpenAI response as JSON, using local fallback')
        return _fallback_rewrite_sections(sections, job_description)

    if not isinstance(result, dict):
        return _fallback_rewrite_sections(sections, job_description)

    original_ids = {s['id'] for s in sections}
    filtered = {}
    for key, value in result.items():
        original_section = next((section for section in sections if section.get('id') == key), None)
        original_content = original_section.get('content', '') if original_section else ''
        if (
            key in original_ids
            and isinstance(value, str)
            and value.strip()
            and _is_meaningful_change(original_content, value)
        ):
            filtered[key] = value.strip()

    return filtered or _fallback_rewrite_sections(sections, job_description)


def _build_apply_suggestions_system_prompt() -> str:
    return """You are an expert resume editor and ATS optimization specialist.

Your job is to REWRITE the resume section content based on the provided suggestions. You must make real, substantive changes — not just formatting or punctuation tweaks.

REWRITING RULES:
- Actually rewrite bullet points to be stronger, more impactful, and more specific. Replace weak phrases with strong action verbs and quantified achievements.
- If a suggestion says a phrase is weak (e.g., "hardworking", "team player", "good communication"), rewrite the sentence that contains it to be concrete and results-oriented.
- If a suggestion says to include certain keywords, naturally weave them into existing bullet points where the candidate's experience supports it. Do NOT fabricate experience.
- If a suggestion says to use strong action verbs, rewrite bullet points to start with verbs like "Developed", "Led", "Implemented", "Designed", "Managed", "Analyzed", "Optimized", "Delivered".
- If passive voice is flagged, rewrite those sentences in active voice.
- Make each bullet point specific, measurable, and achievement-oriented where possible.

CRITICAL FORMATTING PRESERVATION RULES:
- Preserve the EXACT formatting template of the original: bullet style (dashes, dots, asterisks, bullet characters), indentation levels, line break patterns, heading casing, and paragraph structure.
- If the original uses "- " for bullets, the output MUST use "- " for bullets. If "* ", use "* ". If "• ", use "• ".
- Do NOT add, remove, or change any section headings.
- Do NOT reorder content or merge sections.
- Do NOT invent new experience, skills, tools, technologies, dates, company names, or job titles that are not already present or directly supported by the resume.
- Preserve all whitespace patterns: blank lines between sections stay, no-blank-lines between bullets stay.
- The number of bullet points should stay the same. Rewrite each one in place.

Your output must be a meaningfully improved version of the original — a human comparing them should see noticeably better wording, stronger verbs, and clearer achievements, while the layout and structure remain identical."""


def _build_apply_suggestions_user_prompt(
    sections: List[Dict],
    suggestions: str,
    job_description: str = '',
) -> str:
    prompt_parts = []

    prompt_parts.append('AI SUGGESTIONS TO IMPLEMENT:\n')
    prompt_parts.append(suggestions.strip())
    prompt_parts.append('')

    if job_description:
        prompt_parts.append(f'TARGET JOB DESCRIPTION (use this to guide keyword integration and tailoring — but do NOT fabricate skills the candidate does not have):\n{job_description[:1500]}\n')

    prompt_parts.append(
        """REWRITING INSTRUCTIONS:
Based on the suggestions above, rewrite the resume sections below. For each section:
1. Replace any weak/vague phrases with specific, results-oriented language.
2. Start bullet points with strong action verbs (Developed, Led, Implemented, Designed, Managed, Analyzed, etc.).
3. Convert passive voice to active voice.
4. Naturally incorporate relevant keywords from the job description where the candidate's existing experience supports it.
5. Make achievements more specific and measurable where possible (add context about scale, impact, or outcome).
6. Keep the EXACT same formatting: same bullet style, same indentation, same number of bullet points, same line break patterns.

"""
    )

    prompt_parts.append('RESUME SECTIONS TO REWRITE:\n')

    for sec in sections:
        if sec.get('id') == 'personal_info':
            continue
        content = sec.get('content', '').strip()
        if not content:
            continue
        heading = sec.get('heading', sec.get('id', 'Section'))
        prompt_parts.append(f'=== SECTION: {heading} (id: {sec["id"]}) ===')
        prompt_parts.append(content)
        prompt_parts.append('')

    prompt_parts.append(
        """Rewrite the sections above based on the suggestions. Make real, substantive improvements to the wording — not just punctuation or formatting changes.
For each section you rewrite, return the COMPLETE updated section content preserving the exact original formatting template (bullet style, indentation, line breaks).

Return your response as a JSON object where each key is the section id and the value is the rewritten content string.
Only include sections that you meaningfully improved. Do not include unchanged sections.
Do not include personal_info. Education sections usually need no rewrite unless clearly weak.
Return ONLY valid JSON."""
    )

    return '\n'.join(prompt_parts)


def apply_suggestions_with_openai(
    sections: List[Dict],
    suggestions: str,
    job_description: str = '',
    model: str = 'gpt-4o-mini',
) -> Dict[str, str]:
    """Rewrite resume sections based on AI suggestions while preserving formatting template."""
    if not suggestions or not suggestions.strip():
        return {}

    api_key = _get_api_key()
    if not api_key:
        logger.warning('OpenAI API key not configured. Cannot apply suggestions.')
        return {}

    system_prompt = _build_apply_suggestions_system_prompt()
    user_prompt = _build_apply_suggestions_user_prompt(sections, suggestions, job_description)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
            temperature=0.3,  # Balanced — substantive rewrites while staying faithful to original
            max_tokens=4000,
            response_format={'type': 'json_object'},
        )
        raw_content = response.choices[0].message.content.strip()
    except ImportError:
        logger.warning('openai package not installed. Falling back to direct HTTP call.')
        try:
            raw_content = _call_openai_via_http(api_key, model, system_prompt, user_prompt)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, json.JSONDecodeError) as err:
            logger.exception('Direct OpenAI HTTP call failed for apply-suggestions: %s', err)
            return {}
    except Exception as err:
        logger.exception('OpenAI call failed for apply-suggestions: %s', err)
        return {}

    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        logger.error('Failed to parse OpenAI apply-suggestions response as JSON')
        return {}

    if not isinstance(result, dict):
        return {}

    original_ids = {s['id'] for s in sections}
    filtered = {}
    for key, value in result.items():
        original_section = next((s for s in sections if s.get('id') == key), None)
        original_content = original_section.get('content', '') if original_section else ''
        if (
            key in original_ids
            and isinstance(value, str)
            and value.strip()
            and _is_meaningful_change(original_content, value)
        ):
            filtered[key] = value.strip()

    return filtered


def rewrite_single_section(
    section_id: str,
    section_content: str,
    section_heading: str = '',
    job_description: str = '',
    model: str = 'gpt-4o-mini',
) -> str:
    sections = [{
        'id': section_id,
        'heading': section_heading or section_id.replace('_', ' ').title(),
        'content': section_content,
    }]
    result = rewrite_sections_with_openai(sections, job_description, model)
    return result.get(section_id, section_content)
