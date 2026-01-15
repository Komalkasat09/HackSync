import json
import logging
import math
import os
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

from logic.gap_analysis import SkillGap
from logic.recommender import ContentRecommender
from logic.prerequisites import SkillDependencyGraph
from logic.explainability import ExplanationGenerator

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class LearningModule:
    module_id: int
    title: str
    description: str
    estimated_hours: int
    topics: List[str]
    resources: List[Dict]
    status: str = "LOCKED" 
    
    # Scheduling info
    week_number: int = 1
    start_date: str = ""
    end_date: str = ""
    
    # Explainability
    why_this_module: str = ""

@dataclass
class LearningPath:
    user_id: str
    target_role: str
    generated_at: str
    weekly_hours_available: int
    total_weeks: int
    modules: List[LearningModule]
    total_estimated_hours: int

class PathGenerator:
    def __init__(self, resource_file: str = None):
        # If no resource file specified, use default path relative to this file
        if resource_file is None:
            resource_file = os.path.join(os.path.dirname(__file__), '..', 'scraper', 'learning_resources.json')
        
        try:
            self.recommender = ContentRecommender(resource_file)
            logger.info(f"Resources loaded successfully from: {resource_file}")
        except Exception as e:
            logger.warning(f"Could not load resource file {resource_file}: {e}")
            # Try alternative paths
            possible_paths = [
                resource_file,
                os.path.join(os.path.dirname(__file__), '..', 'scraper', 'learning_resources.json'),
                os.path.join(os.path.dirname(__file__), '../../scraper/learning_resources.json'),
            ]
            loaded = False
            for path in possible_paths:
                if os.path.exists(path):
                    try:
                        self.recommender = ContentRecommender(path)
                        logger.info(f"Loaded resources from: {path}")
                        loaded = True
                        break
                    except Exception as inner_e:
                        logger.debug(f"Failed to load from {path}: {inner_e}")
                        continue
            if not loaded:
                logger.error(f"Could not find resources at any path. Learning paths will use fallback resources.")
                self.recommender = ContentRecommender(resource_file)
        
        self.dependency_graph = SkillDependencyGraph()
        self.explainer = ExplanationGenerator()

    def generate_path(self, user_id: str, role: str, gaps: List[SkillGap], hours_per_week: int = 10) -> LearningPath:
        logger.info(f"Generating path for {user_id} ({role}) - {hours_per_week} hrs/week...")
        
        # 1. Extract skill names from gaps
        gap_map = {g.skill_name: g for g in gaps}
        skills_to_learn = list(gap_map.keys())
        
        # 2. Sort skills based on Prerequisites
        ordered_skills = self.dependency_graph.sort_skills(skills_to_learn)
        
        modules = []
        total_hours = 0
        module_counter = 1
        
        # Scheduling state
        current_week = 1
        current_week_hours_filled = 0
        start_date_cursor = datetime.now()
        
        for skill_name in ordered_skills:
            gap = gap_map[skill_name]
            
            # --- Resource Finding ---
            resources = self.recommender.recommend(query=skill_name, top_k=3, min_score=0.25)
            
            module_explanation = ""
            
            if not resources:
                # Provide fallback resources
                description = f"Self-directed learning for {skill_name}."
                resources = [
                    {
                        "title": f"{skill_name} - Comprehensive Guide",
                        "url": f"https://www.udemy.com/search/?q={skill_name.replace(' ', '+')}",
                        "type": "course",
                        "source": "Learning Platforms",
                        "verified": False,
                        "duration_minutes": 1200,
                        "similarity_score": 0.5
                    },
                    {
                        "title": f"{skill_name} Documentation",
                        "url": "#",
                        "type": "documentation",
                        "source": "Official",
                        "verified": True,
                        "duration_minutes": 600,
                        "similarity_score": 0.5
                    }
                ]
                module_explanation = f"Start learning {skill_name} with these recommended resources."
            else:
                top_res = resources[0]
                description = f"Learn with {top_res.get('source')}: {top_res.get('title')}"
                
                # Enrich resources with explanations
                for res in resources:
                    score = res.get('similarity_score', 0)
                    res['explanation'] = self.explainer.generate_explanation(res, gap, score)
                
                # Main explanation from top resource
                module_explanation = resources[0]['explanation']
            
            # --- Time Estimation ---
            est_time = 15 if gap.gap_type == "MISSING" else 8
            
            # --- Scheduling Logic ---
            module_duration_weeks = math.ceil(est_time / hours_per_week)
            
            if current_week_hours_filled + est_time > hours_per_week:
                if current_week_hours_filled > 0:
                     current_week += 1
                     current_week_hours_filled = 0
            
            module_start_date = start_date_cursor + timedelta(weeks=(current_week - 1))
            module_end_date = module_start_date + timedelta(weeks=module_duration_weeks)
            
            module = LearningModule(
                module_id=module_counter,
                title=f"Master {skill_name}",
                description=description,
                estimated_hours=est_time,
                topics=[skill_name],
                resources=resources,
                status="LOCKED",
                week_number=current_week,
                start_date=module_start_date.strftime("%Y-%m-%d"),
                end_date=module_end_date.strftime("%Y-%m-%d"),
                why_this_module=module_explanation
            )
            
            modules.append(module)
            total_hours += est_time
            module_counter += 1
            
            current_week_hours_filled += est_time
            while current_week_hours_filled > hours_per_week:
                current_week += 1
                current_week_hours_filled -= hours_per_week

        if modules:
            modules[0].status = "UNLOCKED"

        return LearningPath(
            user_id=user_id,
            target_role=role,
            generated_at=datetime.now().isoformat(),
            weekly_hours_available=hours_per_week,
            total_weeks=current_week,
            modules=modules,
            total_estimated_hours=total_hours
        )

if __name__ == "__main__":
    from logic.gap_analysis import SkillGap
    
    mock_gaps = [
        SkillGap("Machine Learning", "MISSING", 0, "", ""),
        SkillGap("Python", "PROFICIENCY_LOW", 0, "Beginner", "Advanced"),
    ]
    
    gen = PathGenerator()
    path = gen.generate_path("u1", "AI Scientist", mock_gaps, hours_per_week=20)
    
    print("\n" + "="*60)
    print(f"PATH Explanations Test:")
    print("="*60)
    
    for mod in path.modules:
        print(f"\n[Mod {mod.module_id}] {mod.title}")
        print(f"WHY: {mod.why_this_module}")
        print(f"Top Resource Explanation: {mod.resources[0]['explanation']}")
