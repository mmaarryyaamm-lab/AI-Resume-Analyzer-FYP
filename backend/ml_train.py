import json
import os
import re

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'resume_job_matching_dataset.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

token_pat = re.compile(r'[a-zA-Z][a-zA-Z+\-._/#]*')
EXTRA_STOPWORDS = {
    'resume', 'cv', 'work', 'working', 'role', 'position', 'job', 'using',
    'use', 'used', 'year', 'years', 'experience', 'experienced', 'skills',
    'skill', 'ability', 'abilities',
}


def clean_text(text: str) -> str:
    text = text or ''
    return re.sub(r'\s+', ' ', str(text)).strip()


def pick_first_existing(df: pd.DataFrame, names):
    for name in names:
        if name in df.columns:
            return name
    raise ValueError(f'Could not find any of columns: {names} in {list(df.columns)}')


def simple_tokens(text: str):
    tokens = token_pat.findall((text or '').lower())
    return [
        token for token in tokens
        if len(token) > 2 and token not in ENGLISH_STOP_WORDS and token not in EXTRA_STOPWORDS
    ]


def jaccard(a_words, b_words):
    a, b = set(a_words), set(b_words)
    union_size = len(a | b)
    return 0.0 if union_size == 0 else len(a & b) / union_size


def load_training_frame(data_path: str = DATA_PATH) -> pd.DataFrame:
    if data_path.endswith('.json') or data_path.endswith('.jsonl'):
        with open(data_path, 'r', encoding='utf-8') as handle:
            rows = [json.loads(line) for line in handle]
        return pd.DataFrame(rows)
    return pd.read_csv(data_path, encoding='utf-8', engine='python')


def build_training_matrix(df: pd.DataFrame):
    resume_col = pick_first_existing(df, ['resume_text', 'resume', 'Resume', 'cv', 'CV'])
    jd_col = pick_first_existing(df, ['job_description', 'jd', 'Job Description', 'description'])

    label_col = None
    for candidate in ['label', 'match', 'target', 'y', 'match_label', 'is_match', 'match_score', 'score', 'rating']:
        if candidate in df.columns:
            label_col = candidate
            break
    if label_col is None:
        raise ValueError("No label/score column found. Add a 'label' or 'match_score' column.")

    df = df.copy()
    df[resume_col] = df[resume_col].astype(str).map(clean_text)
    df[jd_col] = df[jd_col].astype(str).map(clean_text)

    y_raw = df[label_col]
    if y_raw.dtype.kind in 'if':
        y = (y_raw >= 4).astype(int)
    else:
        y = y_raw.astype(str).str.lower().map(
            {'good': 1, 'match': 1, 'positive': 1, 'yes': 1, '1': 1, 'true': 1}
        ).fillna(0).astype(int)

    corpus = pd.concat([df[resume_col], df[jd_col]], axis=0).tolist()
    vectorizer = TfidfVectorizer(stop_words='english', max_features=30000, ngram_range=(1, 2))
    vectorizer.fit(corpus)

    resumes = vectorizer.transform(df[resume_col])
    jobs = vectorizer.transform(df[jd_col])

    cosine_scores = np.array(
        [cosine_similarity(resumes[i], jobs[i])[0, 0] for i in range(resumes.shape[0])]
    ).reshape(-1, 1)
    jaccard_scores = np.array(
        [jaccard(simple_tokens(df[resume_col].iat[i]), simple_tokens(df[jd_col].iat[i])) for i in range(len(df))]
    ).reshape(-1, 1)
    overlap_counts = np.array(
        [
            len(set(simple_tokens(df[resume_col].iat[i])) & set(simple_tokens(df[jd_col].iat[i])))
            for i in range(len(df))
        ],
        dtype=float,
    ).reshape(-1, 1)
    overlap_norm = overlap_counts / (
        1 + np.array([len(set(simple_tokens(text))) for text in df[jd_col]]).reshape(-1, 1)
    )

    features = np.hstack([cosine_scores, jaccard_scores, overlap_norm])
    return features, y, vectorizer, len(df)


def train_ats_model(data_path: str = DATA_PATH, models_dir: str = MODELS_DIR):
    os.makedirs(models_dir, exist_ok=True)
    df = load_training_frame(data_path)
    features, y, vectorizer, row_count = build_training_matrix(df)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    clf = DecisionTreeClassifier(max_depth=5, random_state=42)
    clf.fit(x_train, y_train)

    predictions = clf.predict(x_test)
    report = classification_report(y_test, predictions, digits=3, output_dict=True, zero_division=0)

    clf_path = os.path.join(models_dir, 'ats_decision_tree.pkl')
    vect_path = os.path.join(models_dir, 'tfidf_pair.pkl')
    joblib.dump(clf, clf_path)
    joblib.dump(vectorizer, vect_path)

    accuracy = report.get('accuracy', 0.0)
    weighted = report.get('weighted avg', {})

    return {
        'data_path': data_path,
        'models_dir': models_dir,
        'rows': row_count,
        'accuracy': round(float(accuracy), 4),
        'precision': round(float(weighted.get('precision', 0.0)), 4),
        'recall': round(float(weighted.get('recall', 0.0)), 4),
        'f1_score': round(float(weighted.get('f1-score', 0.0)), 4),
        'model_path': clf_path,
        'vectorizer_path': vect_path,
    }


if __name__ == '__main__':
    summary = train_ats_model()
    print('Training complete:')
    for key, value in summary.items():
        print(f' - {key}: {value}')
