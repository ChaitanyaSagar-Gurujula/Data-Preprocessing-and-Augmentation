class OFFLoader {
    static parse(data) {
        const lines = data.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        
        // First line should be "OFF"
        if (lines[0] !== 'OFF') {
            throw new Error('Invalid OFF file format');
        }

        // Second line contains counts: vertices faces edges
        const [numVertices, numFaces] = lines[1].split(' ').map(Number);
        
        // Parse vertices
        const vertices = [];
        for (let i = 0; i < numVertices; i++) {
            const [x, y, z] = lines[i + 2].split(' ').map(Number);
            vertices.push(x, y, z);
        }

        // Parse faces
        const indices = [];
        for (let i = 0; i < numFaces; i++) {
            const values = lines[i + numVertices + 2].split(' ').map(Number);
            const vertexCount = values[0];
            if (vertexCount === 3) {
                indices.push(values[1], values[2], values[3]);
            } else if (vertexCount === 4) {
                // Convert quad to two triangles
                indices.push(values[1], values[2], values[3]);
                indices.push(values[1], values[3], values[4]);
            }
        }

        return { vertices, indices };
    }

    static createMesh(data) {
        const { vertices, indices } = this.parse(data);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }
} 