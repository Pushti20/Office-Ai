import json
import pickle
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    accuracy_score, classification_report
)

print("=" * 55)
print("   OFFICE AI -- ML Training Pipeline v4.0")
print("=" * 55)

print("\n[Step 1] Loading Dataset...")
with open("data.json", "r") as f:
    data = json.load(f)
print("   Dataset loaded: {} total entries".format(len(data)))

print("\n[Step 2] Data Preprocessing...")

tasks_raw, roles_raw = [], []
missing_count = 0

for item in data:
    task = item.get("task", "")
    role = item.get("role", None)
    if not task or not role or not task.strip() or not role.strip():
        missing_count += 1
        continue
    tasks_raw.append(task)
    roles_raw.append(role)

tasks_norm = [t.lower().strip() for t in tasks_raw]
roles_norm  = [r.lower().strip() for r in roles_raw]

print("   Missing/empty removed : {}".format(missing_count))
print("   Clean samples         : {}".format(len(tasks_norm)))
print("   Unique roles          : {}".format(len(set(roles_norm))))
print("   [OK] Normalization done (lowercase + strip)")

le = LabelEncoder()
y  = le.fit_transform(roles_norm)
print("   [OK] Label encoding -> {} classes".format(len(le.classes_)))

print("\n[Step 3] TF-IDF Tokenization (word n-grams)...")
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    stop_words="english",
    max_features=800,
    sublinear_tf=True,
    min_df=1,
    max_df=0.90
)

print("\n[Step 4] Train/Test Split (70% / 30%, stratified)...")

from collections import Counter
class_counts = Counter(y)
can_stratify = all(v >= 2 for v in class_counts.values())

tasks_train, tasks_test, y_train, y_test = train_test_split(
    tasks_norm, y,
    test_size=0.30,
    random_state=42,
    stratify=y if can_stratify else None
)
print("   Training samples : {}".format(len(tasks_train)))
print("   Test samples     : {}".format(len(tasks_test)))
print("   Stratified       : {}".format(can_stratify))

X_train = vectorizer.fit_transform(tasks_train)
X_test  = vectorizer.transform(tasks_test)
print("   Features extracted: {}".format(X_train.shape[1]))

print("\n[Step 5] Training Model (Logistic Regression)...")
model = LogisticRegression(
    C=1.0,
    max_iter=3000,
    class_weight='balanced',
    solver='lbfgs',
    random_state=42
)
model.fit(X_train, y_train)
print("   [OK] Model trained")

print("\n[Step 6] Evaluation Metrics...")
y_pred_train = model.predict(X_train)
y_pred_test  = model.predict(X_test)

train_acc = accuracy_score(y_train, y_pred_train)
test_acc  = accuracy_score(y_test,  y_pred_test)
precision = precision_score(y_test, y_pred_test, average="weighted", zero_division=0)
recall    = recall_score(y_test,    y_pred_test, average="weighted", zero_division=0)
f1        = f1_score(y_test,        y_pred_test, average="weighted", zero_division=0)
gap       = train_acc - test_acc

print("   Train Accuracy : {:.2f}%".format(train_acc * 100))
print("   Test  Accuracy : {:.2f}%".format(test_acc  * 100))
print("   Precision      : {:.2f}%".format(precision  * 100))
print("   Recall         : {:.2f}%".format(recall     * 100))
print("   F1-Score       : {:.2f}%".format(f1         * 100))
print("   Train-Test Gap : {:.2f}%".format(gap        * 100))

label_names = list(le.classes_)
print("\n   Per-Class Classification Report:")
print(classification_report(
    y_test, y_pred_test,
    target_names=label_names,
    zero_division=0
))

print("[Step 7] 5-Fold Stratified Cross-Validation (Overfitting Check)...")
X_all = vectorizer.transform(tasks_norm)
skf   = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X_all, y, cv=skf, scoring="accuracy", n_jobs=-1)
cv_mean   = float(np.mean(cv_scores))
cv_std    = float(np.std(cv_scores))

print("   CV Scores : {}".format([round(s * 100, 2) for s in cv_scores]))
print("   CV Mean   : {:.2f}% +/- {:.2f}%".format(cv_mean * 100, cv_std * 100))

if gap > 0.12:
    ov_status = "Overfitting Detected"
    ov_note   = "Training accuracy is significantly higher than test. More data or lower C recommended."
elif test_acc < 0.55:
    ov_status = "Underfitting Detected"
    ov_note   = "Model accuracy is low. More data or richer features needed."
