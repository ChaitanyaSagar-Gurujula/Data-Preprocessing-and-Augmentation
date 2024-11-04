class AudioDisplayManager {
    static displayPreprocessedAudio(result) {
        const container = document.getElementById('data-container');
        
        const splitView = `
            <div class="split-view">
                <div class="original-panel">
                    <div class="panel-title">Original Audio</div>
                    <div class="panel-content">
                        <audio controls>
                            <source src="${DataManager.getOriginalAudio()}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
                <div class="processed-panel">
                    <div class="panel-title">Preprocessing Results</div>
                    <div class="preprocessing-steps">
                        ${this.createPreprocessingStepsHtml(result)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = splitView;
    }

    static displayAugmentedAudio(result) {
        const container = document.getElementById('data-container');
        
        const splitView = `
            <div class="split-view">
                <div class="original-panel">
                    <div class="panel-title">Original Audio</div>
                    <div class="panel-content">
                        <audio controls>
                            <source src="${DataManager.getOriginalAudio()}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
                <div class="processed-panel">
                    <div class="panel-title">Augmentation Results</div>
                    <div class="augmentation-steps">
                        ${this.createAugmentationStepsHtml(result)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = splitView;
    }

    static createPreprocessingStepsHtml(result) {
        let html = '';
        const stepOrder = [
            'Resample',
            'Normalize', 
            'Noise Reduction',
            'MFCC'
        ];
        
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

        if (result.processed_audio) {
            html += `
                <div class="preprocessing-step">
                    <h3 style="text-align: left;">Final Result</h3>
                    <audio controls>
                        <source src="${result.processed_audio}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }

        return html;
    }

    static createAugmentationStepsHtml(result) {
        let html = '';
        const stepOrder = [
            'Time Stretch',
            'Pitch Shift',
            'Noise',
            'Time Mask',
            'Frequency Mask'
        ];
        
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

        if (result.augmented_audio) {
            html += `
                <div class="augmentation-step">
                    <h3 style="text-align: left;">Final Result</h3>
                    <audio controls>
                        <source src="${result.augmented_audio}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }

        return html;
    }

    static displayOriginalAudio(audioData) {
        const container = document.getElementById('data-container');
        
        const splitView = `
            <div class="split-view">
                <div class="original-panel">
                    <div class="panel-title">Original Audio</div>
                    <div class="panel-content">
                        <audio controls>
                            <source src="${audioData}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = splitView;
    }
} 