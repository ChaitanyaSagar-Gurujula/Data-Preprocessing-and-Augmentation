class AudioHandler {
    static initialize() {
        const audioDropZone = document.getElementById('audio-drop-zone');
        const audioFileInput = document.getElementById('audio-file-input');
        const audioFileName = document.getElementById('audio-file-name');
        const audioProcessSection = document.getElementById('audio-process-section');

        // Handle drag and drop
        audioDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            audioDropZone.classList.add('dragover');
        });

        audioDropZone.addEventListener('dragleave', () => {
            audioDropZone.classList.remove('dragover');
        });

        audioDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            audioDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                AudioHandler.handleAudioUpload(file);
            }
        });

        // Handle file input change
        audioFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                AudioHandler.handleAudioUpload(file);
            }
        });
    }

    static async handleAudioUpload(file) {
        const audioFileName = document.getElementById('audio-file-name');
        const audioProcessSection = document.getElementById('audio-process-section');
        audioFileName.textContent = file.name;

        // Convert audio to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Audio = e.target.result;
            // Store the audio data
            DataManager.setOriginalAudio(base64Audio);
            // Show the process section
            audioProcessSection.style.display = 'block';
            // Display the original audio
            AudioDisplayManager.displayOriginalAudio(base64Audio);
        };
        reader.readAsDataURL(file);
    }
} 