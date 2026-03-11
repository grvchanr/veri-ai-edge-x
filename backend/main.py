from fastapi import FastAPI, File, UploadFile
from backend.video_detector import detect_deepfake_video
from backend.text_detector import detect_deepfake_text
from backend.fusion_engine import fusion_engine
from backend.decision_engine import decision_engine
from backend.explainability import explainability
from backend.preprocess import preprocess_video, preprocess_text

app = FastAPI()

@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    temp_path = preprocess_video(file)
    frames = extract_frames(temp_path)
    score = detect_deepfake_video(frames)
    fusion_result = fusion_engine(score)
    decision = decision_engine(fusion_result)
    explanation = explainability(fusion_result)
    return {
        "confidence": fusion_result,
        "decision": decision,
        "reason": explanation
    }

@app.post("/analyze/text")
async def analyze_text(file: UploadFile = File(...)):
    temp_path = preprocess_text(file)
    text = extract_text(temp_path)
    score = detect_deepfake_text(text)
    fusion_result = fusion_engine(score)
    decision = decision_engine(fusion_result)
    explanation = explainability(fusion_result)
    return {
        "confidence": fusion_result,
        "decision": decision,
        "reason": explanation
    }
