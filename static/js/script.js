let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('case-norm element:', document.getElementById('case-norm'));
    console.log('punct-removal element:', document.getElementById('punct-removal'));
    console.log('stopword-removal element:', document.getElementById('stopword-removal'));
    console.log('padding element:', document.getElementById('padding'));
});

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            displayRawData(result.data);
            document.getElementById('process-section').style.display = 'block';
            currentData = result.data;
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function preprocessData() {
    if (!currentData) {
        console.log('No current data available');
        return;
    }

    // Add error checking for each checkbox
    const options = {
        case_normalization: document.getElementById('case-norm')?.checked || false,
        punctuation_removal: document.getElementById('punct-removal')?.checked || false,
        stopword_removal: document.getElementById('stopword-removal')?.checked || false,
        lemmatization: document.getElementById('lemmatization')?.checked || false,
        stemming: document.getElementById('stemming')?.checked || false,
        padding: document.getElementById('padding')?.checked || false
    };

    console.log('Selected options:', options);  // Add this for debugging

    try {
        console.log('Sending data for preprocessing:', currentData);
        const response = await fetch('/preprocess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: currentData,
                options: options
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Received preprocessed data:', result);
        console.log('Preprocessing steps:', result.preprocessing_steps);
        
        displayPreprocessedData(result);
        currentData = result;
    } catch (error) {
        console.error('Error in preprocessing:', error);
        alert('Error preprocessing data: ' + error.message);
    }
}

async function augmentData() {
    if (!currentData) return;

    try {
        const response = await fetch('/augment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: currentData }),
        });
        const result = await response.json();
        if (response.ok) {
            displayTableData(result.data);
            currentData = result.data;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayRawData(data) {
    document.getElementById('data-container').innerText = data;
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
    
    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    // Create tab buttons
    const tabButtons = document.createElement('div');
    tabButtons.className = 'tab-buttons';
    
    // Add tabs for preprocessing steps and final tokens
    const preprocessingButton = document.createElement('button');
    preprocessingButton.textContent = 'Preprocessing Steps';
    preprocessingButton.className = 'active';
    
    const tokensButton = document.createElement('button');
    tokensButton.textContent = 'Final Tokens';
    
    const tokenIdsButton = document.createElement('button');
    tokenIdsButton.textContent = 'Token IDs';
    
    tabButtons.appendChild(preprocessingButton);
    tabButtons.appendChild(tokensButton);
    tabButtons.appendChild(tokenIdsButton);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Initial display of preprocessing steps
    displayPreprocessingSteps(tabContent, data.preprocessing_steps);
    
    // Add click handlers for tabs
    preprocessingButton.onclick = () => {
        setActiveTab(preprocessingButton);
        displayPreprocessingSteps(tabContent, data.preprocessing_steps);
    };
    
    tokensButton.onclick = () => {
        setActiveTab(tokensButton);
        tabContent.textContent = Array.isArray(data.tokens) ? data.tokens.join(' ') : 'No tokens available';
    };
    
    tokenIdsButton.onclick = () => {
        setActiveTab(tokenIdsButton);
        tabContent.textContent = Array.isArray(data.token_ids) ? data.token_ids.join(' ') : 'No token IDs available';
    };
    
    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContent);
    
    container.innerHTML = '';
    container.appendChild(tabContainer);
}

function setActiveTab(activeButton) {
    const buttons = activeButton.parentElement.getElementsByTagName('button');
    Array.from(buttons).forEach(button => button.className = '');
    activeButton.className = 'active';
}

function displayPreprocessingSteps(container, steps) {
    if (!steps) {
        container.textContent = 'No preprocessing steps available';
        return;
    }
    
    // Define the order of steps
    const stepOrder = [
        'Case Normalization',
        'Punctuation Removal',
        'Tokenization',
        'Stop Word Removal',
        'Padding'
    ];
    
    console.log('Steps received:', steps);  // Add this debug line
    
    // Create HTML for steps in the correct order
    const stepsHtml = stepOrder
        .filter(step => steps[step])
        .map(step => {
            // Escape < and > characters in the step value
            const escapedValue = steps[step].replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
                <div class="preprocessing-step">
                    <h4>${step}</h4>
                    <p>${escapedValue}</p>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = stepsHtml || 'No preprocessing steps were applied';
}

