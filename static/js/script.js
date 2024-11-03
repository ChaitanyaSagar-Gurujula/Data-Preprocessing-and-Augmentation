let currentData = null;
let originalText = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('case-norm element:', document.getElementById('case-norm'));
    console.log('punct-removal element:', document.getElementById('punct-removal'));
    console.log('stopword-removal element:', document.getElementById('stopword-removal'));
    console.log('padding element:', document.getElementById('padding'));
});

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileNameDisplay.textContent = this.files[0].name;
            uploadFile();
        }
    });

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files[0]) {
            fileInput.files = files;
            fileNameDisplay.textContent = files[0].name;
            uploadFile();
        }
    }
});

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const formData = new FormData();
    
    if (!fileInput.files || !fileInput.files[0]) {
        console.log('No file selected');
        return;
    }

    formData.append('file', fileInput.files[0]);

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
            displayRawData(result.data);
            document.getElementById('process-section').style.display = 'block';
            currentData = result.data;
            originalText = result.data;
            console.log('File uploaded successfully:', result.data);
        } else {
            throw new Error('No data received from server');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file: ' + error.message);
    }
}

async function preprocessData() {
    if (!originalText) {
        console.log('No text available');
        return;
    }

    const options = {
        case_normalization: document.getElementById('case-norm')?.checked || false,
        punctuation_removal: document.getElementById('punct-removal')?.checked || false,
        stop_word_removal: document.getElementById('stopword-removal')?.checked || false,
        padding: document.getElementById('padding')?.checked || false,
        padding_length: parseInt(document.getElementById('padding-length')?.value || '20')
    };

    try {
        const response = await fetch('/preprocess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: originalText,
                options: options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayPreprocessedData(result);
    } catch (error) {
        console.error('Error:', error);
        alert('Error preprocessing data: ' + error.message);
    }
}

async function augmentData() {
    if (!originalText) {
        console.log('No text available');
        return;
    }

    const options = {
        synonym_replacement: {
            enabled: document.getElementById('synonym-replace')?.checked || false,
            n_words: parseInt(document.getElementById('synonym-n-words')?.value || '3')
        },
        mlm_replacement: {
            enabled: document.getElementById('mlm-replace')?.checked || false,
            n_words: parseInt(document.getElementById('mlm-n-words')?.value || '3')
        },
        random_insertion: {
            enabled: document.getElementById('random-insert')?.checked || false,
            n_words: parseInt(document.getElementById('random-insert-n-words')?.value || '3')
        },
        random_deletion: {
            enabled: document.getElementById('random-delete')?.checked || false,
            n_words: parseInt(document.getElementById('random-delete-n-words')?.value || '2')
        }
    };

    try {
        const response = await fetch('/augment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: originalText,
                options: options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayAugmentedData(result);
        console.log('Augmentation result:', result);
    } catch (error) {
        console.error('Error:', error);
        alert('Error augmenting data: ' + error.message);
    }
}

function displayRawData(data) {
    console.log('Displaying raw data:', data);
    const container = document.getElementById('data-container');
    
    // Create raw data section
    const rawDataHtml = `
        <div class="raw-data-container">
            <h3>Raw Text</h3>
            <div class="raw-text">${data}</div>
        </div>
    `;
    
    container.innerHTML = rawDataHtml;
}

function displayTableData(data) {
    const container = document.getElementById('data-container');
    if (data.length === 0) {
        container.innerHTML = 'No data to display';
        return;
    }
    
    const table = document.createElement('table');
    const headers = Object.keys(data[0]);
    
    // Create header row
    const headerRow = table.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    // Create data rows
    data.forEach(row => {
        const dataRow = table.insertRow();
        headers.forEach(header => {
            const cell = dataRow.insertCell();
            cell.textContent = row[header];
        });
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

function displayPreprocessedData(data) {
    console.log('Displaying preprocessed data:', data);
    const container = document.getElementById('data-container');
    
    const splitView = `
        <div class="split-view">
            <div class="original-panel">
                <div class="panel-title">Original Text</div>
                <div class="panel-content">${originalText}</div>
            </div>
            <div class="processed-panel">
                <div class="panel-title">Preprocessing Results</div>
                <div class="preprocessing-steps">
                    ${createPreprocessingStepsHtml(data)}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = splitView;
}

function createPreprocessingStepsHtml(data) {
    if (!data || Object.keys(data).length === 0) {
        return 'No preprocessing steps were applied';
    }
    
    // Function to generate HSL color with fixed saturation and lightness
    const generateColor = (index, totalTokens) => {
        const hue = (index * 137.508) % 360; // Use golden angle approximation
        return `hsl(${hue}, 75%, 95%)`; // High lightness for pastel colors
    };
    
    // Create a color mapping for unique tokens
    const tokenColorMap = new Map();
    const uniqueTokens = [...new Set(data.tokens)];
    uniqueTokens.forEach((token, index) => {
        tokenColorMap.set(token, generateColor(index, uniqueTokens.length));
    });

    // Special color for padding token
    tokenColorMap.set('<PAD>', '#f0f0f0');  // Light gray for padding
    
    let html = '';
    
    // Display preprocessing steps
    const stepOrder = [
        'Case Normalization',
        'Punctuation Removal',
        'Stop Word Removal',
        'Padding'
    ];
    
    if (data.preprocessing_steps) {
        html += stepOrder
            .filter(step => data.preprocessing_steps[step])
            .map((step, index, filteredSteps) => {
                const escapedValue = data.preprocessing_steps[step].replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                    <div class="preprocessing-step">
                        <h4 class="step-title">${step}</h4>
                        <div class="step-content">${escapedValue}</div>
                    </div>
                    ${index < filteredSteps.length - 1 ? '<div class="step-arrow"></div>' : ''}
                `;
            })
            .join('');
    }
    
    // Add arrow after the last preprocessing step
    if (data.preprocessing_steps && Object.keys(data.preprocessing_steps).length > 0) {
        html += '<div class="step-arrow">→</div>';
    }
    
    // Display tokens with their IDs and colors
    if (data.tokens && data.token_ids) {
        html += `
            <div class="preprocessing-step">
                <h4 class="step-title">Tokens and IDs</h4>
                <div class="step-content tokens-display">
                    ${data.tokens.map((token, index) => `
                        <span class="token" style="background-color: ${tokenColorMap.get(token)}">
                            <span class="token-text">${token.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                            <span class="token-id">${data.token_ids[index]}</span>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

function displayAugmentedData(data) {
    console.log('Displaying augmented data:', data);
    const container = document.getElementById('data-container');
    
    const splitView = `
        <div class="split-view">
            <div class="original-panel">
                <div class="panel-title">Original Text</div>
                <div class="panel-content">${originalText}</div>
            </div>
            <div class="processed-panel">
                <div class="panel-title">Augmentation Steps</div>
                <div class="augmentation-steps">
                    ${createAugmentationStepsHtml(data.augmentation_steps)}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = splitView;
}

function createAugmentationStepsHtml(steps) {
    if (!steps || Object.keys(steps).length === 0) {
        return 'No augmentation steps were applied';
    }
    
    const stepOrder = [
        'Synonym Replacement',
        'Word Replacement',
        'Random Insertion',
        'Random Deletion'
    ];
    
    return stepOrder
        .filter(stepName => steps[stepName])
        .map((stepName, index, filteredSteps) => {
            const data = steps[stepName];
            const highlightedText = highlightChanges(data.text, data.changes, stepName);
            
            return `
                <div class="augmentation-step">
                    <h4 class="step-title">${stepName}</h4>
                    <div class="step-content">${highlightedText}</div>
                    <div class="debug-info">
                        <div>Positions: ${JSON.stringify(data.changes.positions)}</div>
                        ${data.changes.old_words ? `<div>Old words: ${JSON.stringify(data.changes.old_words)}</div>` : ''}
                        ${data.changes.new_words ? `<div>New words: ${JSON.stringify(data.changes.new_words)}</div>` : ''}
                        ${data.changes.deleted_words ? `<div>Deleted words: ${JSON.stringify(data.changes.deleted_words)}</div>` : ''}
                    </div>
                </div>
                ${index < filteredSteps.length - 1 ? '<div class="step-arrow"></div>' : ''}
            `;
        })
        .join('');
}

function highlightChanges(text, changes, stepType) {
    console.log(`Highlighting ${stepType}:`, {text, changes});  // Debug log
    
    const words = text.split(' ');
    console.log('Words array:', words);  // Debug log
    
    // Create a map of positions to highlight
    const highlightMap = new Map();
    
    if (stepType === 'Random Deletion') {
        // For deletion, we don't highlight anything as words are removed
        return text;
    } 
    else if (stepType === 'Random Insertion') {
        // For insertions, we need to handle positions in order
        changes.positions.forEach((pos, idx) => {
            highlightMap.set(pos, {
                word: changes.new_words[idx],
                type: 'insert'
            });
        });
    }
    else {
        // For synonym and word replacement
        changes.positions.forEach((pos, idx) => {
            highlightMap.set(pos, {
                word: changes.new_words[idx],
                oldWord: changes.old_words[idx],
                type: 'replace'
            });
        });
    }
    
    console.log('Highlight map:', Object.fromEntries(highlightMap));  // Debug log
    
    // Build highlighted text
    const highlightedWords = words.map((word, index) => {
        const highlight = highlightMap.get(index);
        if (highlight) {
            console.log(`Highlighting word at position ${index}:`, {word, highlight});  // Debug log
            if (highlight.type === 'insert') {
                return `<mark class="highlight-insert" title="Inserted word: ${highlight.word}">${word}</mark>`;
            } else {
                return `<mark class="highlight-change" title="Changed from '${highlight.oldWord}'">${word}</mark>`;
            }
        }
        return word;
    });
    
    return highlightedWords.join(' ');
}

function displayFinalResult(container, text) {
    container.innerHTML = `
        <div class="final-result">
            <p>${text}</p>
        </div>
    `;
}

