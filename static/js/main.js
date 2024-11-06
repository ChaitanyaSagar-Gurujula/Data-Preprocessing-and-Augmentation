document.addEventListener('DOMContentLoaded', () => {
    // Initialize the file upload handler
    const uploadHandler = new FileUploadHandler();
    
    // Add event listeners for processing buttons
    const preprocessBtn = document.querySelector('.preprocess-btn');
    const augmentBtn = document.querySelector('.augment-btn');
    
    if (preprocessBtn) {
        preprocessBtn.addEventListener('click', () => TextProcessor.preprocess());
    }
    
    if (augmentBtn) {
        augmentBtn.addEventListener('click', () => TextProcessor.augment());
    }
    
    // Initialize all components
    TabManager.initialize();
    ImageHandler.initialize();
    AudioHandler.initialize();
    ThreeDHandler.initialize();
});

// Define global functions for backward compatibility
window.preprocessData = () => TextProcessor.preprocess();
window.augmentData = () => TextProcessor.augment(); 

let currentDisplay = null;

async function switchView(viewType, data) {
    // Clean up previous view
    if (currentDisplay && currentDisplay.cleanup) {
        currentDisplay.cleanup();
    }

    // Initialize new view
    switch(viewType) {
        case 'original':
            currentDisplay = await ThreeDDisplayManager.displayOriginal3DModel(data);
            break;
        case 'preprocessed':
            currentDisplay = await ThreeDDisplayManager.displayPreprocessed3DModel(data);
            break;
        case 'augmented':
            currentDisplay = await ThreeDDisplayManager.displayAugmented3DModel(data);
            break;
    }
}

// Keep the handleFileUpload function
async function handleFileUpload(file) {
    const modelData = await loadModelData(file);
    await switchView('original', modelData);
}
