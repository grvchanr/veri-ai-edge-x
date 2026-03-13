from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from backend.video_detector import VideoDeepfakeDetector
from backend.text_detector import detect_phishing, detect_deepfake_text
from backend.fusion_engine import fusion_engine
from backend.decision_engine import decision_engine
from backend.explainability import explainability
import os
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        logger.info("Video received")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            video_path = temp_file.name

        logger.info("Saving upload")

        result = video_detector.detect(video_path)
        video_score = result["video_score"]
        reason = result.get("reason", "Analysis complete")
        frames_analyzed = result.get("frames_analyzed", 0)

        logger.info("Running face detection")

        fused_score = fusion_engine(video_score, 0.0)       # Assuming text score is 0 for video-only analysis
        logger.info("Scoring frames")

        decision = decision_engine(fused_score)
        explanation = explainability(fused<｜begin▁of▁sentence｜>_score, data_type='video', data=video_path)

        os.remove(video_path)       # Clean up the temporary file
        logger.info("Returning result")

        return JSONResponse(content={
            "confidence": fused_score,
            "decision": decision.to_dict(), 
            "reason": reason,
            "frames_analyzed": frames_analyzed,
            "processing_steps": explanation["processing_steps"]
        })

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/analyze/text")
async def analyze_text(file: UploadFile = File(...)):
    try:
        text = (await file.read()).decode("utf-8")
        phishing_score = detect_phishing(text)
        deepfake_score = detect_deepfake_text(text)
        fused_score = fusion_engine(0.0, deepfake_score)       # Assuming video score is 0 for text-only analysis
        decision = decision_engine(fused_score)
        explanation = explainability(fused_score, data_type='text', data=text)

        return JSONResponse(content={
            "confidence": fused_score,
            "decision": decision.to_dict(), 
            "reason": explanation["reason"],
            "processing_steps": explanation["processing_steps"]
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/health")
async def health():
    return JSONResponse(content={"status": "ok"})
