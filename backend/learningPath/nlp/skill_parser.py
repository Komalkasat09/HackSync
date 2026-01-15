import spacy
import os
import json
from spacy.pipeline import EntityRuler
from sentence_transformers import SentenceTransformer, util
import numpy as np
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class SkillMapper:
    def __init__(self):
        logger.info("Loading models...")
        # Load spaCy model for basic NLP
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            logger.warning("Downloading en_core_web_sm...")
            spacy.cli.download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

        # Load SBERT for semantic similarity
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load Taxonomy from JSON
        taxonomy_path = os.path.join(os.path.dirname(__file__), 'skill_taxonomy.json')
        if os.path.exists(taxonomy_path):
            with open(taxonomy_path, 'r', encoding='utf-8') as f:
                taxonomy_data = json.load(f)
            self.taxonomy = [item['name'] for item in taxonomy_data]
            
            # Map aliases and variations
            self.abbreviation_map = {}
            for item in taxonomy_data:
                for alias in item.get('aliases', []):
                    self.abbreviation_map[alias] = item['name']
        else:
            logger.warning("skill_taxonomy.json not found! Using fallback.")
            self.taxonomy = ["Python", "JavaScript", "React.js", "Node.js", "Machine Learning", "Algorithms"]
            self.abbreviation_map = {"ML": "Machine Learning", "JS": "JavaScript"}

        # Pre-compute taxonomy embeddings for speed
        logger.info("Encoding taxonomy...")
        self.taxonomy_embeddings = self.embedder.encode(self.taxonomy, convert_to_tensor=True)
        
        # Setup Entity Ruler for heuristic extraction
        self.ruler = self.nlp.add_pipe("entity_ruler", before="ner")
        patterns = [{"label": "SKILL", "pattern": t} for t in self.taxonomy]
        # Also add all aliases to the entity ruler patterns
        for alias in self.abbreviation_map.keys():
            patterns.append({"label": "SKILL", "pattern": alias})
        self.ruler.add_patterns(patterns)

    def extract_candidates(self, text):
        """Extract potential skill phrases from text using spaCy."""
        doc = self.nlp(text)
        candidates = set()
        
        # 1. Use Entity Ruler matches (Exact matches)
        for ent in doc.ents:
            if ent.label_ == "SKILL":
                candidates.add(ent.text)
                
        # 2. Extract Noun Chunks (Potential semantic matches)
        # We filter out stop words and very long phrases
        for chunk in doc.noun_chunks:
            clean_chunk = chunk.text.strip()
            if len(clean_chunk.split()) <= 3: # Limit to 1-3 word phrases
                candidates.add(clean_chunk)
                
        return list(candidates)

    def normalize_and_map(self, raw_skills, threshold=0.5):
        """
        Map extracted candidates to taxonomy using semantic similarity.
        """
        if not raw_skills:
            return []
            
        mapped_skills = set()
        to_embed = []
        
        # 1. Direct Abbreviation Mapping
        for skill in raw_skills:
            # Check for direct match (case-insensitive)
            upper_skill = skill.upper() if len(skill) <= 4 else skill # Heuristic for shorthands
            found_aliased = False
            for abbr, full_name in self.abbreviation_map.items():
                if skill.lower() == abbr.lower():
                    mapped_skills.add(full_name)
                    found_aliased = True
                    break
            
            if not found_aliased:
                to_embed.append(skill)

        if not to_embed:
            return list(mapped_skills)
            
        # 2. Semantic Similarity for remaining
        candidate_embeddings = self.embedder.encode(to_embed, convert_to_tensor=True)
        cosine_scores = util.cos_sim(candidate_embeddings, self.taxonomy_embeddings)
        
        for i, candidate in enumerate(to_embed):
            scores = cosine_scores[i]
            best_score_idx = np.argmax(scores.cpu().numpy())
            best_score = scores[best_score_idx].item()
            
            if best_score > threshold:
                matched_skill = self.taxonomy[best_score_idx]
                logger.info(f"Mapped '{candidate}' -> '{matched_skill}' (Score: {best_score:.2f})")
                mapped_skills.add(matched_skill)
            else:
                logger.debug(f"Dropped '{candidate}' (Best match: {self.taxonomy[best_score_idx]} @ {best_score:.2f})")
                
        return list(mapped_skills)

    def process_resume(self, text):
        logger.info("Processing resume text...")
        candidates = self.extract_candidates(text)
        logger.info(f"Found {len(candidates)} candidate phrases.")
        
        final_skills = self.normalize_and_map(candidates)
        logger.info(f"Final mapped skills: {final_skills}")
        return final_skills

if __name__ == "__main__":
    # Example Usage
    pipeline = SkillMapper()
    
    sample_resume = """
    I am a software engineer with 5 years of experience.
    Proficient in coding with Python and JS. 
    Experience in building scalable web apps using React and Node.
    Familiar with containerization tools like Docker and orchestration with K8s.
    Good understanding of ML concepts and algorithms.
    """
    
    print("-" * 50)
    print("Raw Text:\n", sample_resume.strip())
    print("-" * 50)
    
    skills = pipeline.process_resume(sample_resume)
    
    print("-" * 50)
    print("EXTRACTED SKILLS:", skills)
