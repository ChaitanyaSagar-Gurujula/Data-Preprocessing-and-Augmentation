class TabManager {
    static initialize() {
        const tabs = document.querySelectorAll('.tab-button');
        const textDropZone = document.getElementById('drop-zone');
        const imageDropZone = document.getElementById('image-drop-zone');
        const textProcessSection = document.getElementById('process-section');
        const imageProcessSection = document.getElementById('image-process-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');

                // Show/hide appropriate sections
                if (tab.dataset.type === 'text') {
                    textDropZone.style.display = 'block';
                    imageDropZone.style.display = 'none';
                    textProcessSection.style.display = 'none';
                    imageProcessSection.style.display = 'none';
                } else {
                    textDropZone.style.display = 'none';
                    imageDropZone.style.display = 'block';
                    textProcessSection.style.display = 'none';
                    imageProcessSection.style.display = 'none';
                }

                // Clear the data container
                document.getElementById('data-container').innerHTML = '';
            });
        });
    }
} 