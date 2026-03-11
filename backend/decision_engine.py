import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class Decision:
    """Decision result container."""
    label: str  # 'TRUST', 'CAUTION', 'REJECT'
    score: float
    confidence: float
    reasons: list

    def to_dict(self) -> Dict[str, Any]:
        return {
            'label': self.label,
            'score': float(self.score),
            'confidence': float(self.confidence),
            'reasons': self.reasons
        }

class DecisionAgent:
    """Makes final decisions based on fused scores."""
    
    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        """
        Initialize decision agent.
        
        Args:
            thresholds: Dictionary with 'TRUST', 'CAUTION', 'REJECT' thresholds.
        """
        self.thresholds = thresholds or {
            'TRUST': 0.8,
            'CAUTION': 0.5,
            'REJECT': 0.0
        }
        self._validate_thresholds()
        
    def _validate_thresholds(self):
        if not (self.thresholds['REJECT'] <= self.thresholds['CAUTION'] <= self.thresholds['TRUST']):
            raise ValueError("Thresholds must be ordered: REJECT <= CAUTION <= TRUST")
    
    def decide(self, fused_score: float, 
               individual_scores: Optional[Dict[str, float]] = None,
               confidence: float = 1.0) -> Decision:
        """
        Make decision based on fused score.
        
        Args:
            fused_score: Combined score from fusion engine (0-1).
            individual_scores: Optional individual modality scores.
            confidence: Confidence in the fused score (0-1).
            
        Returns:
            Decision object.
        """
        reasons = []
        
        if fused_score >= self.thresholds['TRUST']:
            label = 'TRUST'
            reasons.append(f"Score {fused_score:.3f} >= trust threshold {self.thresholds['TRUST']:.3f}")
        elif fused_score >= self.thresholds['CAUTION']:
            label = 'CAUTION'
            reasons.append(f"Score {fused_score:.3f} >= caution threshold {self.thresholds['CAUTION']:.3f}")
            reasons.append(f"Score {fused_score:.3f} < trust threshold {self.thresholds['TRUST']:.3f}")
        else:
            label = 'REJECT'
            reasons.append(f"Score {fused_score:.3f} < caution threshold {self.thresholds['CAUTION']:.3f}")
        
        if individual_scores:
            for modality, score in individual_scores.items():
                if score > 0.7:
                    reasons.append(f"{modality} score high: {score:.3f}")
                elif score < 0.3:
                    reasons.append(f"{modality} score low: {score:.3f}")
        
        # Adjust confidence for CAUTION zone
        if label == 'CAUTION':
            band_size = self.thresholds['TRUST'] - self.thresholds['CAUTION']
            if band_size > 0:
                position = (fused_score - self.thresholds['CAUTION']) / band_size
                confidence = confidence * (0.7 + 0.3 * position)
        
        return Decision(
            label=label,
            score=float(fused_score),
            confidence=float(confidence),
            reasons=reasons
        )
    
    def update_thresholds(self, new_thresholds: Dict[str, float]):
        """Update decision thresholds."""
        self.thresholds.update(new_thresholds)
        self._validate_thresholds()
        logger.info(f"Updated decision thresholds: {self.thresholds}")

# Global default agent for backward compatibility
_default_agent = DecisionAgent()

def decision_engine(confidence_score: float) -> str:
    """
    Simple function interface for decision making.
    Returns just the label string for backward compatibility.
    """
    decision = _default_agent.decide(confidence_score)
    return decision.label
