import logging
from typing import Dict, Any
from logic.gap_analysis import SkillGap

logger = logging.getLogger(__name__)

class ExplanationGenerator:
    """
    Generates natural language explanations for recommendations.
    """
    
    def generate_explanation(self, resource: Dict[str, Any], gap: SkillGap, similarity_score: float) -> str:
        """
        Construct a reason for why this resource was chosen.
        """
        parts = []
        
        # 1. Context (Why this skill?)
        if gap.gap_type == "MISSING":
            parts.append(f"You need to learn **{gap.skill_name}** from scratch.")
        elif gap.gap_type == "PROFICIENCY_LOW":
            parts.append(f"To advance your **{gap.skill_name}** skills from {gap.current_proficiency} to {gap.target_proficiency}.")
        
        # 2. Relevance (Why this resource?)
        res_type = resource.get('type', 'Resource')
        source = resource.get('source', 'Unknown Source')
        
        if similarity_score > 0.6:
            match_strength = "perfectly matches"
        elif similarity_score > 0.4:
            match_strength = "is relevant to"
        else:
            match_strength = "covers concepts related to"
            
        parts.append(f"This {res_type} from {source} {match_strength} the topic.")
        
        # 3. Quality / Social Proof
        if resource.get('social_verified'):
            views = resource.get('views', '')
            if views:
                parts.append(f"It is highly popular with **{views}**.")
            else:
                parts.append("It is a community-verified top resource.")
        
        # 4. Source Specific Nuance
        if source == "Coursera":
            parts.append("It provides a structured curriculum with certification.")
        elif source == "GitHub":
            parts.append("It offers hands-on code examples and practical projects.")
        elif source == "YouTube":
            parts.append("It offers a visual and quick way to grasp the concepts.")
            
        return " ".join(parts)

if __name__ == "__main__":
    # Test
    gen = ExplanationGenerator()
    
    mock_gap = SkillGap("Python", "PROFICIENCY_LOW", 0.9, "Beginner", "Advanced")
    mock_res = {
        "title": "Python for Everybody",
        "source": "Coursera",
        "type": "Course",
        "social_verified": True
    }
    
    print(gen.generate_explanation(mock_res, mock_gap, 0.85))
