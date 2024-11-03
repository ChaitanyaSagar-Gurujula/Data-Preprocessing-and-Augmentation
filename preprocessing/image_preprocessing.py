import cv2
import numpy as np
from PIL import Image
import io
import base64

class ImagePreprocessor:
    def __init__(self):
        pass

    def preprocess(self, image_data, options):
        """Preprocess the image with selected options"""
        steps = {}
        
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        processed_image = np.array(image)

        # Resize
        if options.get('resize'):
            target_size = (
                int(options.get('resize_width', 224)),
                int(options.get('resize_height', 224))
            )
            processed_image = cv2.resize(processed_image, target_size)
            steps['Resize'] = self._image_to_base64(processed_image)

        # Normalize
        if options.get('normalize'):
            processed_image = processed_image / 255.0
            processed_image = (processed_image * 255).astype(np.uint8)
            steps['Normalize'] = self._image_to_base64(processed_image)

        # Grayscale
        if options.get('grayscale'):
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_GRAY2BGR)
            steps['Grayscale'] = self._image_to_base64(processed_image)

        # Blur
        if options.get('blur'):
            kernel_size = int(options.get('blur_kernel', 3))
            processed_image = cv2.GaussianBlur(processed_image, (kernel_size, kernel_size), 0)
            steps['Blur'] = self._image_to_base64(processed_image)

        return {
            'preprocessing_steps': steps,
            'processed_image': self._image_to_base64(processed_image)
        }

    def _image_to_base64(self, image_array):
        """Convert numpy array to base64 string"""
        image = Image.fromarray(image_array)
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}" 