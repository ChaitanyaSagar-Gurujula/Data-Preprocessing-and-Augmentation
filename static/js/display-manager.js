class DisplayManager {
    static displayRawData(data) {
        console.log('Displaying raw data:', data);
        const container = document.getElementById('data-container');
        
        const rawDataHtml = `
            <div class="raw-data-container">
                <h3>Raw Text</h3>
                <div class="raw-text">${data}</div>
            </div>
        `;
        
        container.innerHTML = rawDataHtml;
    }

    static displayPreprocessedData(data) {
        console.log('Displaying preprocessed data:', data);
        const container = document.getElementById('data-container');
        
        const splitView = `
            <div class="split-view">
                <div class="original-panel">
                    <div class="panel-title">Original Text</div>
                    <div class="panel-content">${DataManager.getOriginalText()}</div>
                </div>
                <div class="processed-panel">
                    <div class="panel-title">Preprocessing Results</div>
                    <div class="preprocessing-steps">
                        ${this.createPreprocessingStepsHtml(data)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = splitView;
    }

    static createPreprocessingStepsHtml(data) {
        let stepsHtml = '';
        const steps = data.preprocessing_steps || {};
        
        // Define the order of preprocessing steps
        const stepOrder = [
            'Case Normalization',
            'Punctuation Removal',
            'Stop Word Removal',
            'Padding'
        ];
        
        // Add steps in the correct order
        stepOrder.forEach(stepName => {
            if (steps[stepName]) {
                stepsHtml += `
                    <div class="preprocessing-step">
                        <div class="step-title">${stepName}</div>
                        <div class="step-content">${this.escapeHtml(steps[stepName])}</div>
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Add final tokens if available
        if (data.tokens) {
            stepsHtml += `
                <div class="preprocessing-step">
                    <div class="step-title">Final Tokens</div>
                    <div class="tokens-display">
                        ${data.tokens.map((token, index) => `
                            <div class="token" style="background-color: ${this.getTokenColor(token)}">
                                <span class="token-text">${this.escapeHtml(token)}</span>
                                <span class="token-id">${data.token_ids[index]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return stepsHtml;
    }

    static getTokenColor(token) {
        // Special tokens
        if (token === '<PAD>') {
            return '#f0f0f0'; // Light gray for padding tokens
        }
        
        // Generate a consistent color based on the token string
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = token.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Convert hash to RGB color with pastel shades
        const h = Math.abs(hash) % 360;  // Hue (0-360)
        return `hsl(${h}, 70%, 90%)`; // Pastel colors with high lightness
    }

    static displayAugmentedData(data) {
        console.log('Displaying augmented data:', data);
        const container = document.getElementById('data-container');
        
        const splitView = `
            <div class="split-view">
                <div class="original-panel">
                    <div class="panel-title">Original Text</div>
                    <div class="panel-content">${DataManager.getOriginalText()}</div>
                </div>
                <div class="processed-panel">
                    <div class="panel-title">Augmentation Steps</div>
                    <div class="augmentation-steps">
                        ${this.createAugmentationStepsHtml(data.augmentation_steps, data.augmented_text)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = splitView;
    }

    static createAugmentationStepsHtml(steps, augmentedText) {
        let stepsHtml = '';
        
        // Define the order of augmentation steps
        const stepOrder = [
            'Synonym Replacement',
            'Word Replacement',
            'Random Insertion',
            'Random Deletion'
        ];
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (steps[stepName]) {
                const stepData = steps[stepName];
                const changes = stepData.changes || {};
                let highlightedText = stepData.text;
                let detailsHtml = '';

                // Create details section based on the type of changes
                if (changes.positions) {
                    detailsHtml += '<div class="debug-info">';
                    
                    if (stepName === 'Random Deletion') {
                        // Add debug info
                        changes.positions.forEach((pos, idx) => {
                            detailsHtml += `
                                <div>Position ${pos}: Deleted "${changes.deleted_words[idx]}"</div>
                            `;
                        });

                        // Get the words from the current text
                        let words = stepData.text.split(' ');
                        
                        // Create an array of all words including deleted ones
                        let allWords = [...words];
                        changes.positions.forEach((pos, idx) => {
                            // Insert the deleted word back at its original position
                            allWords.splice(pos, 0, 
                                `<mark class="highlight-delete" title="Deleted word" style="text-decoration: line-through;">${changes.deleted_words[idx]}</mark>`
                            );
                        });
                        
                        highlightedText = allWords.join(' ');
                    } 
                    else if (stepName === 'Random Insertion') {
                        // Add debug info first
                        changes.positions.forEach((pos, idx) => {
                            detailsHtml += `
                                <div>Position ${pos}: Inserted "${changes.new_words[idx]}"</div>
                            `;
                        });

                        // Use the text directly from stepData
                        highlightedText = stepData.text;

                        // Convert to array and highlight the inserted words
                        const words = highlightedText.split(' ');
                        changes.positions.forEach((pos, idx) => {
                            const newWord = changes.new_words[idx];
                            if (words[pos] === newWord) {
                                words[pos] = `<mark class="highlight-insert" title="Inserted word">${newWord}</mark>`;
                            }
                        });
                        
                        highlightedText = words.join(' ');
                    }
                    else if (changes.new_words && changes.old_words) {
                        // For replacements (synonym replacement or MLM replacement)
                        changes.positions.forEach((pos, idx) => {
                            detailsHtml += `
                                <div>Position ${pos}: "${changes.old_words[idx]}" → "${changes.new_words[idx]}"</div>
                            `;
                        });
                        
                        // Create a copy of the text and words array
                        let words = highlightedText.split(' ');
                        
                        // Sort positions in descending order to handle multiple replacements correctly
                        const sortedReplacements = changes.positions
                            .map((pos, idx) => ({
                                pos,
                                oldWord: changes.old_words[idx],
                                newWord: changes.new_words[idx]
                            }))
                            .sort((a, b) => b.pos - a.pos);

                        // Replace words with highlighted versions
                        sortedReplacements.forEach(({pos, oldWord, newWord}) => {
                            words[pos] = `<mark class="highlight-change" title="Changed from: ${oldWord}">${newWord}</mark>`;
                        });
                        
                        highlightedText = words.join(' ');
                    }
                    
                    detailsHtml += '</div>';
                }

                stepsHtml += `
                    <div class="augmentation-step">
                        <div class="step-title">${stepName}</div>
                        <div class="step-content">${highlightedText}</div>
                        ${detailsHtml}
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Use the augmented_text for final result
        stepsHtml += `
            <div class="final-result">
                <div class="step-title">Final Result</div>
                <p>${augmentedText}</p>
            </div>
        `;

        return stepsHtml;
    }

    // Helper method to insert highlighted word at specific position
    static insertHighlightedWord(text, position, word) {
        const words = text.split(' ');
        words.splice(position, 0, `<mark class="highlight-insert" title="Inserted word">${word}</mark>`);
        return words.join(' ');
    }   

    static escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
} 
