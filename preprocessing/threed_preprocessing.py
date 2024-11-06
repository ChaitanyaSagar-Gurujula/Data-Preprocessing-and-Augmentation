import numpy as np
import trimesh
import io

class ThreeDPreprocessor:
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

    def normalize_scale(self, mesh):
        """Normalize the scale of the mesh"""
        try:
            bounds = mesh.bounds
            scale = 1.0 / np.max(bounds[1] - bounds[0])
            mesh.apply_scale(scale)
            return mesh
        except Exception as e:
            print(f"Error in normalize_scale: {str(e)}")
            raise

    def center_model(self, mesh):
        """Center the model at origin"""
        try:
            centroid = mesh.centroid
            translation = -centroid
            mesh.apply_translation(translation)
            return mesh
        except Exception as e:
            print(f"Error in center_model: {str(e)}")
            raise

    def simplify_mesh(self, mesh, ratio):
        """Simplify the mesh while preserving shape"""
        try:
            # Calculate target number of vertices
            target_vertices = int(len(mesh.vertices) * float(ratio))
            if target_vertices < 4:  # Ensure we don't simplify too much
                target_vertices = 4

            # Use trimesh's built-in simplification
            vertices = mesh.vertices
            faces = mesh.faces
            
            # Simple vertex clustering simplification
            simplified_vertices, simplified_faces = trimesh.remesh.collapse_short_edges(
                vertices, 
                faces,
                ratio
            )
            
            # Create new mesh with simplified geometry
            simplified_mesh = trimesh.Trimesh(
                vertices=simplified_vertices,
                faces=simplified_faces
            )
            
            return simplified_mesh
        except Exception as e:
            print(f"Error in simplify_mesh: {str(e)}")
            raise

    def smooth_surface(self, mesh, iterations):
        """Apply Laplacian smoothing to the surface"""
        try:
            smoothed_mesh = mesh.copy()
            for _ in range(int(iterations)):
                vertices = smoothed_mesh.vertices
                # Simple Laplacian smoothing
                vertex_neighbors = trimesh.graph.vertex_adjacency_graph(smoothed_mesh.faces)
                new_vertices = vertices.copy()
                
                for vertex_idx in range(len(vertices)):
                    # Get neighboring vertices
                    neighbors = vertex_neighbors[vertex_idx]
                    if len(neighbors) > 0:
                        # Average position of neighbors
                        neighbor_positions = vertices[list(neighbors)]
                        new_vertices[vertex_idx] = np.mean(neighbor_positions, axis=0)
                
                smoothed_mesh.vertices = new_vertices
            return smoothed_mesh
        except Exception as e:
            print(f"Error in smooth_surface: {str(e)}")
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

    def preprocess(self, model_data, options):
        """Preprocess the 3D model with selected options"""
        try:
            print("Starting preprocessing...")
            print(f"Received options: {options}")

            mesh = self._load_off_file(model_data)
            processed_mesh = mesh.copy()
            steps = {}

            if options.get('normalize'):
                print("Applying normalization...")
                processed_mesh = self.normalize_scale(processed_mesh)
                steps['Normalize'] = self._mesh_to_off_string(processed_mesh)

            if options.get('center'):
                print("Centering model...")
                processed_mesh = self.center_model(processed_mesh)
                steps['Center'] = self._mesh_to_off_string(processed_mesh)

            if options.get('simplify'):
                print("Simplifying mesh...")
                ratio = float(options.get('simplify_ratio', 0.5))
                processed_mesh = self.simplify_mesh(processed_mesh, ratio)
                steps['Simplify'] = self._mesh_to_off_string(processed_mesh)

            if options.get('smooth'):
                print("Smoothing surface...")
                iterations = int(options.get('smooth_iterations', 1))
                processed_mesh = self.smooth_surface(processed_mesh, iterations)
                steps['Smooth'] = self._mesh_to_off_string(processed_mesh)

            return {
                'preprocessing_steps': steps,
                'processed_model': self._mesh_to_off_string(processed_mesh)
            }

        except Exception as e:
            print(f"Error in preprocess: {str(e)}")
            raise 