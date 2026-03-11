def decision_engine(fusion_result):
    # Placeholder decision logic
    if fusion_result > 0.7:
        return "TRUST"
    elif fusion_result > 0.3:
        return "CAUTION"
    else:
        return "REJECT"
