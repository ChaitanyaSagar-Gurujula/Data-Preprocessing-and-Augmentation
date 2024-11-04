class AudioDisplayManager {
    static displayOriginalAudio(audioData) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="audio-preview">
                <h3>Original Audio</h3>
                <audio controls>
                    <source src="${audioData}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }

    static displayPreprocessedAudio(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="preprocessing-steps">';
        
        // Define the order of preprocessing steps
        const stepOrder = [
            'Resample',
            'Normalize',
            'Noise Reduction',
            'MFCC'
        ];
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (result.preprocessing_steps[stepName]) {
                html += `
                    <div class="preprocessing-step">
                        <h3 style="text-align: left;">${stepName}</h3>
                        <audio controls>
                            <source src="${result.preprocessing_steps[stepName]}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Display final result
        html += `
            <div class="preprocessing-step">
                <h3 style="text-align: left;">Final Result</h3>
                <audio controls>
                    <source src="${result.processed_audio}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>`;

        container.innerHTML = html;
    }

    static displayAugmentedAudio(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="augmentation-steps">';
        
        // Define the order of augmentation steps
        const stepOrder = [
            'Time Stretch',
            'Pitch Shift',
            'Noise',
            'Time Mask',
            'Frequency Mask'
        ];
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (result.augmentation_steps[stepName]) {
                html += `
                    <div class="augmentation-step">
                        <h3 style="text-align: left;">${stepName}</h3>
                        <audio controls>
                            <source src="${result.augmentation_steps[stepName]}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Display final result
        html += `
            <div class="augmentation-step">
                <h3 style="text-align: left;">Final Result</h3>
                <audio controls>
                    <source src="${result.augmented_audio}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>`;

        container.innerHTML = html;
    }
} 