import cv2
import numpy as np
import re

def extract_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % 10 == 0:
            frames.append(frame)
        frame_count += 1
    cap.release()
    return frames

def read_text(file_path):
    with open(file_path, 'r') as file:
        text = file.read().replace('\n', '')
        text = re.sub(r'\s+', ' ', text).strip()
        return text
