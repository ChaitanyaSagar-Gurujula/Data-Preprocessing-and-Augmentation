class TabManager {
    static initialize() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Hide all upload and process sections
                document.getElementById('drop-zone').style.display = 'none';
                document.getElementById('image-drop-zone').style.display = 'none';
                document.getElementById('audio-drop-zone').style.display = 'none';
                document.getElementById('process-section').style.display = 'none';
                document.getElementById('image-process-section').style.display = 'none';
                document.getElementById('audio-process-section').style.display = 'none';

                // Show the appropriate sections based on the selected tab
                const selectedTab = button.getAttribute('data-type');
                switch(selectedTab) {
                    case 'text':
                        document.getElementById('drop-zone').style.display = 'block';
                        if (DataManager.getOriginalText()) {
                            document.getElementById('process-section').style.display = 'block';
                        }
                        break;
                    case 'image':
                        document.getElementById('image-drop-zone').style.display = 'block';
                        if (DataManager.getOriginalImage()) {
                            document.getElementById('image-process-section').style.display = 'block';
                        }
                        break;
                    case 'audio':
                        document.getElementById('audio-drop-zone').style.display = 'block';
                        if (DataManager.getOriginalAudio()) {
                            document.getElementById('audio-process-section').style.display = 'block';
                        }
                        break;
                }
            });
        });

        // Set text tab as default active tab
        const textTab = document.querySelector('[data-type="text"]');
        if (textTab) {
            textTab.click();
        }
    }

    static switchTab(type) {
        // Hide all sections first
        document.getElementById('process-section').style.display = 'none';
        document.getElementById('image-process-section').style.display = 'none';
        document.getElementById('audio-process-section').style.display = 'none';
        
        // Clear the data container
        document.getElementById('data-container').innerHTML = '';

        // Show the selected section
        if (type === 'text') {
            document.getElementById('process-section').style.display = 'block';
        } else if (type === 'image') {
            document.getElementById('image-process-section').style.display = 'block';
        } else if (type === 'audio') {
            document.getElementById('audio-process-section').style.display = 'block';
        }

        // Update tab button states
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.type === type) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
} 