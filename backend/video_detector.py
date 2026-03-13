import cv2
import numpy as np
from backend.preprocess import extract_frames

class VideoDeepfakeDetector:

    def __init__(self):
        # initialize any needed models
        pass

    def detect(self, video_path):
        # extract frames using preprocess.extract_frames
        frames = extract_frames(video_path)

        if not frames:
            return {"video_score": 0.0, "reason": "No frames extracted"}

        # Placeholder for face detection 
        # For now, we'll just process all frames
        face_frames = frames  

        # Placeholder deepfake scoring 
        score = np.mean([frame.mean() for frame in face_frames])

        # Determine reason based on score 
        if score > 100:  
            reason = "Detected artifact"
        else:
            reason = "No significant artifacts detected"

        return {"video_score": float(score), "reason": reason}
