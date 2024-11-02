from torchtext.data.utils import get_tokenizer

tokenizer = get_tokenizer('basic_english')

def tokenize(text):
    tokens = tokenizer(text)
    # Convert tokens to a tensor and pad/truncate them to max_length
    token_ids = [ord(token[0]) for token in tokens]  # Simple token encoding for exam
    return tokens, token_ids
