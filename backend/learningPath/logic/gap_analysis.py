from typing import List, Dict, Tuple
import logging
from dataclasses import dataclass
import numpy as np

# Adjust imports based on project structure
try:
    from nlp.skill_parser import SkillMapper
    from models.user_profile import UserProfile
except ImportError:
    # Fallback if running directly from logic/ folder
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from nlp.skill_parser import SkillMapper
    from models.user_profile import UserProfile

logger = logging.getLogger(__name__)

@dataclass
class SkillGap:
    skill_name: str
    gap_type: str  # 'MISSING' or 'PROFICIENCY_LOW'
    similarity_score: float
    current_proficiency: str
    target_proficiency: str = "Intermediate" # Default assumption
    reason: str = ""

class GapAnalyzer:
    PROFICIENCY_MAP = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
        "Expert": 4
    }

    def __init__(self, skill_mapper: SkillMapper = None):
        """
        Initialize the analyzer.
        :param skill_mapper: Optional existing instance of SkillMapper to avoid reloading models.
        """
        if skill_mapper:
            self.mapper = skill_mapper
        else:
            logger.info("Initializing new SkillMapper for GapAnalyzer...")
            self.mapper = SkillMapper()

    def _get_proficiency_score(self, level: str) -> int:
        return self.PROFICIENCY_MAP.get(level, 0)

    def analyze(self, user: UserProfile, target_skills: List[str], min_proficiency_required: str = "Intermediate") -> List[SkillGap]:
        """
        Compare user skills against target skills using vector similarity.
        Returns a ranked list of gaps.
        """
        gaps: List[SkillGap] = []
        
        # 1. Normalize Target Skills via Taxonomy
        # We assume the input might be raw text, so let's map it first
        # But if they are already clean, the mapper handles them too
        # Using the mapper's normalize function is safer
        
        # Actually, for gap analysis, we want to check each detailed target requirement.
        # If we normalize too early, we might lose nuance (e.g. "Django" -> "Python").
        # However, our SkillMapper maps to a fixed taxonomy.
        # Let's try to stick to the raw target request compared to User Skills
        
        user_skill_names = list(user.skills.keys())
        if not user_skill_names:
            # Total gap
            for t in target_skills:
                gaps.append(SkillGap(t, "MISSING", 0.0, "None", min_proficiency_required, "User has no recorded skills"))
            return gaps

        # Encode lists
        # Target embeddings
        target_embeddings = self.mapper.embedder.encode(target_skills, convert_to_tensor=True)
        # User embeddings
        user_embeddings = self.mapper.embedder.encode(user_skill_names, convert_to_tensor=True)

        # 2. Pairwise Comparison
        from sentence_transformers import util
        # Matrix: [num_targets x num_user_skills]
        cosine_scores = util.cos_sim(target_embeddings, user_embeddings)
        
        target_proficiency_score = self._get_proficiency_score(min_proficiency_required)

        for i, target in enumerate(target_skills):
            # Find best match for this specific target skill
            scores = cosine_scores[i]
            best_match_idx = np.argmax(scores.cpu().numpy())
            best_score = scores[best_match_idx].item()
            best_matching_user_skill = user_skill_names[best_match_idx]
            
            # Thresholds
            SIMILARITY_THRESHOLD = 0.7  # If similarity < 0.7, we assume they don't have it
            
            if best_score < SIMILARITY_THRESHOLD:
                # Case 1: Skill is completely missing
                gaps.append(SkillGap(
                    skill_name=target,
                    gap_type="MISSING",
                    similarity_score=best_score,
                    current_proficiency="None",
                    reason=f"No similar skill found. Closest was '{best_matching_user_skill}' ({best_score:.2f})"
                ))
            else:
                # Case 2: Skill exists (semantically), check proficiency
                user_skill_obj = user.skills[best_matching_user_skill]
                user_prof_score = self._get_proficiency_score(user_skill_obj.proficiency)
                
                if user_prof_score < target_proficiency_score:
                    gaps.append(SkillGap(
                        skill_name=target, # We keep target name
                        gap_type="PROFICIENCY_LOW",
                        similarity_score=best_score,
                        current_proficiency=user_skill_obj.proficiency,
                        reason=f"Matched with '{best_matching_user_skill}' but proficiency is too low."
                    ))
        
        # 3. Ranking
        # Primary Sort: MISSING > PROFICIENCY_LOW
        # Secondary Sort: Similarity Score (lower similarity = bigger gap for MISSING)
        #                 For Proficiency, maybe just importance (not implemented yet)
        
        def rank_key(gap: SkillGap):
            # Tuples are compared element by element
            # 1. Type Priority (0 for Missing, 1 for Proficiency)
            type_score = 0 if gap.gap_type == "MISSING" else 1
            
            # 2. Similarity (Ascending)
            # If Missing, lower similarity is "worse" (more urgent to learn?) 
            # Actually, "Missing completely" is equal severity.
            # Let's just group by type.
            return (type_score, gap.similarity_score)

        gaps.sort(key=rank_key)
        
        return gaps

if __name__ == "__main__":
    # Test
    logging.basicConfig(level=logging.INFO)
    
    # 1. Setup User
    user = UserProfile("u1", "Test User", "test@test.com")
    user.add_skill("Python", "Beginner") # Low proficiency
    user.add_skill("React", "Advanced")
    
    # 2. Requirements
    target_role_skills = [
        "Python",           # Has it, but Beginner (Gap Expected)
        "Machine Learning", # Missing (Gap Expected)
        "React.js",         # Has it (React ~= React.js), Advanced (No Gap)
        "Docker"            # Missing (Gap Expected)
    ]
    
    analyzer = GapAnalyzer()
    
    print("\n" + "="*50)
    print("Running Gap Analysis...")
    print("User Skills:", [f"{s.name} ({s.proficiency})" for s in user.skills.values()])
    print("Target Skills:", target_role_skills)
    print("="*50 + "\n")
    
    detected_gaps = analyzer.analyze(user, target_role_skills, min_proficiency_required="Intermediate")
    
    for g in detected_gaps:
        print(f"[{g.gap_type}] {g.skill_name}")
        print(f"  Reason: {g.reason}")
        print(f"  Current: {g.current_proficiency} | Target: {g.target_proficiency}")
        print("-" * 30)
