from fastapi import FastAPI, File, UploadFile, HTTPException
import cv2
import numpy as np
import logging
import os
import time
from typing import Dict, Any

from backend.video_detector import VideoDeepfakeDetector
from backend.text_detector import TextPhishingDetector
from backend.fusion_engine import FusionEngine
from backend.preprocess import VideoProcessor, TextProcessor, preprocess_video, preprocess_text
from backend.decision_engine import DecisionAgent
from backend.explainability import explainability

logger = logging.getLogger(__name__)

app = FastAPI(title="VERI-AI EDGE", version="0.1")

# Global components
video_detector = VideoDeepfakeDetector()
text_detector = TextPhishingDetector()
fusion_engine = FusionEngine()
decision_agent = DecisionAgent()
video_processor = VideoProcessor()
text_processor = TextProcessor()

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing models...")
    if not video_detector.initialize(device='auto', num_threads=4):
        logger.error("Failed to initialize video detector")
    if not text_detector.initialize(device='auto', num_threads=4):
        logger.error("Failed to initialize text detector")
    video_detector.warmup()
    text_detector.warmup()
    logger.info("Models initialized and warmed up")

@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        temp_path = preprocess_video(file)
        # Preprocess video
        frames = video_processor.process(temp_path)
        # Detect
        video_score = video_detector.predict(frames)
        # Fuse
        fusion_result = fusion_engine.weighted_average({'video': video_score})
        # Decision
        decision = decision_agent.decide(
            fusion_result.final_score,
            {'video': video_score},
            fusion_result.confidence
        )
        # Explainability
        explanation = explainability(
            fusion_result.final_score, 
            data_type='video', 
            data=frames
        )
        # Cleanup
        try:
            os.unlink(temp_path)
        except:
            pass
        return {
            "confidence": fusion_result.final_score,
            "decision": decision.to_dict(),
            "reason": explanation.get('text_explanation', "No explanation available"),
            "details": {
                "video_score": video_score,
                "fusion_method": fusion_result.method,
                "fusion_confidence": fusion_result.confidence,
                "explanation": explanation
            }
        }
    except Exception as e:
        logger.error(f"Video analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/text")
async def analyze_text(file: UploadFile = File(...)):
    try:
        temp_path = preprocess_text(file)
        with open(temp_path, 'r', encoding='utf-8') as f:
            text = f.read()
        # Tokenize
        token_ids = text_processor.process(text)
        # Detect
        text_score = text_detector.predict(token_ids)
        # Fuse
        fusion_result = fusion_engine.weighted_average({'text': text_score})
        # Decision
        decision = decision_agent.decide(
            fusion_result.final_score,
            {'text': text_score},
            fusion_result.confidence
        )
        # Explainability
        explanation = explainability(
            fusion_result.final_score,
            data_type='text',
            data=token_ids
        )
        # Cleanup
        try:
            os.unlink(temp_path)
        except:
            pass
        return {
            "confidence": fusion_result.final_score,
            "decision": decision.to_dict(),
            "reason": explanation.get('text_explanation', "No explanation available"),
            "details": {
                "text_score": text_score,
                "fusion_method": fusion_result.method,
                "fusion_confidence": fusion_result.confidence,
                "explanation": explanation
            }
        }
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "models_loaded": video_detector.initialized and text_detector.initialized
    }
