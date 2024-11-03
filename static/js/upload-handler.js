class FileUploadHandler {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.fileNameDisplay = document.getElementById('file-name');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

        // Handle file input change
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files && this.fileInput.files[0]) {
                this.fileNameDisplay.textContent = this.fileInput.files[0].name;
                this.uploadFile();
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight() {
        this.dropZone.classList.add('dragover');
    }

    unhighlight() {
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files[0]) {
            this.fileInput.files = files;
            this.fileNameDisplay.textContent = files[0].name;
            this.uploadFile();
        }
    }

    async uploadFile() {
        const formData = new FormData();
        
        if (!this.fileInput.files || !this.fileInput.files[0]) {
            console.log('No file selected');
            return;
        }

        formData.append('file', this.fileInput.files[0]);

        try {
            console.log('Uploading file...');
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Upload response:', result);
            
            if (result.data) {
                DataManager.setCurrentData(result.data);
                DataManager.setOriginalText(result.data);
                document.getElementById('process-section').style.display = 'block';
                DisplayManager.displayRawData(result.data);
                console.log('File uploaded successfully:', result.data);
            } else {
                throw new Error('No data received from server');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading file: ' + error.message);
        }
    }
} 