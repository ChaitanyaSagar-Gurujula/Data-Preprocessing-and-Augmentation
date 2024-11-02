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
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        content = file.read().decode('utf-8')
        # Store the raw content instead of converting to HTML
        return jsonify({'data': content})

@app.route('/preprocess', methods=['POST'])
def preprocess():
    data = request.json
    content = data['data']
    options = data['options']
    
    # Process the text and get all results
    result = preprocessor.preprocess(content, options)
    
    return jsonify(result)

@app.route('/augment', methods=['POST'])
def augment():
    try:
        data = request.json
        if not data or 'data' not in data or 'options' not in data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        content = data['data']
        options = data['options']
        
        # If content is a dictionary (from preprocessing), get the tokens
        if isinstance(content, dict) and 'tokens' in content:
            text = ' '.join(content['tokens'])
        else:
            text = str(content)
        
        result = augmenter.augment(text, options)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in augmentation: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
