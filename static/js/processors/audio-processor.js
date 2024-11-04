class AudioProcessor {
    static async preprocess() {
        const audioData = DataManager.getOriginalAudio();
        if (!audioData) {
            console.log('No audio available');
            return;
        }

        const options = {
            resample: document.getElementById('audio-resample')?.checked || false,
            target_sample_rate: document.getElementById('target-sample-rate')?.value,
            normalize: document.getElementById('audio-normalize')?.checked || false,
            noise_reduction: document.getElementById('noise-reduction')?.checked || false,
            mfcc: document.getElementById('mfcc')?.checked || false,
            n_mfcc: parseInt(document.getElementById('n-mfcc')?.value || '13')
        };

        try {
            console.log('Sending audio data:', {
                audioLength: audioData?.length,
                options: options
            });

            const response = await fetch('/preprocess-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio: audioData,
                    options: options
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Preprocessing result:', result);
            AudioDisplayManager.displayPreprocessedAudio(result);
        } catch (error) {
            console.error('Error details:', error);
            alert('Error preprocessing audio: ' + error.message);
        }
    }

    static async augment() {
        const audioData = DataManager.getOriginalAudio();
        if (!audioData) {
            console.log('No audio available');
            return;
        }

        const options = {
            pitch_shift: {
                enabled: document.getElementById('pitch-shift')?.checked || false,
                steps: document.getElementById('pitch-steps')?.value
            },
            noise: {
                enabled: document.getElementById('audio-noise')?.checked || false,
                level: document.getElementById('noise-level')?.value
            },
            time_mask: {
                enabled: document.getElementById('time-mask')?.checked || false,
                param: document.getElementById('time-mask-param')?.value
            },
            freq_mask: {
                enabled: document.getElementById('freq-mask')?.checked || false,
                param: document.getElementById('freq-mask-param')?.value
            },
            time_stretch: {
                enabled: document.getElementById('time-stretch')?.checked || false,
                rate: parseFloat(document.getElementById('stretch-rate')?.value || '1.5')
            }
        };

        try {
            const response = await fetch('/augment-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio: audioData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            AudioDisplayManager.displayAugmentedAudio(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error augmenting audio: ' + error.message);
        }
    }
} 