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
        
    def word_replacement_mlm(self, text, n_words=1):
        """Replace random words using BERT MLM"""
        words = text.split()
        changes = {'positions': [], 'old_words': [], 'new_words': []}
        
        if not words:
            return text, changes
            
        # Randomly select words to replace (excluding special tokens)
        replaceable_positions = [i for i, word in enumerate(words) 
                               if word not in ['<PAD>', '[MASK]']]
        
        if not replaceable_positions:
            return text, changes
        
        # Randomly select n positions to replace
        n_words = min(n_words, len(replaceable_positions))
        positions_to_replace = random.sample(replaceable_positions, n_words)
        
        for pos in positions_to_replace:
            original_word = words[pos]
            
            # Create masked text
            words[pos] = self.mask_token
            masked_text = ' '.join(words)
        
            # Get predictions
            predictions = self.unmasker(masked_text)
            new_word = predictions[0]['token_str']
        
            # Replace word
            words[pos] = new_word
            
            # Track changes
            changes['positions'].append(pos)
            changes['old_words'].append(original_word)
            changes['new_words'].append(new_word)
        
        return ' '.join(words), changes
        
    def random_insertion(self, text, n_words=1):
        """Insert words randomly from the existing vocabulary"""
        words = text.split()
        changes = {'positions': [], 'new_words': []}
        
        if not words:
            return text, changes
            
        insertable_words = [w for w in words if w not in ['<PAD>', '[MASK]']]
        if not insertable_words:
            return text, changes
        
        for _ in range(n_words):
            word_to_insert = random.choice(insertable_words)
            position = random.randint(0, len(words))
            
            # Insert word
            words.insert(position, word_to_insert)
            
            # Track changes
            changes['positions'].append(position)
            changes['new_words'].append(word_to_insert)
        
        return ' '.join(words), changes
        
    def random_deletion(self, text, n_words=1):
        """Randomly delete words"""
        words = text.split()
        changes = {'positions': [], 'deleted_words': []}
        
        if not words:
            return text, changes
            
        deletable_positions = [i for i, word in enumerate(words) 
                             if word not in ['<PAD>', '[MASK]']]
        
        if not deletable_positions:
            return text, changes

        # Randomly select n positions to delete
        n_words = min(n_words, len(deletable_positions))
        positions_to_delete = sorted(random.sample(deletable_positions, n_words), reverse=True)
        
        for pos in positions_to_delete:
            deleted_word = words[pos]
            words.pop(pos)
            
            # Track changes
            changes['positions'].append(pos)
            changes['deleted_words'].append(deleted_word)
        
        return ' '.join(words), changes
        
    def word_replacement(self, text, n_words=1):
        """Replace random word with another from vocabulary"""
        words = text.split()
        if len(words) < 2:  # Need at least 2 words to replace
            return text
        
        for _ in range(n_words):
            # Select positions for replacement
            pos = random.randint(0, len(words) - 1)
            replacement = random.choice(words)  # Use existing word as replacement
            words[pos] = replacement
        
        augmented_text = ' '.join(words)
        return augmented_text
        
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

    def synonym_replacement(self, text, n_words=1):
        """Replace random words with synonyms"""
        words = text.split()
        changes = {'positions': [], 'old_words': [], 'new_words': []}
        
        if not words:
            return text, changes

        # Find replaceable words (those with synonyms)
        replaceable_positions = []
        for i, word in enumerate(words):
            if word not in ['<PAD>', '[MASK]']:
                synonyms = self.get_synonyms(word)
                if synonyms:
                    replaceable_positions.append((i, word, synonyms))
        
        if not replaceable_positions:
            return text, changes
        
        # Randomly select n words to replace
        n_words = min(n_words, len(replaceable_positions))
        positions_to_replace = random.sample(replaceable_positions, n_words)
        
        for pos, word, synonyms in positions_to_replace:
            synonym = random.choice(synonyms)
            words[pos] = synonym
            
            # Track changes
            changes['positions'].append(pos)
            changes['old_words'].append(word)
            changes['new_words'].append(synonym)
        
        return ' '.join(words), changes

    def augment(self, text, options, n_words):
        """Apply selected augmentation techniques"""
        steps = {}
        augmented_text = text
        
        # Convert input to text if it's a dictionary
        if isinstance(text, dict) and 'tokens' in text:
            augmented_text = ' '.join(text['tokens'])
        
        if options.get('synonym_replacement'):
            augmented_text, changes = self.synonym_replacement(
                augmented_text, 
                n_words=n_words['synonym_replacement']
            )
            steps['Synonym Replacement'] = {
                'text': augmented_text,
                'changes': changes
            }
            
        if options.get('mlm_replacement'):
            augmented_text, changes = self.word_replacement_mlm(
                augmented_text, 
                n_words=n_words['mlm_replacement']
            )
            steps['Word Replacement'] = {
                'text': augmented_text,
                'changes': changes
            }
            
        if options.get('random_insertion'):
            augmented_text, changes = self.random_insertion(
                augmented_text, 
                n_words=n_words['random_insertion']
            )
            steps['Random Insertion'] = {
                'text': augmented_text,
                'changes': changes
            }
            
        if options.get('random_deletion'):
            augmented_text, changes = self.random_deletion(
                augmented_text, 
                n_words=n_words['random_deletion']
            )
            steps['Random Deletion'] = {
                'text': augmented_text,
                'changes': changes
            }
            
        return {
            'augmentation_steps': steps,
            'augmented_text': augmented_text
        } 