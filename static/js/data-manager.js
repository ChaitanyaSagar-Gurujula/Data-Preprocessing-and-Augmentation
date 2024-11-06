class DataManager {
    static currentData = null;
    static originalText = null;
    static originalImage = null;
    static originalAudio = null;
    static original3DModel = null;

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

    static setOriginalAudio(audioData) {
        this.originalAudio = audioData;
    }

    static getOriginalAudio() {
        return this.originalAudio;
    }

    static setOriginal3DModel(modelData) {
        this.original3DModel = modelData;
    }

    static getOriginal3DModel() {
        return this.original3DModel;
    }
} 