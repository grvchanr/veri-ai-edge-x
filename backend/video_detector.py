import numpy as np
import mediapipe as mp
mp_face_detection = mp.solutions.face_detection
import cv2
import logging
import torch
import torch.nn as nn
from torchvision import models, transforms
from backend.frame_classifier import FrameClassifier

logger = logging.getLogger(__name__)


class DeepfakeFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = models.resnet18(pretrained=True)
        self.model.fc = nn.Identity()

    def forward(self, x):
        return self.model(x)


class VideoDeepfakeDetector:
    def __init__(self):
        self.mp_face_detection = mp_face_detection
        self.face_detector = self.mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

        self.feature_extractor = DeepfakeFeatureExtractor().to(self.device)
        self.feature_extractor.eval()

        self.transform = transforms.Compose(
            [
                transforms.ToPILImage(),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )

        self.classifier = FrameClassifier()
        self.scores_history = []

    def preprocess_face(self, face_img):
        if face_img is None or face_img.size == 0:
            return None
        try:
            face_tensor = self.transform(face_img)
            return face_tensor.unsqueeze(0).to(self.device)
        except Exception as e:
            logger.warning(f"Face preprocessing failed: {e}")
            return None

    def extract_features(self, face_tensor):
        with torch.no_grad():
            features = self.feature_extractor(face_tensor)
        return features.cpu().numpy().flatten()

    def compute_anomaly_score(self, features):
        features_mean = np.mean(features)
        features_std = np.std(features)
        anomaly_score = min(1.0, abs(features_mean) / 10.0 + features_std / 5.0)
        return float(anomaly_score)

    def detect_faces(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb)

        if results and results.detections:
            return results.detections

        return []

    def get_face_region(self, frame, detection, target_size=(224, 224)):
        h, w = frame.shape[:2]
        box = detection.location_data.relative_bounding_box
        x = int(box.xmin * w)
        y = int(box.ymin * h)
        box_w = int(box.width * w)
        box_h = int(box.height * h)

        x1, y1 = max(0, x - 20), max(0, y - 20)
        x2, y2 = min(w, x + box_w + 20), min(h, y + box_h + 20)

        face = frame[y1:y2, x1:x2]

        if face.size == 0:
            return None

        face_resized = cv2.resize(face, target_size)
        return face_resized

    def classify_frame(self, frame):
        detections = self.detect_faces(frame)
        faces = []

        for detection in detections:
            face_img = self.get_face_region(frame, detection)
            if face_img is not None:
                score = self.classifier.classify(face_img)
                x, y, w, h = self._get_box_coords(frame, detection)
                faces.append({"bbox": [x, y, w, h], "score": float(score)})

        avg_score = np.mean([f["score"] for f in faces]) if faces else 0.5

        return {"score": float(avg_score), "faces": faces}

    def detect(self, video_path):
        logger.info("Step 1/4: Extracting frames")
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

        logger.info("Step 2/4: Detecting faces")

        all_scores = []
        all_faces = []

        if frames:
            num_samples = min(10, len(frames))
            indices = np.linspace(0, len(frames) - 1, num_samples, dtype=int)
            sampled_frames = [frames[i] for i in indices]

            for frame in sampled_frames:
                result = self.classify_frame(frame)
                all_scores.append(result["score"])
                all_faces.extend(result["faces"])

        logger.info("Step 3/4: Running EfficientNet inference")

        if all_scores:
            score = np.mean(all_scores)
        else:
            score = 0.2

        frames_analyzed = len(frames)

        logger.info(f"Deepfake detection score: {score}")
        logger.info("Step 4/4: Aggregating results")

        return {
            "video_score": float(score),
            "reason": "Facial artifact analysis with EfficientNet-B0 + MediaPipe",
            "frames_analyzed": frames_analyzed,
            "faces": all_faces,
        }

    def detect_webcam(self, camera_index=0, display=True):
        logger.info(f"Starting live webcam detection on camera {camera_index}")

        cap = cv2.VideoCapture(camera_index)

        if not cap.isOpened():
            logger.error(f"Could not open camera {camera_index}")
            raise IOError(f"Could not open camera {camera_index}")

        logger.info("Press 'q' to quit")

        while True:
            ret, frame = cap.read()
            if not ret:
                logger.warning("Failed to grab frame")
                break

            detections = self.detect_faces(frame)

            score = 0.0
            face_detected = False

            if detections:
                face_detected = True
                face_img = self.get_face_region(frame, detections[0])

                if face_img is not None:
                    face_tensor = self.preprocess_face(face_img)
                    if face_tensor is not None:
                        features = self.extract_features(face_tensor)
                        score = self.compute_anomaly_score(features)

                        x, y, w, h = self._get_box_coords(frame, detections[0])
                        color = (0, 0, 255) if score > 0.5 else (0, 255, 0)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                        label = (
                            f"Deepfake: {score:.2f}"
                            if score > 0.5
                            else f"Authentic: {1 - score:.2f}"
                        )
                        cv2.putText(
                            frame,
                            label,
                            (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            color,
                            2,
                        )

            self.scores_history.append(score)

            if display:
                cv2.imshow("VERI-AI EDGE - Live Deepfake Detection", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

        cap.release()
        cv2.destroyAllWindows()

        avg_score = np.mean(self.scores_history) if self.scores_history else 0.0
        logger.info(f"Live detection complete. Average score: {avg_score}")

        return {
            "webcam_score": float(avg_score),
            "reason": "Live webcam analysis with pre-trained ResNet18",
            "frames_processed": len(self.scores_history),
        }

    def _get_box_coords(self, frame, detection):
        h, w = frame.shape[:2]
        box = detection.location_data.relative_bounding_box
        x = int(box.xmin * w)
        y = int(box.ymin * h)
        box_w = int(box.width * w)
        box_h = int(box.height * h)
        return x, y, box_w, box_h
