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

        // Store viewers for cleanup
        const viewers = [];

        // Initialize viewers for each step
        for (const [stepName, stepData] of Object.entries(result.preprocessing_steps)) {
            const viewer = await ThreeDDisplayManager.initializeViewer(
                `${stepName.toLowerCase()}-viewer`, 
                stepData
            );
            viewers.push(viewer);
        }

        // Initialize final result viewer
        const finalViewer = await ThreeDDisplayManager.initializeViewer(
            'final-preprocessed-viewer',
            result.processed_model
        );
        viewers.push(finalViewer);

        // Clean up previous viewers when switching views
        return {
            cleanup: () => {
                viewers.forEach(viewer => viewer.cleanup());
            }
        };
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

        // Store viewers for cleanup
        const viewers = [];

        // Initialize viewers for each step
        for (const [stepName, stepData] of Object.entries(result.augmentation_steps)) {
            const viewer = await ThreeDDisplayManager.initializeViewer(
                `${stepName.toLowerCase()}-viewer`, 
                stepData
            );
            viewers.push(viewer);
        }

        // Initialize final result viewer
        const finalViewer = await ThreeDDisplayManager.initializeViewer(
            'final-augmented-viewer',
            result.augmented_model
        );
        viewers.push(finalViewer);

        // Clean up previous viewers when switching views
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

        // Orthographic camera for better mathematical visualization
        const aspect = width / height;
        const d = 3;
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

        // Add toggle buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        `;
        buttonContainer.innerHTML = `
            <button id="${containerId}-solid" class="view-toggle active">Solid</button>
            <button id="${containerId}-wire" class="view-toggle">Wireframe</button>
            <button id="${containerId}-both" class="view-toggle">Both</button>
        `;
        container.appendChild(buttonContainer);

        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            .view-toggle {
                margin: 0 5px;
                padding: 8px 16px;
                border: 1px solid #ccc;
                border-radius: 5px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            }
            .view-toggle:hover {
                background: #f0f0f0;
            }
            .view-toggle.active {
                background: #007bff;
                color: white;
                border-color: #0056b3;
            }
        `;
        document.head.appendChild(style);

        // First, let's define a global scale factor that both model and coordinates will use
        const globalScale = 2.2;  // This controls overall size

        // Load and add the model first
        let solidMesh, wireframeMesh;
        if (typeof modelData === 'string' && modelData.includes('OFF')) {
            const geometry = OFFLoader.createMesh(modelData).geometry;
            
            // Create solid mesh with adjusted material
            solidMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshPhongMaterial({
                    color: 0x00aaff,
                    opacity: 0.8,
                    transparent: true,
                    side: THREE.DoubleSide
                })
            );

            // Create wireframe mesh with thicker lines
            wireframeMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    wireframe: true,
                    wireframeLinewidth: 2
                })
            );

            // Scale model using global scale
            const bbox = new THREE.Box3().setFromObject(solidMesh);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = globalScale / maxDim;
            
            solidMesh.position.sub(center);
            solidMesh.scale.multiplyScalar(scale);
            wireframeMesh.position.copy(solidMesh.position);
            wireframeMesh.scale.copy(solidMesh.scale);
            
            scene.add(solidMesh);
            scene.add(wireframeMesh);
            wireframeMesh.visible = false;

            // Add toggle functionality
            const buttons = {
                solid: document.getElementById(`${containerId}-solid`),
                wire: document.getElementById(`${containerId}-wire`),
                both: document.getElementById(`${containerId}-both`)
            };

            const updateView = (mode) => {
                // Update button states
                Object.values(buttons).forEach(btn => btn.classList.remove('active'));
                buttons[mode].classList.add('active');

                // Update mesh visibility
                switch(mode) {
                    case 'solid':
                        solidMesh.visible = true;
                        wireframeMesh.visible = false;
                        break;
                    case 'wire':
                        solidMesh.visible = false;
                        wireframeMesh.visible = true;
                        break;
                    case 'both':
                        solidMesh.visible = true;
                        wireframeMesh.visible = true;
                        break;
                }
            };

            // Add click handlers
            Object.entries(buttons).forEach(([mode, btn]) => {
                btn.addEventListener('click', () => updateView(mode));
            });
        }

        // Create mathematical coordinate system
        const createMathCoordinateSystem = () => {
            const coordSystem = new THREE.Group();

            // Update grid size
            const gridSize = 5 * globalScale;
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

            // Update axes length
            const axesLength = 2.5 * globalScale;
            const createAxis = (start, end, color) => {
                const points = [start, end];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: color,
                    linewidth: 2
                });
                return new THREE.Line(geometry, material);
            };

            // Create axes with scaled length
            const axes = {
                x: createAxis(
                    new THREE.Vector3(-axesLength, 0, 0), 
                    new THREE.Vector3(axesLength, 0, 0), 
                    0xff0000
                ),
                y: createAxis(
                    new THREE.Vector3(0, -axesLength, 0), 
                    new THREE.Vector3(0, axesLength, 0), 
                    0x00ff00
                ),
                z: createAxis(
                    new THREE.Vector3(0, 0, -axesLength), 
                    new THREE.Vector3(0, 0, axesLength), 
                    0x0000ff
                )
            };

            Object.values(axes).forEach(axis => coordSystem.add(axis));

            // Add axis labels
            const createAxisLabels = (axis, color) => {
                for (let i = -2; i <= 2; i++) {
                    if (i === 0) continue;

                    const value = i.toFixed(1);
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.font = 'bold 48px Arial';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value, canvas.width/2, canvas.height/2);

                    const texture = new THREE.CanvasTexture(canvas);
                    texture.minFilter = THREE.LinearFilter;
                    const spriteMaterial = new THREE.SpriteMaterial({ 
                        map: texture,
                        sizeAttenuation: false
                    });
                    const sprite = new THREE.Sprite(spriteMaterial);

                    // Adjust positions based on global scale
                    const offset = 0.3 * globalScale;  // Scale the offset
                    const position = new THREE.Vector3();
                    if (axis === 'x') {
                        position.set(i * globalScale, -offset, 0);
                    } else if (axis === 'y') {
                        position.set(-offset, i * globalScale, 0);
                    } else {
                        position.set(-offset, 0, i * globalScale);
                    }

                    sprite.position.copy(position);
                    sprite.scale.set(0.6, 0.3, 1);
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

        // Clean up any existing animation loop
        if (window[`animationFrameId_${containerId}`]) {
            cancelAnimationFrame(window[`animationFrameId_${containerId}`]);
        }

        // Ensure camera is stable
        camera.position.set(d, d, d);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        // Modified animation loop with container-specific ID
        function animate() {
            window[`animationFrameId_${containerId}`] = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();

        // Modified window resize handler
        const resizeHandler = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const aspect = width / height;
            
            camera.left = -d * aspect;
            camera.right = d * aspect;
            camera.top = d;
            camera.bottom = -d;
            
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        // Store the resize handler reference
        window[`resizeHandler_${containerId}`] = resizeHandler;
        window.addEventListener('resize', resizeHandler);

        // Return cleanup function with the viewer
        return { 
            scene, 
            camera,
            cleanup: () => {
                // Cancel animation frame
                if (window[`animationFrameId_${containerId}`]) {
                    cancelAnimationFrame(window[`animationFrameId_${containerId}`]);
                }
                // Remove resize listener
                window.removeEventListener('resize', window[`resizeHandler_${containerId}`]);
                // Remove references
                delete window[`animationFrameId_${containerId}`];
                delete window[`resizeHandler_${containerId}`];
            }
        };
    }
} 