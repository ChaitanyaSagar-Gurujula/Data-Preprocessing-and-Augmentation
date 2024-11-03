class TextProcessor {
    static async preprocess() {
        if (!DataManager.getOriginalText()) {
            console.log('No text available');
            return;
        }

        const options = {
            case_normalization: document.getElementById('case-norm')?.checked || false,
            punctuation_removal: document.getElementById('punct-removal')?.checked || false,
            stopword_removal: document.getElementById('stopword-removal')?.checked || false,
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
                    data: DataManager.getOriginalText(),
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            DisplayManager.displayPreprocessedData(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error preprocessing data: ' + error.message);
        }
    }

    static async augment() {
        if (!DataManager.getOriginalText()) {
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
                    text: DataManager.getOriginalText(),
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            DisplayManager.displayAugmentedData(result);
            console.log('Augmentation result:', result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error augmenting data: ' + error.message);
        }
    }
} 