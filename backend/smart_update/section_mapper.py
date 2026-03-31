"""
section_mapper.py
-----------------
Map between original resume sections and AI-rewritten sections using
heading similarity and canonical IDs.

Handles aliases like:
  "Work Experience" → experience
  "Academic Background" → education
  "Technical Proficiencies" → skills
"""

import re
from typing import Dict, List, Tuple
from difflib import SequenceMatcher

# Canonical aliases for fuzzy matching
CANONICAL_ALIASES: Dict[str, List[str]] = {
    'personal_info': [
        'personal info', 'personal information', 'personal details',
        'contact info', 'contact information', 'contact details', 'contact',
    ],
    'summary': [
        'summary', 'professional summary', 'career summary', 'executive summary',
        'profile', 'career profile', 'professional profile', 'career objective',
        'objective', 'about me', 'about', 'overview',
    ],
    'experience': [
        'experience', 'work experience', 'professional experience',
        'employment history', 'employment', 'career history', 'work history',
        'relevant experience', 'professional background',
    ],
    'education': [
        'education', 'educational background', 'academic background',
        'academic history', 'academic qualifications', 'education and training',
        'qualifications',
    ],
    'skills': [
        'skills', 'key skills', 'core skills', 'technical skills',
        'skills and abilities', 'technical proficiencies', 'proficiency',
        'tools and technologies', 'competencies', 'core competencies',
        'areas of expertise',
    ],
    'projects': [
        'projects', 'personal projects', 'selected projects',
        'notable projects', 'featured projects', 'portfolio',
        'case studies', 'project highlights', 'side projects',
    ],
    'certifications': [
        'certifications', 'certification', 'licenses',
        'licenses and certifications', 'credentials',
        'professional certifications',
    ],
    'achievements': [
        'achievements', 'accomplishments', 'awards',
        'awards and honors', 'honors', 'recognition',
    ],
    'languages': ['languages', 'language skills', 'language proficiency'],
    'interests': ['interests', 'hobbies', 'hobbies and interests'],
    'references': ['references'],
}


def normalize_heading(heading: str) -> str:
    """Normalize a heading for comparison."""
    s = heading.strip().lower()
    s = re.sub(r'[:\-_/\\|]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def heading_to_canonical(heading: str) -> str:
    """Map a heading string to its canonical section ID."""
    norm = normalize_heading(heading)
    if not norm:
        return 'unknown'

    # Direct match
    for canonical, aliases in CANONICAL_ALIASES.items():
        for alias in aliases:
            if norm == alias:
                return canonical

    # Substring match
    for canonical, aliases in CANONICAL_ALIASES.items():
        for alias in aliases:
            if alias in norm or norm in alias:
                return canonical

    # Fuzzy match using SequenceMatcher
    best_score = 0.0
    best_match = 'unknown'
    for canonical, aliases in CANONICAL_ALIASES.items():
        for alias in aliases:
            score = SequenceMatcher(None, norm, alias).ratio()
            if score > best_score and score >= 0.6:
                best_score = score
                best_match = canonical

    return best_match


def map_sections(
    original_sections: List[Dict],
    ai_sections: Dict[str, str],
) -> List[Dict]:
    """
    Map AI-rewritten sections back to original sections.

    Returns list of mapping dicts:
    [
      {
        "original_id": "experience",
        "original_heading": "Work Experience",
        "original_content": "...",
        "improved_content": "...",
        "has_changes": True,
        "change_summary": "Improved action verbs and added metrics"
      }
    ]
    """
    mappings = []

    for orig in original_sections:
        orig_id = orig.get('id', '')
        orig_heading = orig.get('heading', '')
        orig_content = orig.get('content', '')

        # Try direct ID match first
        improved = ai_sections.get(orig_id)

        # If no direct match, try mapping through canonical aliases
        if improved is None and orig_heading:
            canonical = heading_to_canonical(orig_heading)
            improved = ai_sections.get(canonical)

        # Also try the heading itself as a key
        if improved is None:
            norm = normalize_heading(orig_heading)
            for ai_key, ai_value in ai_sections.items():
                ai_norm = normalize_heading(ai_key)
                if ai_norm == norm or heading_to_canonical(ai_key) == orig_id:
                    improved = ai_value
                    break

        has_changes = (
            improved is not None
            and improved.strip() != orig_content.strip()
        )

        mappings.append({
            'original_id': orig_id,
            'original_heading': orig_heading,
            'original_content': orig_content,
            'improved_content': improved or orig_content,
            'has_changes': has_changes,
            'heading_line': orig.get('heading_line'),
            'content_start': orig.get('content_start'),
            'content_end': orig.get('content_end'),
            'para_start': orig.get('para_start'),
            'content_para_start': orig.get('content_para_start'),
            'content_para_end': orig.get('content_para_end'),
        })

    return mappings


def compute_section_diff(original: str, improved: str) -> List[Dict]:
    """
    Compute a simple line-level diff between original and improved content.
    Returns list of {type: 'same'|'removed'|'added', text: str}.
    """
    import difflib
    orig_lines = original.strip().splitlines()
    impr_lines = improved.strip().splitlines()

    diff = []
    matcher = difflib.SequenceMatcher(None, orig_lines, impr_lines)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            for line in orig_lines[i1:i2]:
                diff.append({'type': 'same', 'text': line})
        elif tag == 'delete':
            for line in orig_lines[i1:i2]:
                diff.append({'type': 'removed', 'text': line})
        elif tag == 'insert':
            for line in impr_lines[j1:j2]:
                diff.append({'type': 'added', 'text': line})
        elif tag == 'replace':
            for line in orig_lines[i1:i2]:
                diff.append({'type': 'removed', 'text': line})
            for line in impr_lines[j1:j2]:
                diff.append({'type': 'added', 'text': line})

    return diff
