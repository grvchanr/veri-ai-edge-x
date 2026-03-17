import numpy as np
import torch
import timm
from PIL import Image
import cv2
import logging
import os
from torchvision import transforms
import huggingface_hub

logger = logging.getLogger(__name__)

class FrameClassifier:
    def __init__(self):
        logger.info("Loading EfficientNet-B7 model for deepfake detection...")
        
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")
            
        repo_id = "tomas-gajarsky/facetorch-deepfake-efficientnet-b7"
        try:
            logger.info(f"Downloading/loading JIT model from Hugging Face: {repo_id}")
            model_path = huggingface_hub.hf_hub_download(repo_id, "model.pt")
            
            # Map location ensures compatibility whether using MPS, CUDA, or CPU
            self.model = torch.jit.load(model_path, map_location=self.device)
            logger.info("Deepfake weights successfully loaded from Hugging Face cache!")
        except Exception as e:
            logger.warning(f"Failed to load weights: {e}")
            logger.info("Falling back to random weights (no deepfake detection capability).")
            self.model = timm.create_model("efficientnet_b7", pretrained=False, num_classes=1)
            self.model = self.model.to(self.device)
            
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        logger.info("EfficientNet model loaded successfully")

    def classify(self, frame: np.ndarray) -> float:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)

        input_tensor = self.transform(pil_image)
        input_tensor = input_tensor.unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(input_tensor)
            score = torch.sigmoid(output).item()
            
            logger.info(f"--- DEBUG: FRAME CLASSIFIER ---")
            logger.info(f"Raw Model Output (Logits): {output.tolist()}")
            logger.info(f"Sigmoid Output (Score): {score}")

        return score
