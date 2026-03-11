def explainability(fusion_result):
    """
    Provides an explanation based on the fusion result.

    Args:
        fusion_result (float): The fusion result (confidence score).

    Returns:
        str: An explanation of the confidence level.
    """
    if fusion_result > 0.9:
        return "Very high confidence that the content is authentic."
    elif fusion_result > 0.7:
        return "High confidence that the content is authentic."
    elif fusion_result > 0.5:
        return "Moderate confidence that the content is authentic. Further investigation may be needed."
    elif fusion_result > 0.3:
        return "Low confidence that the content is authentic.  Potential signs of manipulation are present."
    else:
        return "Very low confidence that the content is authentic. Strong indications of manipulation."
