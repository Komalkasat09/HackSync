import numpy as np
import logging
import math
from typing import List, Dict, Set, Any

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class RecommenderEvaluator:
    """
    Computes ranking metrics for recommendation systems.
    """
    
    @staticmethod
    def precision_at_k(recommended: List[Any], relevant: Set[Any], k: int) -> float:
        """
        Compute Precision@K.
        Prop of recommended items in the top-k set that are relevant.
        """
        if k <= 0: return 0.0
        
        # Consider only top k
        top_k = recommended[:k]
        
        # Count matches
        hits = sum(1 for item in top_k if item in relevant)
        
        return hits / k

    @staticmethod
    def recall_at_k(recommended: List[Any], relevant: Set[Any], k: int) -> float:
        """
        Compute Recall@K.
        Prop of relevant items that are found in the top-k recommendations.
        """
        if not relevant: return 0.0
        if k <= 0: return 0.0
        
        top_k = recommended[:k]
        hits = sum(1 for item in top_k if item in relevant)
        
        return hits / len(relevant)

    @staticmethod
    def ndcg_at_k(recommended: List[Any], relevant: Set[Any], k: int) -> float:
        """
        Compute NDCG@K (Normalized Discounted Cumulative Gain).
        Assumes binary relevance (1 if in set, 0 otherwise).
        """
        if not relevant: return 0.0
        if k <= 0: return 0.0
        
        top_k = recommended[:k]
        
        # 1. Compute DCG
        dcg = 0.0
        for i, item in enumerate(top_k):
            if item in relevant:
                # log2(i+2) because i starts at 0, formula usually i+1 where i is rank (1-based)
                # rank = i + 1. log2(rank + 1).
                dcg += 1.0 / np.log2((i + 1) + 1)
                
        # 2. Compute IDCG (Ideal DCG)
        # In ideal case, all 'min(len(relevant), k)' items are at the top
        num_relevant_at_k = min(len(relevant), k)
        idcg = 0.0
        for i in range(num_relevant_at_k):
            idcg += 1.0 / np.log2((i + 1) + 1)
            
        if idcg == 0.0:
            return 0.0
            
        return dcg / idcg

    def evaluate(self, model, test_set: List[Dict], k_list: List[int] = [1, 3, 5]):
        """
        Run evaluation on a test set.
        
        test_set format:
        [
            {
                "query": "search term",
                "relevant_urls": {"http://...", "http://..."}
            },
            ...
        ]
        """
        logger.info(f"Starting evaluation on {len(test_set)} test cases...")
        
        metrics = {k: {'precision': [], 'recall': [], 'ndcg': []} for k in k_list}
        
        for case in test_set:
            query = case['query']
            relevant_urls = set(case['relevant_urls'])
            
            # Get recommendations
            # We assume model has a recommend() method returning list of dicts with 'url'
            recs = model.recommend(query, top_k=max(k_list))
            rec_urls = [r['url'] for r in recs]
            
            for k in k_list:
                p = self.precision_at_k(rec_urls, relevant_urls, k)
                r = self.recall_at_k(rec_urls, relevant_urls, k)
                n = self.ndcg_at_k(rec_urls, relevant_urls, k)
                
                metrics[k]['precision'].append(p)
                metrics[k]['recall'].append(r)
                metrics[k]['ndcg'].append(n)
                
        # Aggregate results
        results = {}
        for k, vals in metrics.items():
            results[f"P@{k}"] = np.mean(vals['precision'])
            results[f"R@{k}"] = np.mean(vals['recall'])
            results[f"NDCG@{k}"] = np.mean(vals['ndcg'])
            
        return results

if __name__ == "__main__":
    # Integration Test with existing ContentRecommender
    from logic.recommender import ContentRecommender
    
    # 1. Initialize Model
    # Note: Ensure you have resources loaded
    recommender = ContentRecommender()
    
    # 2. Create a "Ground Truth" Test Set
    # Since we don't have labeled data, we'll manually define some "Correct" matches
    # found in our current database (simulating labeled data)
    test_data = [
        {
            "query": "Python",
            "relevant_urls": {
                "https://www.coursera.org/learn/python-for-applied-data-science-ai", # "Python for Data Science..."
                "https://github.com/vinta/awesome-python",
                "https://www.freecodecamp.org/news/freecodecamps-new-python-certification-is-now-live/" 
            }
        },
        {
            "query": "Machine Learning",
            "relevant_urls": {
                "https://www.coursera.org/learn/python-for-applied-data-science-ai", # Contains keywords
                "https://www.freecodecamp.org/news/become-an-ai-researcher/"
            }
        }
    ]
    
    evaluator = RecommenderEvaluator()
    results = evaluator.evaluate(recommender, test_data, k_list=[1, 3, 5])
    
    print("\n" + "="*50)
    print("EVALUATION RESULTS")
    print("="*50)
    for metric, value in results.items():
        print(f"{metric}: {value:.4f}")
