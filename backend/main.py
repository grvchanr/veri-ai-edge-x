from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.video_detector import VideoDeepfakeDetector
from backend.text_detector import detect_phishing, detect_deepfake_text
from backend.fusion_engine import fusion_engine
from backend.decision_engine import decision_engine
from backend.explainability import explainability
import os
import tempfile
import logging
import time
import base64
import cv2
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VERI-AI EDGE", description="Autonomous Multimodal Deepfake Detection API"
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detectors
video_detector = VideoDeepfakeDetector()


@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete.")


# ── Video analysis ───────────────────────────────────────────────────────────
@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        logger.info("Video received")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            video_path = temp_file.name

        logger.info("Saving upload")
        start_time = time.time()

        result = video_detector.detect(video_path)

        video_score = result.get("video_score", 0.0)
        reason = result.get("reason", "Analysis complete")
        frames_analyzed = result.get("frames_analyzed", 0)
        faces = result.get("faces", [])

        logger.info("Running face detection")
        fused_score = fusion_engine(video_score, 0.0)

        logger.info("Scoring frames")
        decision = decision_engine(fused_score)

        explanation = explainability(fused_score, data_type="video", data=video_path)

        analysis_time = round(time.time() - start_time, 2)
        os.remove(video_path)

        logger.info("Returning result")

        fake_prob = float(fused_score)
        real_prob = 1.0 - fake_prob
        
        mean_prob = result.get("mean_fake_probability", fake_prob)
        std_prob = result.get("std_fake_probability", 0.0)
        frame_scores = result.get("frame_scores", [fake_prob])
        
        if fake_prob > 0.7:
            api_label = "FAKE"
            conf_val = fake_prob * 100
        elif fake_prob < 0.3:
            api_label = "REAL"
            conf_val = real_prob * 100
        else:
            api_label = "UNCERTAIN"
            conf_val = max(fake_prob, real_prob) * 100
            
        confidence_pct = round(conf_val, 1)

        return JSONResponse(
            content={
                "label": api_label,
                "confidence": confidence_pct,
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(real_prob, 4),
                "mean_fake_probability": round(mean_prob, 4),
                "median_fake_probability": round(fake_prob, 4),
                "std_fake_probability": round(std_prob, 4),
                "frame_scores": [round(s, 4) for s in frame_scores],
                "verdict": "deepfake" if api_label == "FAKE" else "authentic" if api_label == "REAL" else "suspicious",
                "decision": decision.to_dict(),
                "reason": reason,
                "faces": faces,
                "metrics": {
                    "framesAnalyzed": frames_analyzed,
                    "processingTime": analysis_time,
                    "modelUsed": "EfficientNet-B7 + MediaPipe (Temporal Aggregation)",
                    "inferenceDevice": "CPU/MPS/CUDA Edge Inference",
                },
                "processing_steps": explanation.get("processing_steps", []),
                "analysis_time_seconds": analysis_time,
                "model": "EfficientNet-B7 + MediaPipe",
                "device": "CPU/MPS/CUDA Edge Inference",
            }
        )

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


# ── Frame analysis (live) ───────────────────────────────────────────────────
@app.post("/analyze/frame")
async def analyze_frame(request: Request):
    try:
        body = await request.json()
        image_b64 = body.get("image", "")

        if not image_b64:
            return JSONResponse(content={"error": "No image provided"}, status_code=400)

        image_data = base64.b64decode(image_b64)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return JSONResponse(
                content={"error": "Failed to decode image"}, status_code=400
            )

        result = video_detector.classify_frame(frame)

        video_score = result.get("score", 0.0)
        faces = result.get("faces", [])

        fused_score = fusion_engine(video_score, 0.0)
        decision = decision_engine(fused_score)

        fake_prob = float(fused_score)
        real_prob = 1.0 - fake_prob
        
        # For single frame analysis, median/mean/std are simpler but available
        if fake_prob > 0.7:
            api_label = "FAKE"
            conf_val = fake_prob * 100
        elif fake_prob < 0.3:
            api_label = "REAL"
            conf_val = real_prob * 100
        else:
            api_label = "UNCERTAIN"
            conf_val = max(fake_prob, real_prob) * 100
            
        confidence_pct = round(conf_val, 1)

        return JSONResponse(
            content={
                "label": api_label,
                "confidence": confidence_pct,
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(real_prob, 4),
                "mean_fake_probability": round(fake_prob, 4),
                "median_fake_probability": round(fake_prob, 4),
                "std_fake_probability": 0.0,
                "frame_scores": [round(fake_prob, 4)],
                "verdict": "deepfake" if api_label == "FAKE" else "authentic" if api_label == "REAL" else "suspicious",
                "decision": decision.to_dict(),
                "faces": faces,
                "metrics": {
                    "facesDetected": len(faces),
                    "modelUsed": "EfficientNet-B7 + MediaPipe",
                    "inferenceDevice": "CPU/MPS/CUDA Edge Inference",
                },
            }
        )

    except Exception as e:
        logger.error(f"Frame analysis error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


# ── Text analysis ────────────────────────────────────────────────────────────
@app.post("/analyze/text")
async def analyze_text(request: Request, file: UploadFile = File(None)):
    """
    Accepts either:
      • multipart/form-data with a 'file' field (text file upload), OR
      • application/json with a 'text' field.
    """
    try:
        content_type = request.headers.get("content-type", "")

        if file is not None:
            # File upload path
            text = (await file.read()).decode("utf-8")
        elif "application/json" in content_type:
            body = await request.json()
            text = body.get("text", "")
        else:
            # Fallback: try reading raw body as utf-8
            raw = await request.body()
            text = raw.decode("utf-8")

        phishing_score = detect_phishing(text)
        deepfake_score = detect_deepfake_text(text)

        fused_score = fusion_engine(0.0, deepfake_score)
        decision = decision_engine(fused_score)

        explanation = explainability(fused_score, data_type="text", data=text)

        fake_prob = float(fused_score)
        real_prob = 1.0 - fake_prob
        
        if fake_prob > 0.7:
            api_label = "FAKE"
            conf_val = fake_prob * 100
        elif fake_prob < 0.3:
            api_label = "REAL"
            conf_val = real_prob * 100
        else:
            api_label = "UNCERTAIN"
            conf_val = max(fake_prob, real_prob) * 100
            
        confidence_pct = round(conf_val, 1)

        return JSONResponse(
            content={
                "label": api_label,
                "confidence": confidence_pct,
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(real_prob, 4),
                "verdict": "deepfake" if api_label == "FAKE" else "authentic" if api_label == "REAL" else "suspicious",
                "decision": decision.to_dict(),
                "reason": explanation.get("reason", "Text analysis complete"),
                "metrics": {
                    "framesAnalyzed": 0,
                    "processingTime": 0.0,
                    "modelUsed": "Keyword Heuristic",
                    "inferenceDevice": "CPU Edge Inference",
                },
                "processing_steps": explanation.get("processing_steps", []),
                "phishing_score": round(phishing_score * 100, 1),
                "device": "CPU Edge Inference",
            }
        )

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return JSONResponse(
        content={
            "status": "ok",
            "edgeMode": "enabled",
            "inferenceDevice": "CPU/MPS/CUDA",
            "latency": 0,
            "model": "EfficientNet-B7",
            "liveStreamEnabled": True,
        }
    )
