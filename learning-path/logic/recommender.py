import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, util
import torch

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class ContentRecommender:
    def __init__(self, resource_file: str = 'scraper/learning_resources.json', model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the Content-Based Recommender.
        :param resource_file: Path to the JSON file containing learning resources.
        :param model_name: Name of the SentenceTransformer model to use.
        """
        self.resource_file = resource_file
        self.resources = self._load_resources()
        
        logger.info(f"Loading embedding model: {model_name}...")
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = SentenceTransformer(model_name, device=self.device)
        
        logger.info("Generating embeddings for resources...")
        self.resource_embeddings = self._embed_resources()
        logger.info("Recommender initialized successfully.")

    def _load_resources(self) -> List[Dict[str, Any]]:
        try:
            with open(self.resource_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data)} resources.")
                return data
        except FileNotFoundError:
            logger.error(f"Resource file not found: {self.resource_file}")
            return []

    def _embed_resources(self) -> torch.Tensor:
        """
        Create embeddings for all resources based on their Title and Description.
        """
        if not self.resources:
            return torch.tensor([])

        # Combine title and description (if available) for richer context
        texts = [
            f"{res.get('title', '')} {res.get('description', '')} {res.get('topic', '')}" 
            for res in self.resources
        ]
        
        embeddings = self.model.encode(texts, convert_to_tensor=True, show_progress_bar=True)
        return embeddings

    def recommend(self, query: str, top_k: int = 5, min_score: float = 0.3) -> List[Dict[str, Any]]:
        """
        Recommend resources based on a query (e.g., a missing skill).
        
        :param query: The search query or skill name.
        :param top_k: Number of recommendations to return.
        :param min_score: Minimum similarity threshold.
        :return: List of recommended resources with similarity scores.
        """
        if not self.resources:
            logger.warning("No resources available to recommend.")
            return []

        # Encode the query
        query_embedding = self.model.encode(query, convert_to_tensor=True)

        # Compute Cosine Similarity
        # query_embedding shape: [embedding_dim]
        # resource_embeddings shape: [num_resources, embedding_dim]
        cos_scores = util.cos_sim(query_embedding, self.resource_embeddings)[0]

        # Get top_k results
        top_results = torch.topk(cos_scores, k=min(top_k, len(self.resources)))
        
        recommendations = []
        for score, idx in zip(top_results.values, top_results.indices):
            if score < min_score:
                continue
                
            resource = self.resources[idx.item()].copy()
            resource['similarity_score'] = score.item()
            recommendations.append(resource)

        return recommendations

if __name__ == "__main__":
    # Test the Recommender
    recommender = ContentRecommender()
    
    test_queries = ["Learn Python Programming", "Machine Learning Basics", "How to use Docker"]
    
    print("\n" + "="*60)
    for q in test_queries:
        print(f"Query: '{q}'")
        recs = recommender.recommend(q, top_k=3)
        if not recs:
            print("  No relevant resources found.")
        for r in recs:
            print(f"  [{r['similarity_score']:.2f}] {r['title']} ({r.get('type', 'Unknown')})")
        print("-" * 60)
