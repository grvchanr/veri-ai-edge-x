from fastapi import FastAPI, File, UploadFile
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

# Initialize detectors
video_detector = VideoDeepfakeDetector()


@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete.")


@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        logger.info("Video received")

        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            video_path = temp_file.name

        logger.info("Saving upload")

        # Run video detector
        result = video_detector.detect(video_path)

        video_score = result.get("video_score", 0.0)
        reason = result.get("reason", "Analysis complete")
        frames_analyzed = result.get("frames_analyzed", 0)

        logger.info("Running face detection")

        # Fusion (video only in this endpoint)
        fused_score = fusion_engine(video_score, 0.0)

        logger.info("Scoring frames")

        # Decision engine
        decision = decision_engine(fused_score)

        # Explainability
        explanation = explainability(
            fused_score,
            data_type="video",
            data=video_path
        )

        # Cleanup temp file
        os.remove(video_path)

        logger.info("Returning result")

        return JSONResponse(content={
            "confidence": fused_score,
            "decision": decision.to_dict(),
            "reason": reason,
            "frames_analyzed": frames_analyzed,
            "processing_steps": explanation.get("processing_steps", [])
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

        fused_score = fusion_engine(0.0, deepfake_score)

        decision = decision_engine(fused_score)

        explanation = explainability(
            fused_score,
            data_type="text",
            data=text
        )

        return JSONResponse(content={
            "confidence": fused_score,
            "decision": decision.to_dict(),
            "reason": explanation.get("reason", "Text analysis complete"),
            "processing_steps": explanation.get("processing_steps", [])
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/health")
async def health():
    return JSONResponse(content={"status": "ok"})