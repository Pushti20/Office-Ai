import sys
import pickle
import os

BASE_DIR = os.path.dirname(__file__)

model      = pickle.load(open(os.path.join(BASE_DIR, "model.pkl"),         "rb"))
vectorizer = pickle.load(open(os.path.join(BASE_DIR, "vectorizer.pkl"),    "rb"))
le         = pickle.load(open(os.path.join(BASE_DIR, "label_encoder.pkl"), "rb"))

team_model      = pickle.load(open(os.path.join(BASE_DIR, "team_model.pkl"),      "rb"))
team_vectorizer = pickle.load(open(os.path.join(BASE_DIR, "team_vectorizer.pkl"), "rb"))
mlb             = pickle.load(open(os.path.join(BASE_DIR, "mlb.pkl"),             "rb"))

task = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else "individual"

task_norm = task.lower().strip()

if mode == "individual":
    X         = vectorizer.transform([task_norm])
    encoded   = model.predict(X)[0]
    role_name = le.inverse_transform([encoded])[0]
    print(role_name.lower().strip())
    sys.exit(0)

X_team = team_vectorizer.transform([task_norm])
probs  = team_model.predict_proba(X_team)[0]
classes = mlb.classes_

# Sort by probability descending
sorted_roles = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)

top_prob      = sorted_roles[0][1] if sorted_roles else 1.0
rel_threshold = top_prob * 0.40  
abs_threshold = 0.10            

candidate_roles = [
    r.lower().strip()
    for r, p in sorted_roles
    if p >= rel_threshold and p >= abs_threshold
]

niche_role_keywords = {
    ".net application developer":    [".net", "asp.net", "c#", "dotnet", "blazor", "wpf", "entity framework", "linq"],
    "embedded linux developer":      ["embedded", "firmware", "rtos", "microcontroller", "arm", "yocto", "kernel", "driver", "uart", "i2c", "bare-metal", "bare metal"],
    "network engineer":              ["network", "router", "switch", "vlan", "bgp", "vpn", "cisco", "dns", "dhcp", "firewall", "bandwidth", "packet", "routing"],
    "ethical hacker":                ["penetration", "pentest", "hacking", "exploit", "metasploit", "burp", "kali", "nmap", "xss", "csrf", "security audit", "audit", "vulnerability", "hack"],
    "big data engineer":             ["hadoop", "spark", "kafka", "hdfs", "hive", "etl", "big data", "streaming", "parquet", "airflow", "analytics platform", "data pipeline", "pipeline"],
    "business intelligence analyst": ["power bi", "tableau", "kpi", "bi ", "business intelligence", "executive report", "analytics platform", "analytics", "dashboard", "report"],
    "ios developer":                 ["ios", "swift", "xcode", "swiftui", "iphone", "apple", "app store", "objective-c", "mobile application", "mobile app", "all platforms"],
    "android developer":             ["android", "kotlin", "jetpack", "gradle", "play store", "android studio", "mobile application", "mobile app", "all platforms"],
}

def is_niche_allowed(role, task_text):
    """Return True if this niche role is relevant to the task."""
    if role not in niche_role_keywords:
        return True 
    return any(kw in task_text for kw in niche_role_keywords[role])

filtered = [r for r in candidate_roles if is_niche_allowed(r, task_norm)]

if len(filtered) < 2:
    for r, p in sorted_roles:
        role = r.lower().strip()
        if role not in filtered and is_niche_allowed(role, task_norm):
            filtered.append(role)
        if len(filtered) >= 2:
            break

if len(filtered) > 4:
    filtered = filtered[:4]

print(",".join(filtered))