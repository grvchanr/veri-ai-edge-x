import logging
from typing import Dict, Any, List, Optional
import numpy as np
import cv2
import re

logger = logging.getLogger(__name__)

class VideoExplainer:
    """Generate explanations for video deepfake predictions."""
    
    def __init__(self):
        pass
    
    def generate_explanation(self, frames: np.ndarray, prediction_score: float) -> Dict[str, Any]:
        """
        Generate explanation for video.
        
        Args:
            frames: Video frames (1, T, H, W, 3) normalized [0,1].
            prediction_score: Model prediction score.
            
        Returns:
            Dictionary with explanation data.
        """
        # Placeholder: use temporal differences as suspicious regions
        if frames.ndim == 5:
            frames = frames[0]  # remove batch dim
        
        num_frames = frames.shape[0]
        heatmaps = []
        for i in range(num_frames):
            if i > 0:
                diff = np.abs(frames[i] - frames[i-1])
                heatmap = np.mean(diff, axis=-1)
            else:
                heatmap = np.zeros((frames.shape[1], frames.shape[2]))
            if heatmap.max() > 0:
                heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())
            heatmaps.append(heatmap.tolist())
        
        # Key frames: first, middle, last
        key_indices = [0, num_frames//2, num_frames-1] if num_frames >= 3 else list(range(num_frames))
        key_frames = []
        for idx in key_indices:
            if idx < num_frames:
                key_frames.append({
                    'frame_index': idx,
                    'heatmap': heatmaps[idx]
                })
        
        avg_intensity = float(np.mean([np.mean(h) for h in heatmaps])) if heatmaps else 0.0
        
        # Generate textual summary
        if prediction_score > 0.7:
            risk_level = "high risk"
        elif prediction_score > 0.4:
            risk_level = "moderate risk"
        else:
            risk_level = "low risk"
        text_summary = f"Video deepfake detection: {risk_level} (score: {prediction_score:.3f}). "
        if avg_intensity > 0.5:
            text_summary += "Significant temporal inconsistencies detected in frames."
        else:
            text_summary += "No major temporal anomalies detected."
        text_summary += f" Analyzed {num_frames} frames."
        
        return {
            'type': 'video',
            'prediction_score': float(prediction_score),
            'num_frames': num_frames,
            'key_frames': key_frames,
            'avg_heatmap_intensity': avg_intensity,
            'text_explanation': text_summary,
            'explanation_confidence': min(1.0, avg_intensity * 2)
        }

class TextExplainer:
    """Generate explanations for text phishing predictions."""
    
    def __init__(self, vocab: Optional[Dict[int, str]] = None):
        self.vocab = vocab or self._default_vocab()
        self.reverse_vocab = {v: k for k, v in self.vocab.items()}
    
    def _default_vocab(self) -> Dict[int, str]:
        # Minimal vocab for explainability
        vocab = {
            0: '<PAD>', 1: '<UNK>', 2: '<CLS>', 3: '<SEP>'
        }
        # Add common phishing words
        phishing_words = [
            'urgent', 'password', 'verify', 'account', 'suspended',
            'click', 'link', 'free', 'prize', 'win', 'limited',
            'offer', 'money', 'bank', 'login', 'security', 'update',
            'confirm', 'immediately', 'act', 'now', 'risk', 'blocked'
        ]
        for i, word in enumerate(phishing_words, start=4):
            vocab[i] = word
        return vocab
    
    def token_importance(self, token_ids: np.ndarray, prediction_score: float) -> List[Dict[str, Any]]:
        """Calculate token-level importance."""
        if token_ids.ndim == 2:
            tokens = token_ids[0]
        else:
            tokens = token_ids
        
        phishing_keywords = set(self.vocab.values()) - {'<PAD>', '<UNK>', '<CLS>', '<SEP>'}
        
        importance_list = []
        for pos, token_id in enumerate(tokens):
            if token_id == 0:  # PAD
                continue
            token = self.vocab.get(token_id, f'<UNK_{token_id}>')
            is_phishing = token.lower() in phishing_keywords
            # Simple importance: prediction_score * (2 if phishing else 1) * position decay
            importance = prediction_score * (2.0 if is_phishing else 1.0) * (1.0 / (1 + pos * 0.1))
            importance_list.append({
                'position': pos,
                'token_id': int(token_id),
                'token': token,
                'importance': float(importance),
                'is_phishing_keyword': is_phishing
            })
        
        importance_list.sort(key=lambda x: x['importance'], reverse=True)
        return importance_list
    
    def generate_explanation(self, token_ids: np.ndarray, prediction_score: float, 
                           original_text: Optional[str] = None) -> Dict[str, Any]:
        """Generate explanation for text."""
        token_importance = self.token_importance(token_ids, prediction_score)
        top_tokens = token_importance[:10]
        phishing_count = sum(1 for t in token_importance if t['is_phishing_keyword'])
        avg_importance = np.mean([t['importance'] for t in token_importance]) if token_importance else 0.0
        
        explanation_text = self._generate_text_explanation(top_tokens, prediction_score, original_text)
        
        return {
            'type': 'text',
            'prediction_score': float(prediction_score),
            'num_tokens': len([t for t in token_importance if t['token_id'] != 0]),
            'phishing_keyword_count': phishing_count,
            'avg_token_importance': float(avg_importance),
            'top_influential_tokens': top_tokens,
            'text_explanation': explanation_text,
            'explanation_confidence': min(1.0, phishing_count * 0.2 + avg_importance)
        }
    
    def _generate_text_explanation(self, top_tokens: List[Dict], score: float, 
                                 original_text: Optional[str]) -> str:
        if score > 0.7:
            base = "High phishing risk detected. "
        elif score > 0.4:
            base = "Moderate phishing risk detected. "
        else:
            base = "Low phishing risk detected. "
        
        if top_tokens:
            phishing_words = [t['token'] for t in top_tokens[:5] if t['is_phishing_keyword']]
            if phishing_words:
                base += f"Suspicious keywords: {', '.join(phishing_words)}. "
            base += f"Most influential token: '{top_tokens[0]['token']}' (importance: {top_tokens[0]['importance']:.3f})"
        
        if original_text:
            words = original_text.split()
            highlighted = []
            for word in words:
                clean = word.lower().strip('.,!?;:"\'')
                if any(t['token'].lower() == clean and t['is_phishing_keyword'] for t in top_tokens[:10]):
                    highlighted.append(f'**{word}**')
                else:
                    highlighted.append(word)
            base += f"\nOriginal text: {' '.join(highlighted)}"
        
        return base

def explainability(fusion_result: float, data_type: str = 'video', data: Any = None) -> Dict[str, Any]:
    """
    Unified explainability function.
    
    Args:
        fusion_result: The confidence score (0-1).
        data_type: 'video' or 'text'.
        data: The original data (video frames or token IDs or text string).
        
    Returns:
        Explanation dictionary.
    """
    if data_type == 'video':
        explainer = VideoExplainer()
        if data is None:
            return {"explanation": "No video data provided", "suspicious_frames": []}
        return explainer.generate_explanation(data, fusion_result)
    elif data_type == 'text':
        explainer = TextExplainer()
        if data is None:
            return {"explanation": "No text data provided", "suspicious_tokens": []}
        return explainer.generate_explanation(data, fusion_result)
    else:
        return {"explanation": f"Unsupported data type: {data_type}"}
