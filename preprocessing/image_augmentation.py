import torch
from torchvision import transforms
from PIL import Image
import io
import base64
import random
import numpy as np

class ImageAugmenter:
    def __init__(self):
        pass

    def rotate(self, image, angle):
        """Rotate image by given angle"""
        rotate_transform = transforms.RandomRotation(degrees=(angle, angle))
        return rotate_transform(image)

    def flip(self, image, direction):
        """Flip image horizontally or vertically"""
        if direction == 'horizontal':
            flip_transform = transforms.RandomHorizontalFlip(p=1.0)
        else:
            flip_transform = transforms.RandomVerticalFlip(p=1.0)
        return flip_transform(image)

    def adjust_brightness(self, image, factor):
        """Adjust image brightness"""
        brightness_transform = transforms.ColorJitter(brightness=factor)
        return brightness_transform(image)

    def add_noise(self, image, noise_level):
        """Add random noise to image"""
        # Convert to tensor
        to_tensor = transforms.ToTensor()
        image_tensor = to_tensor(image)
        
        # Add noise
        noise = torch.randn_like(image_tensor) * (noise_level/255.0)
        noisy_tensor = torch.clamp(image_tensor + noise, 0, 1)
        
        # Convert back to PIL Image
        to_pil = transforms.ToPILImage()
        return to_pil(noisy_tensor)

    def augment(self, image_data, options):
        """Apply selected augmentation techniques"""
        steps = {}
        
        # Convert base64 to PIL Image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        augmented_image = image

        if options.get('rotation', {}).get('enabled'):
            angle = float(options['rotation'].get('angle', 30))
            augmented_image = self.rotate(augmented_image, angle)
            steps['Rotation'] = self._image_to_base64(augmented_image)

        if options.get('flip', {}).get('enabled'):
            direction = options['flip'].get('direction', 'horizontal')
            augmented_image = self.flip(augmented_image, direction)
            steps['Flip'] = self._image_to_base64(augmented_image)

        if options.get('brightness', {}).get('enabled'):
            factor = float(options['brightness'].get('factor', 1.2))
            augmented_image = self.adjust_brightness(augmented_image, factor)
            steps['Brightness'] = self._image_to_base64(augmented_image)

        if options.get('noise', {}).get('enabled'):
            noise_level = float(options['noise'].get('level', 25))
            augmented_image = self.add_noise(augmented_image, noise_level)
            steps['Noise'] = self._image_to_base64(augmented_image)

        return {
            'augmentation_steps': steps,
            'augmented_image': self._image_to_base64(augmented_image)
        }

    def _image_to_base64(self, image):
        """Convert PIL Image to base64 string"""
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"