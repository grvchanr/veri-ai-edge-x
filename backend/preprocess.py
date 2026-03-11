import os
import cv2
import numpy as np
import tempfile
import logging
import re
from typing import Tuple, List, Dict, Any, Optional
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class VideoProcessor:
    """Efficient video preprocessing for edge devices."""
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224), 
                 max_frames: int = 16, 
                 target_fps: int = 5,
                 normalize: bool = True):
        self.target_size = target_size
        self.max_frames = max_frames
        self.target_fps = target_fps
        self.normalize = normalize
        
    def process(self, video_path: str) -> np.ndarray:
        """Process video file into model-ready tensor."""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video: {video_path}")
            
            original_fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if original_fps > 0:
                frame_interval = max(1, int(original_fps / self.target_fps))
            else:
                frame_interval = 1
            
            frames = []
            frame_count = 0
            sampled_count = 0
            
            while sampled_count < self.max_frames and frame_count < total_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_count % frame_interval == 0:
                    frame = cv2.resize(frame, self.target_size)
                    frames.append(frame)
                    sampled_count += 1
                frame_count += 1
            
            cap.release()
            
            # Pad if needed
            while len(frames) < self.max_frames:
                if frames:
                    frames.append(frames[-1])
                else:
                    blank = np.zeros((*self.target_size, 3), dtype=np.uint8)
                    frames.append(blank)
            
            frames_array = np.array(frames, dtype=np.float32)
            if self.normalize:
                frames_array = frames_array / 255.0
            
            # Add batch dimension
            if frames_array.ndim == 4:
                frames_array = np.expand_dims(frames_array, axis=0)
                
            logger.debug(f"Processed video: {video_path} -> shape {frames_array.shape}")
            return frames_array
            
        except Exception as e:
            logger.error(f"Video processing failed for {video_path}: {str(e)}")
            raise
    
    def process_bytes(self, video_bytes: bytes) -> np.ndarray:
        """Process video from bytes."""
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
        try:
            return self.process(tmp_path)
        finally:
            os.unlink(tmp_path)

class TextProcessor:
    """Lightweight text preprocessing for edge deployment."""
    
    def __init__(self, max_length: int = 128, vocab: Optional[Dict[str, int]] = None):
        self.max_length = max_length
        self.vocab = vocab or self._default_vocab()
        self.reverse_vocab = {v: k for k, v in self.vocab.items()}
    
    def _default_vocab(self) -> Dict[str, int]:
        vocab = {
            '<PAD>': 0,
            '<UNK>': 1,
            '<CLS>': 2,
            '<SEP>': 3
        }
        common_words = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'click', 'link', 'password', 'account', 'verify', 'urgent', 'free',
            'money', 'offer', 'win', 'prize', 'limited', 'time', 'act', 'now'
        ]
        for i, word in enumerate(common_words, start=4):
            vocab[word] = i
        return vocab
    
    def clean_text(self, text: str) -> str:
        """Basic text cleaning."""
        text = text.lower()
        text = re.sub(r'https?://\S+|www\.\S+', ' [URL] ', text)
        text = re.sub(r'\S*@\S*\s?', ' [EMAIL] ', text)
        text = re.sub(r'[^\w\s\.\!\?\,]', ' ', text)
        text = ' '.join(text.split())
        return text
    
    def tokenize(self, text: str) -> List[int]:
        """Convert text to token IDs."""
        cleaned = self.clean_text(text)
        words = cleaned.split()[:self.max_length - 2]
        tokens = ['<CLS>'] + words + ['<SEP>']
        ids = [self.vocab.get(token, self.vocab['<UNK>']) for token in tokens]
        while len(ids) < self.max_length:
            ids.append(self.vocab['<PAD>'])
        return ids[:self.max_length]
    
    def process(self, text: str) -> np.ndarray:
        """Process text into model-ready tensor."""
        try:
            token_ids = self.tokenize(text)
            return np.array([token_ids], dtype=np.int64)
        except Exception as e:
            logger.error(f"Text processing failed: {str(e)}")
            raise

# Backward compatibility functions for main.py
def preprocess_video(file: UploadFile) -> str:
    """
    Save uploaded video file to temporary path and return path.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
        content = file.file.read()
        tmp.write(content)
        tmp_path = tmp.name
    return tmp_path

def preprocess_text(file: UploadFile) -> str:
    """
    Save uploaded text file to temporary path and return path.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as tmp:
        content = file.file.read()
        tmp.write(content)
        tmp_path = tmp.name
    return tmp_path
