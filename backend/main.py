from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from backend.video_detector import VideoDeepfakeDetector
from backend.text_detector import detect_phishing, detect_deepfake_text
from backend.fusion_engine import fusion_engine
from backend.decision_engine import decision_engine
from backend.explainability import explainability
import os
import tempfile

app = FastAPI()

# Initialize detectors and other components
video_detector = VideoDeepfakeDetector()

@app.on_event("startup")
async def startup_event():
    # Any startup tasks can go here, like loading models
    pass

@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            video_path = temp_file.name

        video_score = video_detector.detect(video_path)
        fused_score = fusion_engine(video_score, 0.0)   # Assuming text score is <｜begin▁of▁sentence｜> 0 for video-only analysis
        decision = decision_engine(fused_score)
        explanation = explainability(fused_score, data_type='video', data=video_path)

        os.remove(video_path)   # Clean up the temporary file

        return JSONResponse(content={"decision": decision.to_dict(), "explanation": explanation})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/analyze/text")
async def analyze_text(file: UploadFile = File(...)):
    try:
        text = (await file.read()).decode("utf-8")
        phishing_score = detect_phishing(text)
        deepfake_score = detect_deepfake_text(text)
        fused_score = fusion_engine(0.0, deepfake_score)   # Assuming video score is <｜begin▁of▁sentence｜> 0 for text-only analysis
        decision = decision_engine(fused_score)
        explanation = explainability(fused_score, data_type='text', data=text)

        return JSONResponse(content={"decision": decision.to_dict(), "explanation": explanation})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/health")
async def health():
    return JSONResponse(content={"status": "ok"})
