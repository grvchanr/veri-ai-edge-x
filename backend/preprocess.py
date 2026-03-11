import cv2
import os
import tempfile

def extract_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % 10 == 0:  # Extract every 10 frames
            _, buffer = cv2.imencode('.jpg', frame)
            frames.append(buffer)
        frame_count += 1
    cap.release()
    return frames

def preprocess_video(file):
    temp_path = tempfile.mkstemp(suffix=".mp4")[1]
    with open(file.file, "rb") as f:
        with open(temp_path, "wb") as f_out:
            f_out.write(f.read())
    return temp_path, extract_frames(temp_path)

def preprocess_text(file):
    temp_path = tempfile.mkstemp(suffix=".txt")[1]
    with open(file.file, "rb") as f:
        with open(temp_path, "wb") as f_out:<｜begin▁of▁sentence｜>:
            f_out.write(f.read())
    return temp_path