elif gap <= 0.05:
    ov_status = "Excellent Fit"
    ov_note   = "Train/test gap is very small. Model generalizes well to unseen data."
else:
    ov_status = "Good Fit"
    ov_note   = "Model generalizes well. Train and test accuracy are balanced."

print("   Status : {}".format(ov_status))
print("   Note   : {}".format(ov_note))

metrics = {
    "dataset": {
        "total_entries"  : len(data),
        "clean_samples"  : len(tasks_norm),
        "missing_removed": missing_count,
        "unique_roles"   : len(set(roles_norm)),
        "features"       : int(X_train.shape[1])
    },
    "preprocessing": {
        "step1": "Missing value removal - empty/null entries filtered",
        "step2": "Lowercase normalization and whitespace stripping",
        "step3": "TF-IDF tokenization (1-2 ngram, 800 features, fit on TRAIN only)"
    },
    "split": {
        "train_size" : len(tasks_train),
        "test_size"  : len(tasks_test),
        "ratio"      : "70 / 30",
        "stratified" : can_stratify
    },
    "model": {
        "type"        : "Logistic Regression",
        "C"           : 1.0,
        "solver"      : "lbfgs",
        "class_weight": "balanced"
    },
    "metrics": {
        "train_accuracy" : round(train_acc * 100, 2),
        "test_accuracy"  : round(test_acc  * 100, 2),
        "precision"      : round(precision  * 100, 2),
        "recall"         : round(recall     * 100, 2),
        "f1_score"       : round(f1         * 100, 2),
        "train_test_gap" : round(gap        * 100, 2)
    },
    "cross_validation": {
        "folds"  : 5,
        "scores" : [round(s * 100, 2) for s in cv_scores.tolist()],
        "mean"   : round(cv_mean * 100, 2),
        "std"    : round(cv_std  * 100, 2)
    },
    "overfitting": {
        "status"        : ov_status,
        "note"          : ov_note,
        "train_test_gap": round(gap * 100, 2)
    }
}

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("\n[OK] Metrics saved -> metrics.json")

pickle.dump(model,      open("model.pkl",        "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl",   "wb"))
pickle.dump(le,         open("label_encoder.pkl","wb"))
print("[OK] model.pkl + vectorizer.pkl + label_encoder.pkl saved")

print("\n[Step 8] Training Team Assignment Model (all task types)...")

team_tasks_raw = []
team_roles_raw = []

for item in data:
    task = item.get("task", "").strip()
    if not task:
        continue

    if "roles" in item:
        roles_list = [r.lower().strip() for r in item["roles"] if r.strip()]
        if roles_list:
            team_tasks_raw.append(task.lower())
            team_roles_raw.append(roles_list)
    elif "role" in item and item["role"].strip():
        team_tasks_raw.append(task.lower())
        team_roles_raw.append([item["role"].lower().strip()])

print("   Team training samples  : {}".format(len(team_tasks_raw)))

team_vec = TfidfVectorizer(
    ngram_range=(1, 2),
    stop_words="english",
    max_features=800,
    sublinear_tf=True,  
    min_df=1,
    max_df=0.95
)
X_team = team_vec.fit_transform(team_tasks_raw)
mlb    = MultiLabelBinarizer()
y_team = mlb.fit_transform(team_roles_raw)

print("   Unique team roles learned: {}".format(len(mlb.classes_)))
print("   Classes: {}".format(list(mlb.classes_)))

team_model = OneVsRestClassifier(
    LogisticRegression(C=1.0, max_iter=3000, class_weight='balanced',
                       solver='lbfgs', random_state=42)
)
team_model.fit(X_team, y_team)

pickle.dump(team_model, open("team_model.pkl",      "wb"))
pickle.dump(team_vec,   open("team_vectorizer.pkl", "wb"))
pickle.dump(mlb,        open("mlb.pkl",             "wb"))
print("[OK] Team model trained and saved -> team_model.pkl + team_vectorizer.pkl + mlb.pkl")

print("\n" + "=" * 55)
print("   [DONE] Training Complete!")
print("   Train Acc : {:.2f}%".format(train_acc * 100))
print("   Test  Acc : {:.2f}%".format(test_acc  * 100))
print("   F1-Score  : {:.2f}%".format(f1 * 100))
print("   CV Mean   : {:.2f}% +/- {:.2f}%".format(cv_mean * 100, cv_std * 100))
print("   Status    : {}".format(ov_status))
print("=" * 55)