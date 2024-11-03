from transformers import pipeline
import random
from nltk.corpus import wordnet
import nltk

# Download required NLTK data
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

class TextAugmenter:
    def __init__(self):
        # Load MLM model for word replacement
        self.unmasker = pipeline('fill-mask', model='bert-base-uncased')
        self.mask_token = '[MASK]'
        
    def word_replacement_mlm(self, text):
        """Replace random words using BERT MLM"""
        words = text.split()
        if not words:
            return text, []
            
        # Randomly select a word to replace (excluding special tokens)
        replaceable_positions = [i for i, word in enumerate(words) 
                               if word not in ['<PAD>', '[MASK]']]
        if not replaceable_positions:
            return text, []
            
        pos = random.choice(replaceable_positions)
        original_word = words[pos]
        
        # Create masked text
        words[pos] = self.mask_token
        masked_text = ' '.join(words)
        
        # Get predictions
        predictions = self.unmasker(masked_text)
        new_word = predictions[0]['token_str']
        
        # Replace word
        words[pos] = new_word
        augmented_text = ' '.join(words)
        
        return augmented_text, [f"Replaced '{original_word}' with '{new_word}'"]
        
    def random_insertion(self, text):
        """Insert words randomly from the existing vocabulary"""
        words = text.split()
        if not words:
            return text, []
            
        # Select a random word from existing vocabulary
        insertable_words = [w for w in words if w not in ['<PAD>', '[MASK]']]
        if not insertable_words:
            return text, []
            
        word_to_insert = random.choice(insertable_words)
        position = random.randint(0, len(words))
        
        # Insert word
        words.insert(position, word_to_insert)
        augmented_text = ' '.join(words)
        
        return augmented_text, [f"Inserted '{word_to_insert}' at position {position}"]
        
    def random_deletion(self, text):
        """Randomly delete words"""
        words = text.split()
        if not words:
            return text, []
            
        # Select a word to delete (excluding special tokens)
        deletable_positions = [i for i, word in enumerate(words) 
                             if word not in ['<PAD>', '[MASK]']]
        if not deletable_positions:
            return text, []
            
        pos = random.choice(deletable_positions)
        deleted_word = words[pos]
        
        # Delete word
        words.pop(pos)
        augmented_text = ' '.join(words)
        
        return augmented_text, [f"Deleted '{deleted_word}' from position {pos}"]
        
    def word_replacement(self, text):
        """Replace random word with another from vocabulary"""
        words = text.split()
        if len(words) < 2:  # Need at least 2 words to replace
            return text, []
            
        # Select positions for replacement
        pos = random.randint(0, len(words) - 1)
        replacement = random.choice(words)  # Use existing word as replacement
        
        original_word = words[pos]
        words[pos] = replacement
        
        augmented_text = ' '.join(words)
        return augmented_text, [f"Replaced '{original_word}' with '{replacement}'"]
        
    def get_wordnet_pos(self, word):
        """Map POS tag to first character lemmatize() accepts"""
        tag = nltk.pos_tag([word])[0][1][0].upper()
        tag_dict = {"J": wordnet.ADJ,
                   "N": wordnet.NOUN,
                   "V": wordnet.VERB,
                   "R": wordnet.ADV}
        return tag_dict.get(tag, wordnet.NOUN)

    def get_synonyms(self, word):
        """Get synonyms for a word"""
        synonyms = []
        for syn in wordnet.synsets(word):
            for lemma in syn.lemmas():
                if lemma.name().lower() != word.lower():  # Don't include the word itself
                    synonyms.append(lemma.name())
        return list(set(synonyms))  # Remove duplicates

    def synonym_replacement(self, text):
        """Replace random word with its synonym"""
        words = text.split()
        if not words:
            return text, []

        # Try to find a word with synonyms
        random.shuffle(words)  # Shuffle to try different words
        for idx, word in enumerate(words):
            if word in ['<PAD>', '[MASK]']:  # Skip special tokens
                continue
                
            synonyms = self.get_synonyms(word)
            if synonyms:  # If synonyms found
                original_word = words[idx]
                words[idx] = random.choice(synonyms)
                augmented_text = ' '.join(words)
                return augmented_text, [f"Replaced '{original_word}' with its synonym '{words[idx]}'"]
        
        return text, ["No suitable words found for synonym replacement"]

    def augment(self, text, options):
        """Apply selected augmentation techniques"""
        steps = {}
        augmented_text = text
        full_augmented_text = text
        
        # Convert input to text if it's a dictionary
        if isinstance(text, dict) and 'tokens' in text:
            augmented_text = ' '.join(text['tokens'])
        
        if options.get('synonym_replacement'):
            augmented_text, details = self.synonym_replacement(augmented_text)
            steps['Synonym Replacement'] = {
                'text': augmented_text,
                'details': details
            }
            
        if options.get('mlm_replacement'):
            augmented_text, details = self.word_replacement_mlm(text)
            full_augmented_text, _ = self.word_replacement_mlm(full_augmented_text)
            steps['Word Replacement'] = {
                'text': augmented_text,
                'details': details
            }
            
        if options.get('random_insertion'):
            augmented_text, details = self.random_insertion(text)
            full_augmented_text, _ = self.random_insertion(full_augmented_text)
            steps['Random Insertion'] = {
                'text': augmented_text,
                'details': details
            }
            
        if options.get('random_deletion'):
            augmented_text, details = self.random_deletion(text)
            full_augmented_text, _ = self.random_deletion(full_augmented_text)
            steps['Random Deletion'] = {
                'text': augmented_text,
                'details': details
            }

        # Create tokens and token_ids from final text
        tokens = full_augmented_text.split()
        token_ids = [ord(token[0]) if token else 0 for token in tokens]
            
        return {
            'augmentation_steps': steps,
            'tokens': tokens,
            'token_ids': token_ids,
            'augmented_text': full_augmented_text
        } 