"""
Skill clustering using Sentence Transformers embeddings.

Uses all-MiniLM-L6-v2 model to compute embeddings and cluster skills
based on cosine similarity. No LLM usage - pure embedding-based clustering.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import AgglomerativeClustering
from dataclasses import dataclass


@dataclass
class SkillCluster:
    """A cluster of related skills."""
    cluster_id: int
    skills: List[str]
    centroid_skill: str  # Most representative skill in cluster
    confidence_scores: Dict[str, float]  # Skill -> confidence score
    avg_similarity: float  # Average intra-cluster similarity


class SkillClusterer:
    """
    Cluster skills using Sentence Transformers embeddings.
    
    Uses all-MiniLM-L6-v2 for efficient, high-quality embeddings
    and agglomerative clustering based on cosine similarity.
    """
    
    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        similarity_threshold: float = 0.5,
        max_clusters: Optional[int] = None
    ):
        """
        Initialize the skill clusterer.
        
        Args:
            model_name: Sentence transformer model to use.
            similarity_threshold: Minimum cosine similarity for clustering (0-1).
            max_clusters: Maximum number of clusters. If None, determined automatically.
        """
        self.model_name = model_name
        self.similarity_threshold = similarity_threshold
        self.max_clusters = max_clusters
        self._model = None
    
    def _load_model(self) -> SentenceTransformer:
        """Lazy load the sentence transformer model."""
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model
    
    def compute_embeddings(self, skills: List[str]) -> np.ndarray:
        """
        Compute embeddings for a list of skills.
        
        Args:
            skills: List of skill names.
        
        Returns:
            Array of embeddings with shape (num_skills, embedding_dim).
        """
        model = self._load_model()
        embeddings = model.encode(skills, show_progress_bar=False)
        return embeddings
    
    def compute_similarity_matrix(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Compute pairwise cosine similarity matrix.
        
        Args:
            embeddings: Array of embeddings.
        
        Returns:
            Similarity matrix with shape (num_skills, num_skills).
        """
        return cosine_similarity(embeddings)
    
    def _find_optimal_clusters(
        self,
        similarity_matrix: np.ndarray,
        max_clusters: Optional[int] = None
    ) -> int:
        """
        Find optimal number of clusters using similarity threshold.
        
        Args:
            similarity_matrix: Pairwise similarity matrix.
            max_clusters: Maximum allowed clusters.
        
        Returns:
            Optimal number of clusters.
        """
        n_skills = len(similarity_matrix)
        
        if max_clusters and max_clusters < n_skills:
            return max_clusters
        
        # Convert similarity to distance
        distance_matrix = 1 - similarity_matrix
        
        # Use distance threshold based on similarity threshold
        distance_threshold = 1 - self.similarity_threshold
        
        # Perform hierarchical clustering with distance threshold
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=distance_threshold,
            metric='precomputed',
            linkage='average'
        )
        clustering.fit(distance_matrix)
        
        n_clusters = len(np.unique(clustering.labels_))
        
        # Ensure we have at least 1 cluster
        return max(1, n_clusters)
    
    def cluster_skills(
        self,
        skills: List[str],
        return_embeddings: bool = False
    ) -> Tuple[List[SkillCluster], Optional[np.ndarray]]:
        """
        Cluster skills based on semantic similarity.
        
        Args:
            skills: List of skill names to cluster.
            return_embeddings: Whether to return embeddings.
        
        Returns:
            Tuple of (list of skill clusters, optional embeddings array).
        """
        if not skills:
            return [], None
        
        # Handle single skill case
        if len(skills) == 1:
            cluster = SkillCluster(
                cluster_id=0,
                skills=skills,
                centroid_skill=skills[0],
                confidence_scores={skills[0]: 1.0},
                avg_similarity=1.0
            )
            embeddings = self.compute_embeddings(skills) if return_embeddings else None
            return [cluster], embeddings
        
        # Compute embeddings
        embeddings = self.compute_embeddings(skills)
        
        # Compute similarity matrix
        similarity_matrix = self.compute_similarity_matrix(embeddings)
        
        # Find optimal number of clusters
        n_clusters = self._find_optimal_clusters(similarity_matrix, self.max_clusters)
        
        # Convert similarity to distance for clustering
        distance_matrix = 1 - similarity_matrix
        
        # Perform agglomerative clustering
        clustering = AgglomerativeClustering(
            n_clusters=n_clusters,
            metric='precomputed',
            linkage='average'
        )
        cluster_labels = clustering.fit_predict(distance_matrix)
        
        # Build skill clusters
        clusters = self._build_clusters(
            skills,
            cluster_labels,
            embeddings,
            similarity_matrix
        )
        
        return clusters, embeddings if return_embeddings else None
    
    def _build_clusters(
        self,
        skills: List[str],
        cluster_labels: np.ndarray,
        embeddings: np.ndarray,
        similarity_matrix: np.ndarray
    ) -> List[SkillCluster]:
        """
        Build SkillCluster objects from clustering results.
        
        Args:
            skills: List of skill names.
            cluster_labels: Cluster assignment for each skill.
            embeddings: Skill embeddings.
            similarity_matrix: Pairwise similarity matrix.
        
        Returns:
            List of SkillCluster objects.
        """
        clusters = []
        unique_labels = np.unique(cluster_labels)
        
        for cluster_id in unique_labels:
            # Get skills in this cluster
            cluster_mask = cluster_labels == cluster_id
            cluster_indices = np.where(cluster_mask)[0]
            cluster_skills = [skills[i] for i in cluster_indices]
            
            # Calculate confidence scores (similarity to cluster centroid)
            cluster_embeddings = embeddings[cluster_indices]
            centroid = cluster_embeddings.mean(axis=0, keepdims=True)
            
            # Compute similarity of each skill to centroid
            similarities = cosine_similarity(cluster_embeddings, centroid).flatten()
            confidence_scores = {
                skill: float(sim)
                for skill, sim in zip(cluster_skills, similarities)
            }
            
            # Find most representative skill (highest similarity to centroid)
            centroid_idx = np.argmax(similarities)
            centroid_skill = cluster_skills[centroid_idx]
            
            # Calculate average intra-cluster similarity
            if len(cluster_indices) > 1:
                cluster_sim_matrix = similarity_matrix[cluster_indices][:, cluster_indices]
                # Exclude diagonal (self-similarity)
                mask = ~np.eye(len(cluster_indices), dtype=bool)
                avg_similarity = float(cluster_sim_matrix[mask].mean())
            else:
                avg_similarity = 1.0
            
            clusters.append(SkillCluster(
                cluster_id=int(cluster_id),
                skills=cluster_skills,
                centroid_skill=centroid_skill,
                confidence_scores=confidence_scores,
                avg_similarity=avg_similarity
            ))
        
        # Sort clusters by size (descending) and then by avg similarity
        clusters.sort(key=lambda c: (-len(c.skills), -c.avg_similarity))
        
        # Reassign cluster IDs after sorting
        for i, cluster in enumerate(clusters):
            cluster.cluster_id = i
        
        return clusters
    
    def find_similar_skills(
        self,
        query_skill: str,
        candidate_skills: List[str],
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Find most similar skills to a query skill.
        
        Args:
            query_skill: Skill to find similarities for.
            candidate_skills: List of candidate skills to compare against.
            top_k: Number of top similar skills to return.
        
        Returns:
            List of (skill, similarity_score) tuples, sorted by similarity.
        """
        if not candidate_skills:
            return []
        
        # Compute embeddings
        all_skills = [query_skill] + candidate_skills
        embeddings = self.compute_embeddings(all_skills)
        
        # Compute similarities
        query_embedding = embeddings[0:1]
        candidate_embeddings = embeddings[1:]
        similarities = cosine_similarity(query_embedding, candidate_embeddings)[0]
        
        # Get top-k
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = [
            (candidate_skills[i], float(similarities[i]))
            for i in top_indices
        ]
        
        return results


def cluster_and_deduplicate_skills(
    skills: List[str],
    similarity_threshold: float = 0.85,
    keep_representative: bool = True
) -> Tuple[List[str], Dict[str, List[str]]]:
    """
    Cluster skills and optionally deduplicate by keeping only representatives.
    
    Args:
        skills: List of skills to cluster.
        similarity_threshold: Threshold for considering skills as duplicates.
        keep_representative: If True, keep only the centroid skill from each cluster.
    
    Returns:
        Tuple of (deduplicated skills, mapping of representative -> similar skills).
    """
    if not skills:
        return [], {}
    
    clusterer = SkillClusterer(similarity_threshold=similarity_threshold)
    clusters, _ = clusterer.cluster_skills(skills)
    
    if keep_representative:
        # Keep only centroid skills
        deduplicated = [cluster.centroid_skill for cluster in clusters]
        
        # Build mapping of representative to all skills in cluster
        mapping = {
            cluster.centroid_skill: cluster.skills
            for cluster in clusters
        }
    else:
        # Keep all skills
        deduplicated = skills
        mapping = {skill: [skill] for skill in skills}
    
    return deduplicated, mapping


# Example usage
if __name__ == "__main__":
    # Example skills with some duplicates and related terms
    skills = [
        "Python",
        "JavaScript",
        "TypeScript",
        "React",
        "React.js",
        "Vue.js",
        "Angular",
        "Node.js",
        "Express.js",
        "Django",
        "Flask",
        "FastAPI",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
    ]
    
    print("Clustering skills...\n")
    
    clusterer = SkillClusterer(similarity_threshold=0.5)
    clusters, _ = clusterer.cluster_skills(skills)
    
    print(f"Found {len(clusters)} clusters:\n")
    
    for cluster in clusters:
        print(f"Cluster {cluster.cluster_id} (avg similarity: {cluster.avg_similarity:.3f})")
        print(f"  Representative: {cluster.centroid_skill}")
        print(f"  Skills: {', '.join(cluster.skills)}")
        print(f"  Confidence scores:")
        for skill, score in sorted(
            cluster.confidence_scores.items(),
            key=lambda x: -x[1]
        ):
            print(f"    - {skill}: {score:.3f}")
        print()
    
    # Test similarity search
    print("\nFinding skills similar to 'Python':")
    similar = clusterer.find_similar_skills("Python", skills, top_k=5)
    for skill, score in similar:
        print(f"  - {skill}: {score:.3f}")
