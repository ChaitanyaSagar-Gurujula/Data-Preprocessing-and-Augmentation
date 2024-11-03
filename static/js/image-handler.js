class ImageHandler {
    static initialize() {
        const imageDropZone = document.getElementById('image-drop-zone');
        const imageFileInput = document.getElementById('image-file-input');
        const imageFileName = document.getElementById('image-file-name');
        const imageProcessSection = document.getElementById('image-process-section');

        // Handle drag and drop
        imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageDropZone.classList.add('dragover');
        });

        imageDropZone.addEventListener('dragleave', () => {
            imageDropZone.classList.remove('dragover');
        });

        imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            imageDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                ImageHandler.handleImageUpload(file);
            }
        });

        // Handle file input change
        imageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                ImageHandler.handleImageUpload(file);
            }
        });
    }

    static async handleImageUpload(file) {
        const imageFileName = document.getElementById('image-file-name');
        const imageProcessSection = document.getElementById('image-process-section');
        imageFileName.textContent = file.name;

        // Convert image to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result;
            // Store the image data
            DataManager.setOriginalImage(base64Image);
            // Show the process section
            imageProcessSection.style.display = 'block';
            // Display the original image using ImageDisplayManager
            ImageDisplayManager.displayOriginalImage(base64Image);
        };
        reader.readAsDataURL(file);
    }
} 