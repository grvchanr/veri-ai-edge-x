def explainability(fusion_result):
    # Placeholder explainability logic
    if fusion_result > 0.7:
        return "High confidence in the video being real."
    elif fusion_result > 0.3:
        return "Moderate confidence in the video being real."
    else:
        return "Low confidence in the video being real."
