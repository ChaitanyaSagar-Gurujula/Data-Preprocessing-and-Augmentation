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
        let html = '<div class="preprocessing-steps">';
        
        // Display each preprocessing step
        for (const [step, imageData] of Object.entries(result.preprocessing_steps)) {
            html += `
                <div class="preprocessing-step">
                    <h3 style="text-align: left;">${step}</h3>
                    <img src="${imageData}" alt="${step}" style="max-width: 100%; height: auto;">
                </div>
                <div class="step-arrow">↓</div>
            `;
        }

        // Display final result
        html += `
            <div class="preprocessing-step">
                <h3 style="text-align: left;">Final Result</h3>
                <img src="${result.processed_image}" alt="Processed image" style="max-width: 100%; height: auto;">
            </div>
        </div>`;

        container.innerHTML = html;
    }

    static displayAugmentedImage(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="augmentation-steps">';
        
        // Display each augmentation step
        for (const [step, imageData] of Object.entries(result.augmentation_steps)) {
            html += `
                <div class="augmentation-step">
                    <h3 style="text-align: left;">${step}</h3>
                    <img src="${imageData}" alt="${step}" style="max-width: 100%; height: auto;">
                </div>
                <div class="step-arrow">↓</div>
            `;
        }

        // Display final result
        html += `
            <div class="augmentation-step">
                <h3 style="text-align: left;">Final Result</h3>
                <img src="${result.augmented_image}" alt="Augmented image" style="max-width: 100%; height: auto;">
            </div>
        </div>`;

        container.innerHTML = html;
    }
} 