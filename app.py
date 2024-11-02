from flask import Flask, render_template, request, jsonify, url_for
from io import StringIO
from preprocessing.text_preprocessing import TextPreprocessor

app = Flask(__name__)

preprocessor = TextPreprocessor()

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
    data = request.json
    df = pd.DataFrame(data['data'])
    
    # Add your augmentation steps here
    df['new_column'] = np.random.rand(len(df))
    
    # Convert the DataFrame to a list of dictionaries for JSON serialization
    augmented_data = df.to_dict('records')
    return jsonify({'data': augmented_data})

if __name__ == '__main__':
    app.run(debug=True)
