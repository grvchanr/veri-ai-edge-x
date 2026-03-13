from fastapi import FastAPI, File, UploadFile, HTTPException
import logging
import os
from typing import Dict, Any

from backend.video_detector import VideoDeepfakeDetector
from backend.text_detector import TextPhishingDetector
from backend.fusion_engine import fusion_engine
from backend.preprocess import VideoProcessor, TextProcessor, preprocess_video, preprocess_text
from backend.decision_engine import DecisionAgent
from backend.explainability import explainability

logger = logging.getLogger(__name__)

app = FastAPI(title="VERI-AI EDGE", version="0.1")

# Initialize global components
video_detector = VideoDeepfakeDetector()
text_detector = TextPhishingDetector()
fusion_engine = fusion_engine()
decision_agent = DecisionAgent()
video_processor = VideoProcessor()
text_processor = TextProcessor()


@app.on_event("startup")
async def startup_event():
    logger.info("VERI-AI EDGE backend starting...")


@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        
        # Save uploaded file
        temp_path = preprocess_video(file)

        # Preprocess video
        frames = video_processor.process(temp_path)

        # Detect deepfake
        result = video_detector.detect(temp_path)
        video_score = result["video_score"]

        # Fuse scores 
        fusion_result = fusion_engine.weighted_average({"video": video_score})

        # Decision
        decision = decision_agent.decide(
            fusion_result.final_score,
            {"video": video_score},
            fusion_result.confidence
        )

        # Explainability
        explanation = explainability(
            fusion_result.final_score,
            data_type="video",
            data=frames
        
        # Cleanup
        try:
            os.unlink(temp_path)
        except Exception:
            pass

        return 
        {
            "confidence": fusion_result.final_score,
            "decision": decision.to_dict(),
            "reason": explanation.get("text_explanation", "No explanation available"),
            "details": 
            {
                "video_score": video_score,
                "explanation": explanation
            }
        }

    except Exception as e:
        logger.error(f"Video analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/text")
async def analyze_text(file: UploadFile