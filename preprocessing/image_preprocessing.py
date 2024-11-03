import torch
from torchvision import transforms
from PIL import Image
import io
import base64
import numpy as np

class ImagePreprocessor:
    def __init__(self):
        pass

    def _resize_image(self, image, options):
        """Resize image to target size"""
        target_size = (
            int(options.get('resize_width', 224)),
            int(options.get('resize_height', 224))
        )
        resize_transform = transforms.Resize(target_size)
        return resize_transform(image)

    def _normalize_image(self, image):
        """Normalize image using ImageNet statistics"""
        to_tensor = transforms.ToTensor()
        normalize = transforms.Normalize(
            mean=[0.48, 0.45, 0.406],
            std=[0.229, 0.224, 0.225]
        )
        processed_tensor = normalize(to_tensor(image))
        
        # Convert back to PIL Image for display
        to_pil = transforms.ToPILImage()
        return to_pil(processed_tensor)

    def _convert_grayscale(self, image):
        """Convert image to grayscale"""
        grayscale_transform = transforms.Grayscale(num_output_channels=3)
        return grayscale_transform(image)

    def _apply_blur(self, image, kernel_size):
        """Apply Gaussian blur to image"""
        blur_transform = transforms.GaussianBlur(kernel_size)
        return blur_transform(image)

    def _image_to_base64(self, image):
        """Convert PIL Image to base64 string"""
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"

    def preprocess(self, image_data, options):
        """Preprocess the image with selected options"""
        steps = {}
        
        # Convert base64 to PIL Image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        processed_image = image

        # Resize
        if options.get('resize'):
            processed_image = self._resize_image(processed_image, options)
            steps['Resize'] = self._image_to_base64(processed_image)

        # Normalize
        if options.get('normalize'):
            processed_image = self._normalize_image(processed_image)
            steps['Normalize'] = self._image_to_base64(processed_image)

        # Grayscale
        if options.get('grayscale'):
            processed_image = self._convert_grayscale(processed_image)
            steps['Grayscale'] = self._image_to_base64(processed_image)

        # Blur
        if options.get('blur'):
            kernel_size = int(options.get('blur_kernel', 3))
            processed_image = self._apply_blur(processed_image, kernel_size)
            steps['Blur'] = self._image_to_base64(processed_image)

        return {
            'preprocessing_steps': steps,
            'processed_image': self._image_to_base64(processed_image)
        }