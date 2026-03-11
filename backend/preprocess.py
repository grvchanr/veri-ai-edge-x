import os
import tempfile

def preprocess_video(file):
    temp_path = tempfile.mkstemp(suffix=".mp4")[1]
    with open(file.file, "rb") as f:
        with open(temp_path, "wb") as f_out:
            f_out.write(f.read())
    return temp_path

def preprocess_text(file):
    temp_path = tempfile.mkstemp(suffix=".txt")[1]
    with open(file.file, "rb") as f:
        with open(temp_path, "wb") as f_out:
            f_out.write(f.read())
    return temp_path
