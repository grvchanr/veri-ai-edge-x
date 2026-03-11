import re

def detect_deepfake_text(text):
    # Placeholder deepfake detection logic
    score = len(re.findall(r'\bdeepfake\b', text, re.IGNORECASE))
    return score
