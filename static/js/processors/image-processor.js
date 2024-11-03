class ImageProcessor {
    static async preprocess() {
        const imageData = DataManager.getOriginalImage();
        if (!imageData) {
            console.log('No image available');
            return;
        }

        const options = {
            resize: document.getElementById('resize')?.checked || false,
            resize_width: document.getElementById('resize-width')?.value,
            resize_height: document.getElementById('resize-height')?.value,
            normalize: document.getElementById('normalize')?.checked || false,
            grayscale: document.getElementById('grayscale')?.checked || false,
            blur: document.getElementById('blur')?.checked || false,
            blur_kernel: document.getElementById('blur-kernel')?.value
        };

        try {
            const response = await fetch('/preprocess-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            ImageDisplayManager.displayPreprocessedImage(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error preprocessing image: ' + error.message);
        }
    }

    static async augment() {
        const imageData = DataManager.getOriginalImage();
        if (!imageData) {
            console.log('No image available');
            return;
        }

        const options = {
            rotation: {
                enabled: document.getElementById('rotation')?.checked || false,
                angle: document.getElementById('rotation-angle')?.value
            },
            flip: {
                enabled: document.getElementById('flip')?.checked || false,
                direction: document.getElementById('flip-direction')?.value
            },
            brightness: {
                enabled: document.getElementById('brightness')?.checked || false,
                factor: document.getElementById('brightness-factor')?.value
            },
            noise: {
                enabled: document.getElementById('noise')?.checked || false,
                level: document.getElementById('noise-level')?.value
            }
        };

        try {
            const response = await fetch('/augment-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            ImageDisplayManager.displayAugmentedImage(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error augmenting image: ' + error.message);
        }
    }
} 