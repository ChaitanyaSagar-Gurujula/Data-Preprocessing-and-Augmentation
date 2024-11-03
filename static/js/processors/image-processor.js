class ImageProcessor {
    static async preprocess() {
        try {
            const options = {
                resize: document.getElementById('resize').checked,
                resize_width: document.getElementById('resize-width').value,
                resize_height: document.getElementById('resize-height').value,
                normalize: document.getElementById('normalize').checked,
                grayscale: document.getElementById('grayscale').checked,
                crop: document.getElementById('crop').checked
            };

            const currentData = DataManager.getCurrentData();
            if (!currentData) {
                alert('Please upload an image first');
                return;
            }

            const response = await fetch('/preprocess_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: currentData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            DisplayManager.displayPreprocessedData(result);
            console.log('Preprocessing complete:', result);

        } catch (error) {
            console.error('Error during preprocessing:', error);
            alert('Error during preprocessing: ' + error.message);
        }
    }

    static async augment() {
        try {
            const options = {
                rotate: {
                    enabled: document.getElementById('rotate').checked,
                    degree: document.getElementById('rotation-degree').value
                },
                flip: document.getElementById('flip').checked,
                brightness: {
                    enabled: document.getElementById('brightness').checked,
                    factor: document.getElementById('brightness-factor').value
                },
                contrast: {
                    enabled: document.getElementById('contrast').checked,
                    factor: document.getElementById('contrast-factor').value
                }
            };

            const currentData = DataManager.getCurrentData();
            if (!currentData) {
                alert('Please upload an image first');
                return;
            }

            const response = await fetch('/augment_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: currentData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            DisplayManager.displayAugmentedData(result);
            console.log('Augmentation complete:', result);

        } catch (error) {
            console.error('Error during augmentation:', error);
            alert('Error during augmentation: ' + error.message);
        }
    }
} 