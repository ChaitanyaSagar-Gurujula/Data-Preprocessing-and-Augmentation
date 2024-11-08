class ImageDisplayManager {
    static displayOriginalImage(imageData) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="image-preview">
                <h3>Original Image</h3>
                <img src="${imageData}" alt="Original image" style="max-width: 100%; height: auto;">
            </div>
        `;
    }

    static displayPreprocessedImage(result) {
        const container = document.getElementById('data-container');
        let html = `
            <div class="split-view" style="display: flex; gap: 20px;">
                <div class="original-panel" style="flex: 1; position: sticky; top: 20px;">
                    <div class="panel-title">Original Image</div>
                    <img src="${DataManager.getOriginalImage()}" alt="Original image" style="max-width: 100%; height: auto;">
                </div>
                <div class="processed-panel" style="flex: 1;">
                    <div class="preprocessing-steps">`;
        
        // Define the order of preprocessing steps
        const stepOrder = [
            'Resize',
            'Normalize',
            'Grayscale',
            'Blur'
        ];
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (result.preprocessing_steps[stepName]) {
                html += `
                    <div class="preprocessing-step">
                        <div class="step-title">${stepName}</div>
                        <img src="${result.preprocessing_steps[stepName]}" alt="${stepName}" style="max-width: 100%; height: auto;">
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Display final result
        html += `
                        <div class="preprocessing-step">
                            <div class="step-title">Final Result</div>
                            <img src="${result.processed_image}" alt="Processed image" style="max-width: 100%; height: auto;">
                        </div>
                    </div>
                </div>
            </div>`;

        container.innerHTML = html;
    }

    static displayAugmentedImage(result) {
        const container = document.getElementById('data-container');
        let html = `
            <div class="split-view" style="display: flex; gap: 20px;">
                <div class="original-panel" style="flex: 1; position: sticky; top: 20px;">
                    <div class="panel-title">Original Image</div>
                    <img src="${DataManager.getOriginalImage()}" alt="Original image" style="max-width: 100%; height: auto;">
                </div>
                <div class="processed-panel" style="flex: 1;">
                    <div class="augmentation-steps">`;
        
        // Define the order of augmentation steps
        const stepOrder = [
            'Rotation',
            'Flip',
            'Brightness',
            'Noise'
        ];
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (result.augmentation_steps[stepName]) {
                html += `
                    <div class="augmentation-step">
                        <div class="step-title">${stepName}</div>
                        <img src="${result.augmentation_steps[stepName]}" alt="${stepName}" style="max-width: 100%; height: auto;">
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Display final result
        html += `
                        <div class="augmentation-step">
                            <div class="step-title">Final Result</div>
                            <img src="${result.augmented_image}" alt="Augmented image" style="max-width: 100%; height: auto;">
                        </div>
                    </div>
                </div>
            </div>`;

        container.innerHTML = html;
    }
} 