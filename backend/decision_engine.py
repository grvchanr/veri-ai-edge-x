from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class Decision:
    """Decision result container."""
    label: str
    confidence: float

    def to_dict(self) -> Dict[str, Any]:
        return {"label": self.label, "confidence": self.confidence}

class DecisionAgent:
    """Makes final decisions based on fused scores."""

    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        self.thresholds = thresholds or {"safe": 0.3, "suspicious": 0.7}

    def decide(self, fused_score: float) -> Decision:
        if fused_score >= self.thresholds["suspicious"]:
            return Decision("suspicious", fused_score)
        elif fused_score <= self.thresholds["safe"]:
            return Decision("safe", fused_score)
        else:
            return Decision("uncertain", fused_score)

    def update_thresholds(self, new_thresholds: Dict[str, float]):
        self.thresholds = new_thresholds

def decision_engine(confidence_score: float) -> Decision:
    agent = DecisionAgent()
    return agent.decide(confidence_score)
