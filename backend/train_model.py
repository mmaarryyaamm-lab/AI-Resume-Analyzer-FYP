# train_model.py

import random
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from ml_features import extract_features

# 🎯 Synthetic sample data (resume text, jd text, label)
data = [
    ("Python developer with Flask and SQL. Managed projects. BSc in Computer Science.", 
     "Looking for a backend developer with Python, Flask, and database experience.", 
     "Strong"),
     
    ("Worked in a company. I am hardworking and a fast learner. Good communication.", 
     "Looking for someone with React, JS, and problem-solving experience.", 
     "Weak"),

    ("Created AutoCAD drawings, 2D/3D drafting. Civil Eng. diploma. Site supervision experience.", 
     "AutoCAD expert needed with construction design experience and drafting.", 
     "Moderate"),

    ("Developed REST APIs, designed database schemas, worked in Agile. BSc Software Eng.", 
     "Hiring full stack developer with API, SQL, and Git experience.", 
     "Strong"),

    ("Interned in sales. Did a course on Excel. Matric qualified. Basic computer use.", 
     "Looking for an analyst with Excel and reporting skills.", 
     "Weak"),

    ("Designed machine parts in AutoCAD and Fusion360. 3 years experience. Good documentation skills.", 
     "Mechanical designer with CAD expertise and drawing documentation.", 
     "Moderate")
]

# 📊 Convert text labels to numbers
label_map = {"Weak": 0, "Moderate": 1, "Strong": 2}

X = []
y = []

print("Extracting features...")
for resume_text, jd_text, label in data:
    features = extract_features(resume_text, jd_text)
    X.append(features)
    y.append(label_map[label])

# 📈 Train Decision Tree
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = DecisionTreeClassifier(max_depth=4, random_state=42)
clf.fit(X_train, y_train)

# 🎯 Evaluate
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Model trained with accuracy: {acc:.2f}")

# 💾 Save model
joblib.dump(clf, "model.pkl")
print("✅ Saved as model.pkl")
