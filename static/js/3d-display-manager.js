class ThreeDDisplayManager {
    static async displayOriginal3DModel(modelData) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="model-preview">
                <h3>Original 3D Model</h3>
                <div id="original-model-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        `;

        await ThreeDDisplayManager.initializeViewer('original-model-viewer', modelData);
    }

    static async displayPreprocessed3DModel(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="model-comparison" style="display: flex; gap: 20px;">';
        
        // Original model on the left
        html += `
            <div class="original-model" style="flex: 1;">
                <h3>Original 3D Model</h3>
                <div id="original-model-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        `;

        // Preprocessing steps on the right
        html += '<div class="preprocessing-steps" style="flex: 1;">';
        
        // Define the order of preprocessing steps
        const stepOrder = [
            'Normalize',
            'Center',
            'Simplify',
            'Smooth'
        ];
        
        // Add preprocessing steps
        stepOrder.forEach(stepName => {
            if (result.preprocessing_steps[stepName]) {
                html += `
                    <div class="preprocessing-step">
                        <h3>${stepName}</h3>
                        <div id="${stepName.toLowerCase()}-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        // Add final result
        html += `
            <div class="preprocessing-step">
                <h3>Final Result</h3>
                <div id="final-preprocessed-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        </div>`;

        html += '</div>'; // Close model-comparison div
        container.innerHTML = html;

        // Store viewers for cleanup
        const viewers = [];

        // Initialize original model viewer
        const originalViewer = await ThreeDDisplayManager.initializeViewer(
            'original-model-viewer',
            DataManager.getOriginal3DModel()
        );
        viewers.push(originalViewer);

        // Initialize preprocessing step viewers
        for (const stepName of stepOrder) {
            if (result.preprocessing_steps[stepName]) {
                const viewer = await ThreeDDisplayManager.initializeViewer(
                    `${stepName.toLowerCase()}-viewer`,
                    result.preprocessing_steps[stepName]
                );
                viewers.push(viewer);
            }
        }

        // Initialize final result viewer
        const finalViewer = await ThreeDDisplayManager.initializeViewer(
            'final-preprocessed-viewer',
            result.processed_model
        );
        viewers.push(finalViewer);

        return {
            cleanup: () => {
                viewers.forEach(viewer => viewer.cleanup());
            }
        };
    }

    static async displayAugmented3DModel(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="model-comparison" style="display: flex; gap: 20px;">';
        
        // Original model on the left
        html += `
            <div class="original-model" style="flex: 1;">
                <h3>Original 3D Model</h3>
                <div id="original-model-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        `;

        // Augmentation steps on the right
        html += '<div class="augmentation-steps" style="flex: 1;">';
        
        // Define the order of augmentation steps
        const stepOrder = [
            'Rotation',
            'Scale',
            'Noise',
            'Deform'
        ];
        
        console.log("Augmentation steps received:", result.augmentation_steps);
        
        // Process steps in the correct order
        stepOrder.forEach(stepName => {
            if (result.augmentation_steps[stepName]) {
                console.log(`Processing step: ${stepName}`);
                html += `
                    <div class="augmentation-step">
                        <h3>${stepName}</h3>
                        <div id="${stepName.toLowerCase()}-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
                    </div>
                    <div class="step-arrow"></div>
                `;
            }
        });

        html += `
            <div class="augmentation-step">
                <h3>Final Result</h3>
                <div id="final-augmented-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        </div>`;

        container.innerHTML = html;

        // Store viewers for cleanup
        const viewers = [];

        // Then initialize viewers using for...of loop
        for (const stepName of stepOrder) {
            if (result.augmentation_steps[stepName]) {
                const viewer = await ThreeDDisplayManager.initializeViewer(
                    `${stepName.toLowerCase()}-viewer`, 
                    result.augmentation_steps[stepName]
                );
                viewers.push(viewer);
            }
        }

        // Initialize final result viewer
        const finalViewer = await ThreeDDisplayManager.initializeViewer(
            'final-augmented-viewer',
            result.augmented_model
        );
        viewers.push(finalViewer);

        return {
            cleanup: () => {
                viewers.forEach(viewer => viewer.cleanup());
            }
        };
    }

    static async initializeViewer(containerId, modelData) {
        const container = document.getElementById(containerId);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup with white background
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Parse OFF file data
        const lines = modelData.split('\n').filter(line => line.trim() !== '');
        const vertexFaceCounts = lines[1].trim().split(' ').map(Number);
        const numVertices = vertexFaceCounts[0];
        const numFaces = vertexFaceCounts[1];

        // Parse vertices
        const vertices = [];
        for (let i = 0; i < numVertices; i++) {
            const vertex = lines[i + 2].trim().split(' ').map(Number);
            vertices.push(vertex[0], vertex[1], vertex[2]);
        }

        // Parse faces
        const indices = [];
        for (let i = 0; i < numFaces; i++) {
            const face = lines[i + numVertices + 2].trim().split(' ').map(Number);
            indices.push(face[1], face[2], face[3]);
        }

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        // Calculate model dimensions
        const boundingBox = geometry.boundingBox;
        const modelSize = new THREE.Vector3();
        boundingBox.getSize(modelSize);
        
        // Use the largest dimension to set camera bounds
        const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
        const d = maxDimension * 1.2; // Add 20% padding

        // Orthographic camera setup with model dimensions
        const aspect = width / height;
        const camera = new THREE.OrthographicCamera(
            -d * aspect, d * aspect,  // left, right
            d, -d,                    // top, bottom
            0.1, 1000                 // near, far
        );

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Create mesh with medium light blue color
        const material = new THREE.MeshPhongMaterial({
            color: 0x87CEEB,  // SkyBlue - good balance for visibility
            side: THREE.DoubleSide,
            flatShading: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(d, d, d);
        scene.add(directionalLight);

        // Camera position
        camera.position.set(d, d, d);
        camera.lookAt(0, 0, 0);

        // Add OrbitControls with disabled zoom
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;  // Disable zoom
        controls.enablePan = false;   // Disable panning
        controls.enableDamping = true;

        // Create coordinate labels with renderOrder
        const createLabel = (text, position) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width/2, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                depthTest: false,  // Disable depth testing
                depthWrite: false  // Don't write to depth buffer
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(maxDimension/5, maxDimension/10, 1);
            sprite.renderOrder = 999;  // Ensure labels render last
            return sprite;
        };

        // Add coordinate labels with adjusted positions
        const labelOffset = maxDimension * 1.1;
        const xLabel = createLabel('X', new THREE.Vector3(labelOffset, 0, 0));
        const yLabel = createLabel('Y', new THREE.Vector3(0, labelOffset, 0));
        const zLabel = createLabel('Z', new THREE.Vector3(0, 0, labelOffset));
        
        scene.add(xLabel);
        scene.add(yLabel);
        scene.add(zLabel);

        // Add dimension labels with same visibility settings
        const addDimensionLabels = () => {
            const positions = [
                { value: modelSize.x.toFixed(2), pos: new THREE.Vector3(modelSize.x/2, -labelOffset/4, 0) },
                { value: modelSize.y.toFixed(2), pos: new THREE.Vector3(-labelOffset/4, modelSize.y/2, 0) },
                { value: modelSize.z.toFixed(2), pos: new THREE.Vector3(0, -labelOffset/4, modelSize.z/2) }
            ];

            positions.forEach(({value, pos}) => {
                const label = createLabel(value, pos);
                scene.add(label);
            });
        };
        addDimensionLabels();

        // Add axes with actual dimensions
        const axes = new THREE.AxesHelper(maxDimension);
        scene.add(axes);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        return {
            scene,
            camera,
            cleanup: () => {
                controls.dispose();
                renderer.dispose();
            }
        };
    }
}

// Make it globally available
window.ThreeDDisplayManager = ThreeDDisplayManager; 