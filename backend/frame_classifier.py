import numpy as np
import torch
import timm
from PIL import Image
import cv2
import logging

logger = logging.getLogger(__name__)


class FrameClassifier:
    def __init__(self):
        logger.info("Loading EfficientNet-B0 model...")
        self.model = timm.create_model(
            "efficientnet_b0", pretrained=True, num_classes=0
        )
        in_features = self.model.num_features
        self.model.classifier = torch.nn.Linear(in_features, 1)
        self.model.eval()

        self.transform = timm.data.create_transform(
            input_size=(224, 224),
            interpolation="bilinear",
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
            crop_pct=0.875,
        )
        logger.info("EfficientNet-B0 model loaded successfully")

    def classify(self, frame: np.ndarray) -> float:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)

        input_tensor = self.transform(pil_image).unsqueeze(0)

        with torch.no_grad():
            output = self.model(input_tensor)
            score = torch.sigmoid(output).item()

        return score
