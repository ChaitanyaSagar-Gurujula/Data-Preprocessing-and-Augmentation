from torchtext.data.utils import get_tokenizer
import string

class TextPreprocessor:
    def __init__(self):
        self.tokenizer = get_tokenizer('basic_english')
        self.max_length = 20  # Set constant padding length
        # Common English stop words
        self.stop_words = set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
                             'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 
                             'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 
                             "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 
                             'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 
                             'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 
                             'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
                             'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 
                             'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 
                             'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
                             'through', 'during', 'before', 'after', 'above', 'below', 'to', 
                             'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 
                             'again', 'further', 'then', 'once'])

    def pad_sequence(self, sequence, pad_value=0):
        """Pad or truncate sequence to max_length"""
        if len(sequence) > self.max_length:
            return sequence[:self.max_length]  # Truncate
        return sequence + [pad_value] * (self.max_length - len(sequence))  # Pad with zeros

    def preprocess(self, text, options):
        steps = {}
        processed_text = text
        
        # Text-level preprocessing
        # Case normalization
        if options.get('case_normalization'):
            processed_text = processed_text.lower()
            steps['Case Normalization'] = processed_text
        
        # Punctuation removal
        if options.get('punctuation_removal'):
            processed_text = processed_text.translate(str.maketrans('', '', string.punctuation))
            steps['Punctuation Removal'] = processed_text
        
        # Now perform tokenization after all text-level preprocessing
        words = self.tokenizer(processed_text)
        
        # Token-level preprocessing
        # Stop word removal
        if options.get('stopword_removal'):
            words = [word for word in words if word.lower() not in self.stop_words]
            steps['Stop Word Removal'] = ' '.join(words)
        
        # Generate token IDs
        token_ids = [ord(word[0]) if word else 0 for word in words]

        # Padding (if selected)
        if options.get('padding'):
            words = self.pad_sequence(words, pad_value='<PAD>')
            token_ids = self.pad_sequence(token_ids, pad_value=0)
            steps['Padding'] = ' '.join(words)

        print(steps)
        
        return {
            'preprocessing_steps': steps,
            'tokens': words,
            'token_ids': token_ids,
            'original_length': len(words)
        }
