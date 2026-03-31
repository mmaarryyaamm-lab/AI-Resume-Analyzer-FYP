"""
pdf_preserver.py
----------------
Best-effort PDF content update. True PDF format preservation is extremely
difficult because PDFs store text as positioned glyphs, not paragraphs.

Strategy:
  1. Parse the original PDF to extract text (for section identification)
  2. Use ReportLab to generate a new PDF that mirrors the original layout
     as closely as possible, with improved content inserted
  3. For truly format-preserving updates on DOCX files, use docx_preserver.py

Note: For PDFs, we recommend users upload DOCX for best results.
This module provides a "best-effort" approach that maintains professional
formatting even if the exact original layout can't be replicated.
"""

import io
import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


def generate_updated_pdf(
    original_text: str,
    section_mappings: List[Dict],
    accepted_sections: Optional[List[str]] = None,
) -> io.BytesIO:
    """
    Generate a professionally formatted PDF with improved content.

    For sections in accepted_sections (or all if None), uses the improved content.
    For other sections, uses the original content.
    Preserves section headings and overall structure.

    Returns: BytesIO buffer containing the PDF
    """
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER

    # Build custom styles that look professional
    styles = getSampleStyleSheet()

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        spaceAfter=6,
        spaceBefore=14,
        textColor=HexColor('#1a1a2e'),
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0,
        borderColor=None,
    )

    body_style = ParagraphStyle(
        'ResumeBody',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=14,
        spaceAfter=3,
        textColor=HexColor('#333333'),
        fontName='Helvetica',
    )

    bullet_style = ParagraphStyle(
        'ResumeBullet',
        parent=body_style,
        leftIndent=18,
        bulletIndent=6,
        spaceAfter=2,
    )

    name_style = ParagraphStyle(
        'ResumeName',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=4,
        textColor=HexColor('#0a3d62'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
    )

    contact_style = ParagraphStyle(
        'ResumeContact',
        parent=body_style,
        fontSize=9.5,
        alignment=TA_CENTER,
        textColor=HexColor('#555555'),
        spaceAfter=8,
    )

    def esc(s: str) -> str:
        """Escape HTML entities for ReportLab Paragraph."""
        s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        s = s.replace('\u2022', '-').replace('\u2013', '-').replace('\u2014', '-')
        s = s.replace('\u2018', "'").replace('\u2019', "'")
        s = s.replace('\u201c', '"').replace('\u201d', '"')
        try:
            s.encode('latin-1')
        except UnicodeEncodeError:
            s = s.encode('ascii', 'ignore').decode('ascii')
        return s

    # Build the story (list of flowables)
    story = []

    for mapping in section_mappings:
        section_id = mapping.get('original_id', '')
        heading = mapping.get('original_heading', '')
        has_changes = mapping.get('has_changes', False)

        # Determine which content to use
        use_improved = (
            has_changes
            and (accepted_sections is None or section_id in accepted_sections)
        )
        content = mapping.get('improved_content', '') if use_improved else mapping.get('original_content', '')

        if not content.strip() and not heading:
            continue

        # Personal info / header section — special formatting
        if section_id == 'personal_info':
            lines = content.strip().split('\n')
            if lines:
                # First line is likely the name
                story.append(Paragraph(esc(lines[0]), name_style))
                # Remaining lines are contact details
                if len(lines) > 1:
                    contact_text = ' | '.join(l.strip() for l in lines[1:] if l.strip())
                    story.append(Paragraph(esc(contact_text), contact_style))
                story.append(HRFlowable(
                    width='100%', thickness=1,
                    color=HexColor('#cccccc'),
                    spaceAfter=8, spaceBefore=4,
                ))
            continue

        # Section heading
        if heading:
            story.append(Paragraph(esc(heading.upper()), heading_style))

        # Section content
        if content.strip():
            for line in content.split('\n'):
                stripped = line.strip()
                if not stripped:
                    story.append(Spacer(1, 4))
                    continue

                # Detect bullet points
                is_bullet = bool(re.match(r'^[\-•\*\u2022]\s', stripped))
                if is_bullet:
                    bullet_text = re.sub(r'^[\-•\*\u2022]\s*', '', stripped)
                    story.append(Paragraph(
                        f'<bullet>&bull;</bullet> {esc(bullet_text)}',
                        bullet_style
                    ))
                else:
                    story.append(Paragraph(esc(stripped), body_style))

        story.append(Spacer(1, 4))

    # Generate PDF
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )
    doc.build(story)
    buf.seek(0)
    return buf
