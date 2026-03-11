def fusion_engine(video_score, text_score):
    """
    Multimodal fusion engine combining video and text scores using weighted fusion.
    
    Args:
        video_score (float): Score from video deepfake detection (0-1)
        text_score (float): Score from text deepfake detection (0-1)
    
    Returns:
        float: Fused final score (0-1)
    """
    # Weighted fusion - can be replaced with Dempster-Shafer in the future
    final_score = 0.7 * video_score + 0.3 * text_score
    return final_score
