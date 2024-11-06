class ThreeDHandler {
    static initialize() {
        const threeDDropZone = document.getElementById('3d-drop-zone');
        const threeDFileInput = document.getElementById('3d-file-input');
        const threeDFileName = document.getElementById('3d-file-name');
        const threeDProcessSection = document.getElementById('3d-process-section');

        // Handle drag and drop
        threeDDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            threeDDropZone.classList.add('dragover');
        });

        threeDDropZone.addEventListener('dragleave', () => {
            threeDDropZone.classList.remove('dragover');
        });

        threeDDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            threeDDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && ThreeDHandler.isValidFileType(file)) {
                ThreeDHandler.handle3DUpload(file);
            }
        });

        // Handle file input change
        threeDFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                ThreeDHandler.handle3DUpload(file);
            }
        });
    }

    static isValidFileType(file) {
        const validTypes = ['.obj', '.stl', '.ply', '.glb', '.gltf'];
        return validTypes.some(type => file.name.toLowerCase().endsWith(type));
    }

    static async handle3DUpload(file) {
        const threeDFileName = document.getElementById('3d-file-name');
        const threeDProcessSection = document.getElementById('3d-process-section');
        threeDFileName.textContent = file.name;

        // Read file based on its type
        const reader = new FileReader();
        if (file.name.toLowerCase().endsWith('.off')) {
            reader.readAsText(file); // Read OFF files as text
        } else {
            reader.readAsArrayBuffer(file); // Read other formats as binary
        }

        reader.onload = async (e) => {
            const modelData = e.target.result;
            // Store the 3D model data
            DataManager.setOriginal3DModel(modelData);
            // Display the original 3D model using ThreeDDisplayManager
            threeDProcessSection.style.display = 'block';
            ThreeDDisplayManager.displayOriginal3DModel(modelData);
        };
    }
} 