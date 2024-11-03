from flask import Flask, render_template, request, jsonify
from preprocessing.text_preprocessing import TextPreprocessor
from preprocessing.text_augmentation import TextAugmenter

app = Flask(__name__)

preprocessor = TextPreprocessor()
augmenter = TextAugmenter()  # Initialize the augmenter

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        content = file.read().decode('utf-8')
        return jsonify({'data': content})
    
    return jsonify({'error': 'Error processing file'}), 400

@app.route('/preprocess', methods=['POST'])
def preprocess():
    data = request.json
    content = data['data']
    options = data['options']
    
    # Process the text and get all results
    result = preprocessor.preprocess(content, options)
    
    return jsonify(result)

@app.route('/augment', methods=['POST'])
def augment_text():
    data = request.json
    text = data.get('text', '')
    options = data.get('options', {})
    
    # Convert options format
    processed_options = {
        'synonym_replacement': options.get('synonym_replacement', {}).get('enabled', False),
        'mlm_replacement': options.get('mlm_replacement', {}).get('enabled', False),
        'random_insertion': options.get('random_insertion', {}).get('enabled', False),
        'random_deletion': options.get('random_deletion', {}).get('enabled', False)
    }
    
    # Get n_words for each method
    n_words = {
        'synonym_replacement': options.get('synonym_replacement', {}).get('n_words', 3),
        'mlm_replacement': options.get('mlm_replacement', {}).get('n_words', 3),
        'random_insertion': options.get('random_insertion', {}).get('n_words', 3),
        'random_deletion': options.get('random_deletion', {}).get('n_words', 2)
    }
    
    augmenter = TextAugmenter()
    result = augmenter.augment(text, processed_options, n_words)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
