class DataManager {
    static currentData = null;
    static originalText = null;
    static originalImage = null;

    static setCurrentData(data) {
        this.currentData = data;
    }

    static getCurrentData() {
        return this.currentData;
    }

    static setOriginalText(text) {
        this.originalText = text;
    }

    static getOriginalText() {
        return this.originalText;
    }

    static setOriginalImage(imageData) {
        this.originalImage = imageData;
    }

    static getOriginalImage() {
        return this.originalImage;
    }
} 