# ats_matcher.py
import os, re
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity

MODELS_DIR = "models"

# lazy global caches
_CLF = None
_VECT = None

token_pat = re.compile(r"[a-zA-Z][a-zA-Z+\-._/#]*")
def simple_tokens(text: str):
    return token_pat.findall((text or "").lower())

def jaccard(a_words, b_words):
    a, b = set(a_words), set(b_words)
    u = len(a | b)
    return 0.0 if u == 0 else len(a & b) / u

def _load_artifacts():
    global _CLF, _VECT
    if _CLF is None:
        clf_path = os.path.join(MODELS_DIR, "ats_decision_tree.pkl")
        vect_path = os.path.join(MODELS_DIR, "tfidf_pair.pkl")
        if os.path.exists(clf_path) and os.path.exists(vect_path):
            _CLF = joblib.load(clf_path)
            _VECT = joblib.load(vect_path)
    return _CLF is not None and _VECT is not None

# (your existing) simple similarity for baseline display
from sklearn.feature_extraction.text import TfidfVectorizer
def calculate_similarity(resume_text: str, jd_text: str) -> float:
    vect = TfidfVectorizer(stop_words="english")
    X = vect.fit_transform([resume_text or "", jd_text or ""])
    return float(cosine_similarity(X[0], X[1])[0,0])

def find_missing_keywords(resume_text: str, jd_text: str):
    r_tokens = set(simple_tokens(resume_text))
    j_tokens = set(simple_tokens(jd_text))
    missing = sorted(list(j_tokens - r_tokens))[:50]
    matched = sorted(list(j_tokens & r_tokens))[:50]
    return {"missing_keywords": missing, "matched_keywords": matched}

def ml_score(resume_text: str, jd_text: str):
    """Return {'ml_score': float[0..1], 'ml_label': 'Good'|'Poor'} using the trained Decision Tree.
       Falls back to similarity-only heuristic if model not found.
    """
    if _load_artifacts():
        R = _VECT.transform([resume_text or ""])
        J = _VECT.transform([jd_text or ""])
        cos_sim = float(cosine_similarity(R, J)[0,0])

        jac = jaccard(simple_tokens(resume_text), simple_tokens(jd_text))
        overlap = len(set(simple_tokens(resume_text)) & set(simple_tokens(jd_text)))
        jd_unique = len(set(simple_tokens(jd_text))) or 1
        overlap_norm = overlap / jd_unique

        X = np.array([[cos_sim, jac, overlap_norm]])
        proba = float(_CLF.predict_proba(X)[0,1])
        label = "Good" if proba >= 0.5 else "Poor"
        return {"ml_score": round(proba, 4), "ml_label": label}
    else:
        # Fallback: thresholded similarity
        sim = calculate_similarity(resume_text, jd_text)
        label = "Good" if sim >= 0.25 else "Poor"
        return {"ml_score": round(sim, 4), "ml_label": label}
