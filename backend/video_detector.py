import numpy as np
import mediapipe as mp
import cv2
from mediapipe.python.solutions import face_detection as mp_face_detection

class VideoDeepfakeDetector:

    def  __init__(self):
        self.mp_face_detection = mp_face_detection
        self.face_detector = self.mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

    def detect_faces(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb)
        return results.detections

    def detect(self, video_path):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error opening video file")
            return 0.2  

        frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)

        cap.release()

        face_detected = False
        if frames:
            detections = self.detect_faces(frames[0])   
            if detections:
                face_detected = True

        if face_detected:
            score = 0.8   
        else:
            score = 0.2   

        return score
