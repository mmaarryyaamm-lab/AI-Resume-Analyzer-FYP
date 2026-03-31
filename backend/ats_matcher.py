# ats_matcher.py
import os, re
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# lazy global caches
_CLF = None
_VECT = None

token_pat = re.compile(r"[a-zA-Z][a-zA-Z+\-._/#]*")
EXTRA_STOPWORDS = {
    "resume", "cv", "work", "working", "role", "position", "job", "using",
    "use", "used", "year", "years", "experience", "experienced", "skills",
    "skill", "ability", "abilities",
}

def simple_tokens(text: str):
    tokens = token_pat.findall((text or "").lower())
    return [
        token for token in tokens
        if len(token) > 2 and token not in ENGLISH_STOP_WORDS and token not in EXTRA_STOPWORDS
    ]

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


def reset_artifacts():
    global _CLF, _VECT
    _CLF = None
    _VECT = None

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


def score_breakdown(resume_text: str, jd_text: str):
    resume_tokens = simple_tokens(resume_text)
    job_tokens = simple_tokens(jd_text)
    overlap = len(set(resume_tokens) & set(job_tokens))
    job_unique = len(set(job_tokens)) or 1
    cosine_score = calculate_similarity(resume_text, jd_text)
    jaccard_score = jaccard(resume_tokens, job_tokens)
    overlap_norm = overlap / job_unique
    artifacts_loaded = _load_artifacts()

    return {
        "cosine_similarity": round(float(cosine_score), 4),
        "jaccard_similarity": round(float(jaccard_score), 4),
        "overlap_count": int(overlap),
        "overlap_ratio": round(float(overlap_norm), 4),
        "job_unique_terms": int(job_unique),
        "model_ready": bool(artifacts_loaded),
    }


def _blend_match_score(model_probability: float, breakdown: dict) -> float:
    cosine_score = float(breakdown["cosine_similarity"])
    jaccard_score = float(breakdown["jaccard_similarity"])
    overlap_ratio = float(breakdown["overlap_ratio"])
    overlap_count = int(breakdown["overlap_count"])

    blended = (
        (0.45 * float(model_probability))
        + (0.35 * cosine_score)
        + (0.15 * jaccard_score)
        + (0.05 * overlap_ratio)
    )

    # Hard guardrails so obviously weak resume/JD pairs cannot look strong.
    if cosine_score < 0.08 or overlap_ratio < 0.08 or overlap_count < 5:
        blended = min(blended, 0.25)
    elif cosine_score < 0.12 or overlap_ratio < 0.12 or overlap_count < 8:
        blended = min(blended, 0.4)
    elif cosine_score < 0.18 or overlap_ratio < 0.18:
        blended = min(blended, 0.55)

    return max(0.0, min(round(blended, 4), 1.0))

def ml_score(resume_text: str, jd_text: str):
    """Return {'ml_score': float[0..1], 'ml_label': 'Good'|'Poor'} using the trained Decision Tree.
       Falls back to similarity-only heuristic if model not found.
    """
    breakdown = score_breakdown(resume_text, jd_text)
    if breakdown["model_ready"]:
        R = _VECT.transform([resume_text or ""])
        J = _VECT.transform([jd_text or ""])
        cos_sim = float(cosine_similarity(R, J)[0,0])
        jac = breakdown["jaccard_similarity"]
        overlap_norm = breakdown["overlap_ratio"]

        X = np.array([[cos_sim, jac, overlap_norm]])
        proba = float(_CLF.predict_proba(X)[0,1])
        blended_score = _blend_match_score(proba, breakdown)
        label = "Good" if blended_score >= 0.55 else "Poor"
        return {
            "ml_score": blended_score,
            "ml_label": label,
            "details": {
                **breakdown,
                "raw_model_probability": round(proba, 4),
                "blended_match_score": blended_score,
                "prediction_source": "trained_model",
            }
        }
    else:
        # Fallback: thresholded similarity
        sim = float(breakdown["cosine_similarity"])
        fallback_score = max(0.0, min(round((0.75 * sim) + (0.2 * breakdown["jaccard_similarity"]) + (0.05 * breakdown["overlap_ratio"]), 4), 1.0))
        label = "Good" if fallback_score >= 0.35 else "Poor"
        return {
            "ml_score": fallback_score,
            "ml_label": label,
            "details": {
                **breakdown,
                "blended_match_score": fallback_score,
                "prediction_source": "cosine_fallback",
            }
        }
