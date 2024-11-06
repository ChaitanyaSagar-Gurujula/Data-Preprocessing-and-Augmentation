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