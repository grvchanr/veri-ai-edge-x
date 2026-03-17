import numpy as np
import mediapipe as mp
mp_face_detection = mp.solutions.face_detection
import cv2
import logging
import collections
from backend.frame_classifier import FrameClassifier

logger = logging.getLogger(__name__)

class VideoDeepfakeDetector:
    def __init__(self):
        self.mp_face_detection = mp_face_detection
        self.face_detector = self.mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )

        self.classifier = FrameClassifier()
        self.smoothing_window = collections.deque(maxlen=16)

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

        expand_w = int(box_w * 1.35)
        expand_h = int(box_h * 1.35)
        
        dx = (expand_w - box_w) // 2
        dy = (expand_h - box_h) // 2

        x1 = max(0, x - dx)
        y1 = max(0, y - dy)
        x2 = min(w, x + box_w + dx)
        y2 = min(h, y + box_h + dy)

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
                coords = self._get_box_coords(frame, detection)
                faces.append({"bbox": list(coords), "score": float(score)})

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

        logger.info("Step 2/4: Detecting faces and classifying sampled frames")

        all_scores = []
        all_faces = []

        if frames:
            # Aggregate over 40 frames as requested
            num_samples = min(40, len(frames))
            indices = np.linspace(0, len(frames) - 1, num_samples, dtype=int)
            sampled_frames = [frames[i] for i in indices]

            for frame in sampled_frames:
                result = self.classify_frame(frame)
                all_scores.append(result["score"])
                all_faces.extend(result["faces"])

        if all_scores:
            mean_score = float(np.mean(all_scores))
            median_score = float(np.median(all_scores))
            std_score = float(np.std(all_scores))
            final_score = 0.6 * median_score + 0.4 * mean_score
        else:
            mean_score = 0.5
            median_score = 0.5
            std_score = 0.0
            final_score = 0.5

        frames_analyzed = len(frames)

        logger.info(f"Aggregate Deepfake Scores - Mean: {mean_score:.4f}, Median: {median_score:.4f}, Weighted: {final_score:.4f}")
        logger.info("Step 4/4: Aggregating results")

        return {
            "video_score": final_score,
            "mean_fake_probability": mean_score,
            "median_fake_probability": median_score,
            "std_fake_probability": std_score,
            "frame_scores": all_scores,
            "reason": "Temporal facial artifact analysis with EfficientNet-B7 + MediaPipe",
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

            result = self.classify_frame(frame)
            score = result["score"]
            faces = result["faces"]

            # Temporal smoothing
            if faces:
                self.smoothing_window.append(score)
            
            # Using weighted median/mean for live decision
            if self.smoothing_window:
                m_score = float(np.median(self.smoothing_window))
                mn_score = float(np.mean(self.smoothing_window))
                smoothed_score = 0.6 * m_score + 0.4 * mn_score
            else:
                smoothed_score = 0.5

            if display:
                for face in faces:
                    x, y, w, h = face["bbox"]
                    color = (0, 0, 255) if smoothed_score > 0.5 else (0, 255, 0)
                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                    label = (
                        f"Deepfake: {smoothed_score:.2f}"
                        if smoothed_score > 0.5
                        else f"Authentic: {1 - smoothed_score:.2f}"
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

                cv2.imshow("VERI-AI EDGE - Live Deepfake Detection", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

        cap.release()
        cv2.destroyAllWindows()

        if self.smoothing_window:
            mean_score = float(np.mean(self.smoothing_window))
            median_score = float(np.median(self.smoothing_window))
            std_score = float(np.std(self.smoothing_window))
            final_score = 0.6 * median_score + 0.4 * mean_score
        else:
            mean_score = 0.5
            median_score = 0.5
            std_score = 0.0
            final_score = 0.5

        logger.info(f"Live detection complete. Final weighted score: {final_score:.4f}")

        return {
            "webcam_score": final_score,
            "mean_fake_probability": mean_score,
            "median_fake_probability": median_score,
            "std_fake_probability": std_score,
            "frame_scores": list(self.smoothing_window),
            "reason": "Live webcam analysis with EfficientNet-B7",
            "frames_processed": len(self.smoothing_window),
        }

    def _get_box_coords(self, frame, detection):
        h, w = frame.shape[:2]
        box = detection.location_data.relative_bounding_box
        x = int(box.xmin * w)
        y = int(box.ymin * h)
        box_w = int(box.width * w)
        box_h = int(box.height * h)
        
        expand_w = int(box_w * 1.35)
        expand_h = int(box_h * 1.35)
        
        dx = (expand_w - box_w) // 2
        dy = (expand_h - box_h) // 2

        x1 = max(0, x - dx)
        y1 = max(0, y - dy)
        x2 = min(w, x + box_w + dx)
        y2 = min(h, y + box_h + dy)

        return x1, y1, x2 - x1, y2 - y1
