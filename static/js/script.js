let currentData = null;

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

    try {
        console.log('Sending data for preprocessing:', currentData);
        const response = await fetch('/preprocess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: currentData }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Received preprocessed data:', result);
        
        if (!result.tokens || !result.token_ids) {
            throw new Error('Invalid response format: missing tokens or token_ids');
        }
        
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
    
    if (!data || (!data.tokens && !data.token_ids)) {
        console.error('Invalid data format received');
        container.innerHTML = 'Error: Invalid data format received';
        return;
    }
    
    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    // Create tab buttons
    const tabButtons = document.createElement('div');
    tabButtons.className = 'tab-buttons';
    
    const tokensButton = document.createElement('button');
    tokensButton.textContent = 'Tokens';
    tokensButton.className = 'active';
    
    const tokenIdsButton = document.createElement('button');
    tokenIdsButton.textContent = 'Token IDs';
    
    tabButtons.appendChild(tokensButton);
    tabButtons.appendChild(tokenIdsButton);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Initial display of tokens
    tabContent.textContent = Array.isArray(data.tokens) ? data.tokens.join(' ') : 'No tokens available';
    
    // Add click handlers for tabs
    tokensButton.onclick = () => {
        tokensButton.className = 'active';
        tokenIdsButton.className = '';
        tabContent.textContent = Array.isArray(data.tokens) ? data.tokens.join(' ') : 'No tokens available';
    };
    
    tokenIdsButton.onclick = () => {
        tokenIdsButton.className = 'active';
        tokensButton.className = '';
        tabContent.textContent = Array.isArray(data.token_ids) ? data.token_ids.join(' ') : 'No token IDs available';
    };
    
    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContent);
    
    container.innerHTML = '';
    container.appendChild(tabContainer);
}
