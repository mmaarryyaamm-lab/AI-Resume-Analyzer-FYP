# ml_train.py
import os, re, json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report
import joblib

DATA_PATH = os.path.join("data", "resume_job_matching_dataset.csv")  # change if needed
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# --- helpers ---
def clean_text(t: str) -> str:
    t = t or ""
    t = re.sub(r"\s+", " ", str(t)).strip()
    return t

def pick_first_existing(df: pd.DataFrame, names):
    for n in names:
        if n in df.columns:
            return n
    raise ValueError(f"Could not find any of columns: {names} in {list(df.columns)}")

def jaccard(a_words, b_words):
    a, b = set(a_words), set(b_words)
    u = len(a | b)
    return 0.0 if u == 0 else len(a & b) / u

token_pat = re.compile(r"[a-zA-Z][a-zA-Z+\-._/#]*")

def simple_tokens(text: str):
    return token_pat.findall(text.lower())

print(f"Loading dataset: {DATA_PATH}")
# support CSV or JSON
if DATA_PATH.endswith(".json") or DATA_PATH.endswith(".jsonl"):
    rows = [json.loads(x) for x in open(DATA_PATH, "r", encoding="utf-8")]
    df = pd.DataFrame(rows)
else:
    df = pd.read_csv(DATA_PATH, encoding="utf-8", engine="python")

# Try to map common column names automatically
resume_col = pick_first_existing(df, ["resume_text", "resume", "Resume", "cv", "CV"])
jd_col     = pick_first_existing(df, ["job_description", "jd", "Job Description", "description"])
# Label can be a binary label or a 1-5 score; we’ll convert to binary if needed
label_col  = None
for cand in ["label", "match", "target", "y", "match_label", "is_match", "match_score", "score", "rating"]:
    if cand in df.columns:
        label_col = cand
        break
if label_col is None:
    raise ValueError("No label/score column found. Add a 'label' or 'match_score' column.")

df[resume_col] = df[resume_col].astype(str).map(clean_text)
df[jd_col]     = df[jd_col].astype(str).map(clean_text)

y_raw = df[label_col]

# Convert to binary: score>=4 => 1 (Good), else 0 (Poor)
if y_raw.dtype.kind in "if":  # numeric score
    y = (y_raw >= 4).astype(int)
else:
    # text labels; map common values
    y = y_raw.astype(str).str.lower().map(
        {"good":1, "match":1, "positive":1, "yes":1, "1":1, "true":1}
    ).fillna(0).astype(int)

# Fit a shared TF-IDF over resumes + JDs
corpus = pd.concat([df[resume_col], df[jd_col]], axis=0).tolist()
vectorizer = TfidfVectorizer(stop_words="english", max_features=30000, ngram_range=(1,2))
vectorizer.fit(corpus)

R = vectorizer.transform(df[resume_col])
J = vectorizer.transform(df[jd_col])

# Feature 1: cosine similarity
cos_sim = np.array([cosine_similarity(R[i], J[i])[0,0] for i in range(R.shape[0])]).reshape(-1,1)

# Feature 2: Jaccard token overlap
jac = np.array([
    jaccard(simple_tokens(df[resume_col].iat[i]), simple_tokens(df[jd_col].iat[i]))
    for i in range(len(df))
]).reshape(-1,1)

# Feature 3: overlap count normalized
overlap_cnt = np.array([
    len(set(simple_tokens(df[resume_col].iat[i])) & set(simple_tokens(df[jd_col].iat[i])))
    for i in range(len(df))
], dtype=float).reshape(-1,1)
overlap_norm = (overlap_cnt / (1 + np.array([len(set(simple_tokens(t))) for t in df[jd_col]]).reshape(-1,1)))

X = np.hstack([cos_sim, jac, overlap_norm])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

clf = DecisionTreeClassifier(max_depth=5, random_state=42)
clf.fit(X_train, y_train)
print("\nEvaluation on held-out set:")
print(classification_report(y_test, clf.predict(X_test), digits=3))

# Save artifacts
joblib.dump(clf, os.path.join(MODELS_DIR, "ats_decision_tree.pkl"))
joblib.dump(vectorizer, os.path.join(MODELS_DIR, "tfidf_pair.pkl"))

print("\nSaved:")
print(" - models/ats_decision_tree.pkl")
print(" - models/tfidf_pair.pkl")
