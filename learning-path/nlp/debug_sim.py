from sentence_transformers import SentenceTransformer, util
import torch

embedder = SentenceTransformer('all-MiniLM-L6-v2')

taxonomy = [
    "Python", "Java", "JavaScript", "React.js", "Node.js", "SQL", 
    "Machine Learning", "Data Analysis", "Project Management", 
    "Communication", "Docker", "Kubernetes", "AWS", "Azure",
    "Git", "CI/CD", "Agile Methodologies", "Scrum", "C++", 
    "Deep Learning", "Natural Language Processing", "TensorFlow", "PyTorch",
    "Algorithms", "Data Structures", "Artificial Intelligence", "DevOps"
]

candidates = ["ML", "K8s", "ML concepts", "algorithms"]

tax_embeddings = embedder.encode(taxonomy, convert_to_tensor=True)
cand_embeddings = embedder.encode(candidates, convert_to_tensor=True)

cos_sim = util.cos_sim(cand_embeddings, tax_embeddings)

for i, cand in enumerate(candidates):
    scores = cos_sim[i]
    best_score_idx = torch.argmax(scores).item()
    best_score = scores[best_score_idx].item()
    print(f"Candidate: '{cand}' -> Match: '{taxonomy[best_score_idx]}' (Score: {best_score:.4f})")
