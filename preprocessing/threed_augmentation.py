import numpy as np
import trimesh
import io
from scipy.spatial.transform import Rotation

class ThreeDAugmenter:
    def __init__(self):
        pass

    def _load_off_file(self, data):
        """Load OFF file data into trimesh"""
        temp_buffer = io.StringIO(data)
        try:
            mesh = trimesh.load(temp_buffer, file_type='off')
            return mesh
        except Exception as e:
            print(f"Error loading OFF file: {str(e)}")
            raise

    def random_rotation(self, mesh):
        """Apply random rotation to the mesh"""
        try:
            # Generate random rotation matrix
            rotation = Rotation.random()
            mesh.apply_transform(rotation.as_matrix())
            return mesh
        except Exception as e:
            print(f"Error in random_rotation: {str(e)}")
            raise

    def random_scale(self, mesh, factor):
        """Apply random scaling within range"""
        try:
            scale = 1.0 + np.random.uniform(-factor, factor)
            mesh.apply_scale(scale)
            return mesh
        except Exception as e:
            print(f"Error in random_scale: {str(e)}")
            raise

    def add_surface_noise(self, mesh, amplitude):
        """Add random noise to vertex positions"""
        try:
            vertices = mesh.vertices
            noise = np.random.normal(0, amplitude, vertices.shape)
            mesh.vertices = vertices + noise
            return mesh
        except Exception as e:
            print(f"Error in add_surface_noise: {str(e)}")
            raise

    def random_deformation(self, mesh, strength):
        """Apply random deformation to the mesh"""
        try:
            vertices = mesh.vertices
            # Create a smooth deformation field
            noise = np.random.normal(0, strength, vertices.shape)
            # Apply smoothing to the noise
            vertex_neighbors = trimesh.graph.vertex_adjacency_graph(mesh.faces)
            for _ in range(3):  # Smooth the noise field
                new_noise = noise.copy()
                for vertex_idx in range(len(vertices)):
                    neighbors = vertex_neighbors[vertex_idx]
                    if len(neighbors) > 0:
                        neighbor_noise = noise[list(neighbors)]
                        new_noise[vertex_idx] = np.mean(neighbor_noise, axis=0)
                noise = new_noise
            
            mesh.vertices = vertices + noise
            return mesh
        except Exception as e:
            print(f"Error in random_deformation: {str(e)}")
            raise

    def _mesh_to_off_string(self, mesh):
        """Convert mesh to OFF format string"""
        try:
            vertices = mesh.vertices
            faces = mesh.faces

            off_str = "OFF\n"
            off_str += f"{len(vertices)} {len(faces)} 0\n"

            # Add vertices
            for vertex in vertices:
                off_str += f"{vertex[0]} {vertex[1]} {vertex[2]}\n"

            # Add faces
            for face in faces:
                off_str += f"3 {face[0]} {face[1]} {face[2]}\n"

            return off_str
        except Exception as e:
            print(f"Error in _mesh_to_off_string: {str(e)}")
            raise

    def augment(self, model_data, options):
        """Apply selected augmentation techniques"""
        try:
            print("Starting augmentation...")
            print(f"Received options: {options}")

            mesh = self._load_off_file(model_data)
            augmented_mesh = mesh.copy()
            steps = {}

            if options.get('3d-rotation', {}).get('enabled'):
                print("Applying random rotation...")
                augmented_mesh = self.random_rotation(augmented_mesh)
                steps['Rotation'] = self._mesh_to_off_string(augmented_mesh)

            if options.get('scale', {}).get('enabled'):
                print("Applying random scaling...")
                factor = float(options['scale'].get('factor', 0.2))
                augmented_mesh = self.random_scale(augmented_mesh, factor)
                steps['Scale'] = self._mesh_to_off_string(augmented_mesh)

            if options.get('noise', {}).get('enabled'):
                print("Adding surface noise...")
                amplitude = float(options['noise'].get('amplitude', 0.01))
                augmented_mesh = self.add_surface_noise(augmented_mesh, amplitude)
                steps['Noise'] = self._mesh_to_off_string(augmented_mesh)

            if options.get('deform', {}).get('enabled'):
                print("Applying random deformation...")
                strength = float(options['deform'].get('strength', 0.1))
                augmented_mesh = self.random_deformation(augmented_mesh, strength)
                steps['Deform'] = self._mesh_to_off_string(augmented_mesh)

            return {
                'augmentation_steps': steps,
                'augmented_model': self._mesh_to_off_string(augmented_mesh)
            }

        except Exception as e:
            print(f"Error in augment: {str(e)}")
            raise