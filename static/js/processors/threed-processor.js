class ThreeDProcessor {
    static async preprocess() {
        const modelData = DataManager.getOriginal3DModel();
        if (!modelData) {
            console.log('No 3D model available');
            return;
        }

        const options = {
            normalize: document.getElementById('3d-normalize')?.checked || false,
            center: document.getElementById('3d-center')?.checked || false,
            simplify: document.getElementById('3d-simplify')?.checked || false,
            simplify_ratio: document.getElementById('simplify-ratio')?.value,
            smooth: document.getElementById('3d-smooth')?.checked || false,
            smooth_iterations: document.getElementById('smooth-iterations')?.value
        };

        console.log('Sending 3D model data:', modelData);
        console.log('Options:', options);

        try {
            const response = await fetch('/preprocess-3d', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelData,
                    options: options
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            ThreeDDisplayManager.displayPreprocessed3DModel(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error preprocessing 3D model: ' + error.message);
        }
    }

    static async augment() {
        const modelData = DataManager.getOriginal3DModel();
        if (!modelData) {
            console.log('No 3D model available');
            return;
        }

        const options = {
            rotation: {
                enabled: document.getElementById('3d-rotation')?.checked || false
            },
            scale: {
                enabled: document.getElementById('3d-scale')?.checked || false,
                factor: document.getElementById('scale-factor')?.value
            },
            noise: {
                enabled: document.getElementById('3d-noise')?.checked || false,
                amplitude: document.getElementById('noise-amplitude')?.value
            },
            deform: {
                enabled: document.getElementById('3d-deform')?.checked || false,
                strength: document.getElementById('deform-strength')?.value
            }
        };

        try {
            const response = await fetch('/augment-3d', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            ThreeDDisplayManager.displayAugmented3DModel(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error augmenting 3D model: ' + error.message);
        }
    }
} 