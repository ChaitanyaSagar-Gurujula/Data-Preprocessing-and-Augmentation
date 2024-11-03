import cv2
import numpy as np
from PIL import Image
import io
import base64
import random

class ImageAugmenter:
    def __init__(self):
        pass

    def rotate(self, image, angle):
        """Rotate image by given angle"""
        height, width = image.shape[:2]
        center = (width // 2, height // 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(image, rotation_matrix, (width, height))

    def flip(self, image, direction):
        """Flip image horizontally or vertically"""
        return cv2.flip(image, direction)

    def adjust_brightness(self, image, factor):
        """Adjust image brightness"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv[:,:,2] = np.clip(hsv[:,:,2] * factor, 0, 255)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    def add_noise(self, image, noise_level):
        """Add random noise to image"""
        noise = np.random.normal(0, noise_level, image.shape)
        noisy_image = np.clip(image + noise, 0, 255).astype(np.uint8)
        return noisy_image

    def augment(self, image_data, options):
        """Apply selected augmentation techniques"""
        steps = {}
        
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        augmented_image = np.array(image)

        if options.get('rotation', {}).get('enabled'):
            angle = float(options['rotation'].get('angle', 30))
            augmented_image = self.rotate(augmented_image, angle)
            steps['Rotation'] = self._image_to_base64(augmented_image)

        if options.get('flip', {}).get('enabled'):
            direction = 1 if options['flip'].get('direction') == 'horizontal' else 0
            augmented_image = self.flip(augmented_image, direction)
            steps['Flip'] = self._image_to_base64(augmented_image)

        if options.get('brightness', {}).get('enabled'):
            factor = float(options['brightness'].get('factor', 1.2))
            augmented_image = self.adjust_brightness(augmented_image, factor)
            steps['Brightness Adjustment'] = self._image_to_base64(augmented_image)

        if options.get('noise', {}).get('enabled'):
            noise_level = float(options['noise'].get('level', 25))
            augmented_image = self.add_noise(augmented_image, noise_level)
            steps['Noise Addition'] = self._image_to_base64(augmented_image)

        return {
            'augmentation_steps': steps,
            'augmented_image': self._image_to_base64(augmented_image)
        }

    def _image_to_base64(self, image_array):
        """Convert numpy array to base64 string"""
        image = Image.fromarray(image_array)
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}" 