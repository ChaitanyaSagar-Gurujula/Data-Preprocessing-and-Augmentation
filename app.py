from flask import Flask, render_template, request, jsonify, send_from_directory
from preprocessing.text_preprocessing import TextPreprocessor
from preprocessing.text_augmentation import TextAugmenter
from preprocessing.image_preprocessing import ImagePreprocessor
from preprocessing.image_augmentation import ImageAugmenter
from preprocessing.audio_preprocessing import AudioPreprocessor
from preprocessing.audio_augmentation import AudioAugmenter
import os
import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

preprocessor = TextPreprocessor()
augmenter = TextAugmenter()  # Initialize the augmenter

# Initialize processors
image_preprocessor = ImagePreprocessor()
image_augmenter = ImageAugmenter()
audio_preprocessor = AudioPreprocessor()
audio_augmenter = AudioAugmenter()

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

@app.route('/preprocess-image', methods=['POST'])
def preprocess_image():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
            
        result = image_preprocessor.preprocess(data['image'], data['options'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/augment-image', methods=['POST'])
def augment_image():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
            
        result = image_augmenter.augment(data['image'], data['options'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/preprocess-audio', methods=['POST'])
def preprocess_audio():
    try:
        data = request.json
        audio_data = data.get('audio')
        options = data.get('options', {})
        
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
            
        logging.debug(f"Received options: {options}")
        
        result = audio_preprocessor.preprocess(audio_data, options)
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Error in preprocess_audio: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/augment-audio', methods=['POST'])
def augment_audio():
    try:
        data = request.json
        audio_data = data.get('audio')
        options = data.get('options', {})
        
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
            
        result = audio_augmenter.augment(audio_data, options)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True)
