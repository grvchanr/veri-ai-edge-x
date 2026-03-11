def explainability(fusion_result, data_type, data):
    """
    Provides an explanation based on the fusion result and data type.

    Args:
        fusion_result (float): The fusion result (confidence score).
        data_type (str): The type of data being analyzed ("video" or "text").
        data (any): The original data (video frames or text tokens).

    Returns:
        dict: An explanation of the confidence level, including specific details.
    """
    if fusion_result > 0.9:
        explanation = "Very high confidence that the content is authentic."
    elif fusion_result > 0.7:
        explanation = "High confidence that the content is authentic."
    elif fusion_result > 0.5:
        explanation = "Moderate confidence that the content is authentic. Further investigation may be needed."
    elif fusion_result > 0.3:
        explanation = "Low confidence that the content is authentic. Potential signs of manipulation are present."
    else:
        explanation = "Very low confidence that the content is authentic. Strong indications of manipulation."

    if data_type == "video":
        # Placeholder for suspicious frame indices
        suspicious_frames = [10, 25, 42]  # Example frame indices
        return {"explanation": explanation, "suspicious_frames": suspicious_frames}
    elif data_type == "text":
        # Placeholder for suspicious tokens
        suspicious_tokens = ["manipulated", "fabricated", "unverified"]  # Example tokens
        return {"explanation": explanation, "suspicious_tokens": suspicious_tokens}
    else:
        return {"explanation": explanation, "details": "Unsupported data type"}
