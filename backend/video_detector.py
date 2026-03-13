import numpy as np
import mediapipe as mp
import cv2
import logging
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

logger = logging.getLogger(__name__)

class MesoNet(nn.Module):
    def __init__(self):
        super(MesoNet, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)

        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)

        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.relu3 = nn.ReLU()
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)

        self.fc1 = nn.Linear(128 * 8 * 8, 256)  # Adjusted for smaller input size
        self.relu4 = nn.ReLU()
        self.fc2 = nn.Linear(256, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu1(self.bn1(self.conv1(x)))
        x = self.pool1(x)
        x = self.relu2(self.bn2(self.conv2(x)))
        x = self.pool2(x)
        x = self.relu3(self.bn3(self.conv3(x)))
        x = self.pool3(x)
        x = x.view(-1, 128 * 8 * 8)
        x = self.relu4(self.fc1(x))
        x = self.sigmoid(self.fc2(x))
        return x


class VideoDeepfakeDetector:

    def  __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detector = self.mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        self.device = torch.device("cpu")
        self.model = MesoNet().to(self.device)
        try:
            self.model.load_state_dict(torch.load("mesonet_weights.pth", map_location=self.device))
            self.model.eval()
        except FileNotFoundError:
            logger.warning("MesoNet weights file not found.  Using random initialization.")
        except Exception as e:
            logger.error(f"Error loading MesoNet weights: {e}")

    def detect_faces(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb)
        return results.detections

    def crop_face(self, frame, detection):
        h, w, c = frame.shape
        box = detection.location_data.relative_bounding_box
        x1, y1, x2, y2 = int(box.xmin * w), int(box.ymin * h), int(box.xmax * w), int(box.ymax * h)
        face = frame[y1:y2, x1:x2]
        return face

    def preprocess_face(self, face):
        try:
            face = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))
            face = face.resize((64, 64))
            face = np.array(face)
            face = face.transpose((2, 0, 1))  # HWC to CHW
            face = torch.from_numpy(face).float().unsqueeze(0).to(self.device)
            face = face / 255.0  # Normalize
            return face
        except Exception as e:
            logger.error(f"Error preprocessing face: {e}")
            return None

    def detect(self, video_path):
        logger.info(f"Detecting deepfakes in video: {video_path}")
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Error opening video file: {video_path}")
            raise IOError(f"Could not open video file: {video_path}")

        frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)

        cap.release()

        scores = []
        for frame in frames:
            detections = self.detect_faces(frame)
            if detections:
                for detection in detections:
                    face = self.crop_face(frame, detection)
                    if face is not None:
                        face_tensor = self.preprocess_face(face)
                        if face_tensor is not None:
                            with torch.no_grad():
                                score = self.model(face_tensor).item()
                                scores.append(score)

        if scores:
            video_score = np.mean(scores)
        else:
            video_score = 0.2  # Default if no faces detected

        frames_analyzed = len(frames)

        logger.info(f"Deepfake detection score: {video_score}")
        return {
            "video_score": float(video_score),
            "reason": "Facial artifact analysis complete",
            "frames_analyzed": frames_analyzed
        }
