import networkx as nx
import logging
from typing import List, Dict, Set

logger = logging.getLogger(__name__)

class SkillDependencyGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._build_default_graph()

    def _build_default_graph(self):
        """
        Define the default skill dependency tree.
        Format: (Prerequisite, Target)
        """
        dependencies = [
            # Web Development
            ("HTML", "CSS"),
            ("HTML", "JavaScript"),
            ("CSS", "Tailwind CSS"),
            ("JavaScript", "React"),
            ("JavaScript", "Node.js"),
            ("JavaScript", "TypeScript"),
            ("React", "Next.js"),
            ("Node.js", "Express.js"),
            
            # Data Science / AI
            ("Python", "Data Analysis"),
            ("Python", "Pandas"),
            ("Data Analysis", "Machine Learning"),
            ("Pandas", "Machine Learning"),
            ("Machine Learning", "Deep Learning"),
            ("Deep Learning", "NLP"),
            ("Deep Learning", "Computer Vision"),
            ("Python", "Django"),
            
            # DevOps
            ("Linux", "Docker"),
            ("Docker", "Kubernetes"),
            ("Docker", "CI/CD"),
            ("Python", "AWS"), # Loose dependency
        ]
        
        self.graph.add_edges_from(dependencies)
        logger.info(f"Initialized Dependency Graph with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges.")

    def sort_skills(self, skills_to_learn: List[str]) -> List[str]:
        """
        Sort a list of skills based on their topological order in the graph.
        Skills not in the graph are placed at the end (or beginning, depending on strategy).
        """
        # 1. Create a subgraph containing only the relevant skills + their ancestors
        # However, we only care about the relative order of the requested skills.
        
        # We can simply project the graph onto the requested subset
        # But looking at ancestors is safer (e.g. if I need C but didn't ask for A, 
        # but A->B->C, knowing the structure helps).
        
        # Simpler approach: Use the full graph's topological sort and filter for the list.
        try:
            full_order = list(nx.topological_sort(self.graph))
        except nx.NetworkXUnfeasible:
            logger.error("Dependency graph has a cycle! Fallback to alphabetical.")
            return sorted(skills_to_learn)

        # Filter: Keep only skills in 'skills_to_learn', maintaining order
        sorted_skills = [s for s in full_order if s in skills_to_learn]
        
        # Add any skills that weren't in the graph (orphans)
        # We add them at the BEGINNING (assuming foundational/general) or END?
        # Let's add them at the END for now, unless specified.
        # Actually, standard independent skills (like "Git") are better early.
        # Let's put unknown skills at the front if we assume they are prerequisites we missed,
        # or at end if we assume they are advanced.
        # Let's append them.
        known_set = set(sorted_skills)
        orphans = [s for s in skills_to_learn if s not in known_set]
        
        # Heuristic: Sort orphans alphabetically
        orphans.sort()
        
        # Result: Known Ordered Skills + Orphans
        # Example: [HTML, JS, React] + [Git]
        return sorted_skills + orphans

    def get_prerequisites(self, skill: str) -> List[str]:
        """Get immediate prerequisites for a skill."""
        if skill in self.graph:
            return list(self.graph.predecessors(skill))
        return []

if __name__ == "__main__":
    # Test
    logging.basicConfig(level=logging.INFO)
    dag = SkillDependencyGraph()
    
    my_list = ["React", "Python", "Machine Learning", "HTML", "Docker", "GoLang"]
    ordered = dag.sort_skills(my_list)
    print(f"Original: {my_list}")
    print(f"Ordered:  {ordered}")
