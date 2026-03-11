def decision_engine(confidence_score):
    if confidence_score > 0.9:
        decision = "TRUST"
    elif 0.7 <= confidence_score <= 0.9:
        decision = "CAUTION"
    else:
        decision = "REJECT"

    return {
        "decision": decision,
        "confidence": confidence_score
    }
