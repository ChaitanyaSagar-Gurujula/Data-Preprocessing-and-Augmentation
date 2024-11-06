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
        let html = '<div class="preprocessing-steps">';
        
        // Process each preprocessing step
        for (const [stepName, stepData] of Object.entries(result.preprocessing_steps)) {
            html += `
                <div class="preprocessing-step">
                    <h3>${stepName}</h3>
                    <div id="${stepName.toLowerCase()}-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
                </div>
                <div class="step-arrow">↓</div>
            `;
        }

        // Add final result
        html += `
            <div class="preprocessing-step">
                <h3>Final Result</h3>
                <div id="final-preprocessed-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        </div>`;

        container.innerHTML = html;

        // Initialize viewers for each step
        for (const [stepName, stepData] of Object.entries(result.preprocessing_steps)) {
            await ThreeDDisplayManager.initializeViewer(
                `${stepName.toLowerCase()}-viewer`, 
                stepData
            );
        }

        // Initialize final result viewer
        await ThreeDDisplayManager.initializeViewer(
            'final-preprocessed-viewer',
            result.processed_model
        );
    }

    static async displayAugmented3DModel(result) {
        const container = document.getElementById('data-container');
        let html = '<div class="augmentation-steps">';
        
        // Process each augmentation step
        for (const [stepName, stepData] of Object.entries(result.augmentation_steps)) {
            html += `
                <div class="augmentation-step">
                    <h3>${stepName}</h3>
                    <div id="${stepName.toLowerCase()}-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
                </div>
                <div class="step-arrow">↓</div>
            `;
        }

        // Add final result
        html += `
            <div class="augmentation-step">
                <h3>Final Result</h3>
                <div id="final-augmented-viewer" style="width: 100%; height: 400px; border: 1px solid #ccc;"></div>
            </div>
        </div>`;

        container.innerHTML = html;

        // Initialize viewers for each step
        for (const [stepName, stepData] of Object.entries(result.augmentation_steps)) {
            await ThreeDDisplayManager.initializeViewer(
                `${stepName.toLowerCase()}-viewer`, 
                stepData
            );
        }

        // Initialize final result viewer
        await ThreeDDisplayManager.initializeViewer(
            'final-augmented-viewer',
            result.augmented_model
        );
    }

    static async initializeViewer(containerId, modelData) {
        const container = document.getElementById(containerId);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup with white background
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Orthographic camera for better mathematical visualization
        const aspect = width / height;
        const d = 5;
        const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 2000);
        camera.position.set(d, d, d);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            logarithmicDepthBuffer: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Load and add the model first
        let model;
        if (typeof modelData === 'string' && modelData.includes('OFF')) {
            model = OFFLoader.createMesh(modelData);
            
            // Create material with solid faces and wireframe
            const meshMaterial = new THREE.MeshPhongMaterial({
                color: 0x00aaff,
                opacity: 0.7,
                transparent: true,
                side: THREE.DoubleSide
            });

            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: true,
                wireframeLinewidth: 1
            });

            // Create two meshes: one for solid faces and one for wireframe
            const solidMesh = new THREE.Mesh(model.geometry, meshMaterial);
            const wireframeMesh = new THREE.Mesh(model.geometry, wireframeMaterial);

            // Group them together
            model = new THREE.Group();
            model.add(solidMesh);
            model.add(wireframeMesh);

            // Scale and center the model
            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            
            model.position.sub(center);
            model.scale.multiplyScalar(scale);
            
            scene.add(model);
        }

        // Create mathematical coordinate system
        const createMathCoordinateSystem = () => {
            const coordSystem = new THREE.Group();

            // Create grid planes
            const gridSize = 5;
            const divisions = 10;

            // Create grid lines
            const createGridLines = (plane, color) => {
                const group = new THREE.Group();
                const step = gridSize / divisions;
                const lineColor = new THREE.Color(color);
                lineColor.multiplyScalar(0.5); // Make grid lines lighter

                for (let i = -gridSize/2; i <= gridSize/2; i += step) {
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: lineColor, 
                        transparent: true,
                        opacity: 0.1
                    });

                    if (plane === 'xy') {
                        // Vertical lines
                        const vertGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(i, -gridSize/2, 0),
                            new THREE.Vector3(i, gridSize/2, 0)
                        ]);
                        group.add(new THREE.Line(vertGeometry, lineMaterial));

                        // Horizontal lines
                        const horzGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(-gridSize/2, i, 0),
                            new THREE.Vector3(gridSize/2, i, 0)
                        ]);
                        group.add(new THREE.Line(horzGeometry, lineMaterial));
                    }
                    // Similar for other planes...
                }
                return group;
            };

            coordSystem.add(createGridLines('xy', 0x0000ff)); // Blue grid
            // Add other grids as needed...

            // Create axes
            const axesLength = 2.5;
            const createAxis = (start, end, color) => {
                const points = [start, end];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: color,
                    linewidth: 2
                });
                return new THREE.Line(geometry, material);
            };

            // Add main axes
            const axes = {
                x: createAxis(new THREE.Vector3(-axesLength, 0, 0), new THREE.Vector3(axesLength, 0, 0), 0xff0000),
                y: createAxis(new THREE.Vector3(0, -axesLength, 0), new THREE.Vector3(0, axesLength, 0), 0x00ff00),
                z: createAxis(new THREE.Vector3(0, 0, -axesLength), new THREE.Vector3(0, 0, axesLength), 0x0000ff)
            };

            Object.values(axes).forEach(axis => coordSystem.add(axis));

            // Add axis labels
            const createAxisLabels = (axis, color) => {
                for (let i = -2; i <= 2; i++) {
                    const value = i.toFixed(1);
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 32;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value, 32, 16);

                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({ 
                        map: texture,
                        sizeAttenuation: false
                    });
                    const sprite = new THREE.Sprite(spriteMaterial);

                    const position = new THREE.Vector3();
                    if (axis === 'x') {
                        position.set(i, -0.2, 0);
                    } else if (axis === 'y') {
                        position.set(-0.2, i, 0);
                    } else {
                        position.set(-0.2, 0, i);
                    }

                    sprite.position.copy(position);
                    sprite.scale.set(0.5, 0.25, 1);
                    coordSystem.add(sprite);
                }
            };

            createAxisLabels('x', '#ff0000');
            createAxisLabels('y', '#00ff00');
            createAxisLabels('z', '#0000ff');

            return coordSystem;
        };

        // Add coordinate system
        const coordinateSystem = createMathCoordinateSystem();
        scene.add(coordinateSystem);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.copy(camera.position);
        scene.add(directionalLight);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const aspect = width / height;
            
            camera.left = -d * aspect;
            camera.right = d * aspect;
            camera.top = d;
            camera.bottom = -d;
            
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        return { scene, camera };
    }
} 