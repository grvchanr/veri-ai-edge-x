import cv2
import numpy as np

def detect_deepfake_video(video_path):
    """
    Detects deepfakes in a video using a lightweight pipeline.

    Args:
        video_path (str): Path to the video file.

    Returns:
        dict: A dictionary containing the deepfake score and reason.
    """

    try:
        cap = cv2.VideoCapture(video_path)
        frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

        if not frames:
            return {"video_score": 0.0, "reason": "No frames extracted"}

        # Placeholder for face detection - replace with a real face detector
        # For now, we'll just process all frames
        face_frames = frames  # In a real implementation, this would be a subset of frames containing faces

        # Placeholder deepfake scoring - replace with MesoNet or other model
        score = np.mean([frame.mean() for frame in face_frames])

        # Determine reason based on score (adjust threshold as needed)
        if score > 100:  # Example threshold
            reason = "Detected artifact"
        else:
            reason = "No significant artifacts detected"

        return {"video_score": float(score), "reason": reason}

    except Exception as e:
        print(f"Error processing video: {e}")
        return {"video_score": 0.0, "reason": f"Error processing video: {e}"}
