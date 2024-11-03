class DataManager {
    static currentData = null;
    static originalText = null;

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
} 