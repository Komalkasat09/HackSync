"""
Cytoscape-compatible graph builder for portfolio visualization.

Builds a hierarchical graph structure with:
- Core domain node
- Skill cluster nodes
- Individual skill nodes
- Edges connecting domain → clusters → skills
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re
import hashlib


@dataclass
class CytoscapeNode:
    """A node in the Cytoscape graph."""
    id: str
    label: str
    node_type: str  # 'domain', 'cluster', 'skill'
    data: Dict[str, Any]


@dataclass
class CytoscapeEdge:
    """An edge in the Cytoscape graph."""
    id: str
    source: str
    target: str
    data: Dict[str, Any]


class CytoscapeGraph:
    """Cytoscape-compatible graph structure."""
    
    def __init__(self):
        self.nodes: List[CytoscapeNode] = []
        self.edges: List[CytoscapeEdge] = []
    
    def add_node(
        self,
        id: str,
        label: str,
        node_type: str,
        **additional_data
    ) -> None:
        """Add a node to the graph."""
        node = CytoscapeNode(
            id=id,
            label=label,
            node_type=node_type,
            data=additional_data
        )
        self.nodes.append(node)
    
    def add_edge(
        self,
        source: str,
        target: str,
        **additional_data
    ) -> None:
        """Add an edge to the graph."""
        # Create stable edge ID from source and target
        edge_id = f"{source}-{target}"
        edge = CytoscapeEdge(
            id=edge_id,
            source=source,
            target=target,
            data=additional_data
        )
        self.edges.append(edge)
    
    def to_cytoscape_json(self) -> Dict[str, Any]:
        """
        Convert to Cytoscape.js JSON format.
        
        Returns:
            Dictionary in Cytoscape.js format with 'elements' array.
        """
        elements = []
        
        # Add nodes
        for node in self.nodes:
            element = {
                "data": {
                    "id": node.id,
                    "label": node.label,
                    "type": node.node_type,
                    **node.data
                }
            }
            elements.append(element)
        
        # Add edges
        for edge in self.edges:
            element = {
                "data": {
                    "id": edge.id,
                    "source": edge.source,
                    "target": edge.target,
                    **edge.data
                }
            }
            elements.append(element)
        
        return {"elements": elements}


def make_url_safe_id(text: str, prefix: str = "") -> str:
    """
    Create a stable, URL-safe identifier from text.
    
    Args:
        text: Text to convert to ID.
        prefix: Optional prefix for the ID.
    
    Returns:
        URL-safe identifier.
    """
    if not text:
        # Generate a hash for empty strings
        text = "empty"
    
    # Convert to lowercase and replace spaces/special chars with hyphens
    safe_id = re.sub(r'[^a-z0-9]+', '-', text.lower())
    
    # Remove leading/trailing hyphens
    safe_id = safe_id.strip('-')
    
    # Ensure it's not empty after cleaning
    if not safe_id:
        # Use hash as fallback
        safe_id = hashlib.md5(text.encode()).hexdigest()[:8]
    
    # Add prefix if provided
    if prefix:
        safe_id = f"{prefix}-{safe_id}"
    
    return safe_id


def build_skill_graph(
    domain: str,
    skill_clusters: List[Dict[str, Any]],
    include_confidence: bool = True
) -> CytoscapeGraph:
    """
    Build a Cytoscape-compatible hierarchical skill graph.
    
    Args:
        domain: Core professional domain.
        skill_clusters: List of skill cluster dictionaries with:
            - cluster_id: int
            - skills: List[str]
            - centroid_skill: str
            - confidence_scores: Dict[str, float]
            - avg_similarity: float
        include_confidence: Whether to include confidence scores in edge data.
    
    Returns:
        CytoscapeGraph object.
    """
    graph = CytoscapeGraph()
    
    # Add core domain node
    domain_id = make_url_safe_id(domain, "domain")
    graph.add_node(
        id=domain_id,
        label=domain,
        node_type="domain",
        level=0
    )
    
    # Add cluster and skill nodes
    for cluster in skill_clusters:
        cluster_id_num = cluster.get('cluster_id', 0)
        centroid_skill = cluster.get('centroid_skill', 'Unknown')
        skills = cluster.get('skills', [])
        confidence_scores = cluster.get('confidence_scores', {})
        avg_similarity = cluster.get('avg_similarity', 0.0)
        
        # Create cluster node ID
        cluster_id = make_url_safe_id(centroid_skill, f"cluster-{cluster_id_num}")
        
        # Add cluster node
        graph.add_node(
            id=cluster_id,
            label=centroid_skill,
            node_type="cluster",
            level=1,
            cluster_id=cluster_id_num,
            skill_count=len(skills),
            avg_similarity=avg_similarity
        )
        
        # Add edge from domain to cluster
        graph.add_edge(
            source=domain_id,
            target=cluster_id,
            edge_type="domain_cluster"
        )
        
        # Add skill nodes and edges
        for skill in skills:
            skill_id = make_url_safe_id(skill, "skill")
            confidence = confidence_scores.get(skill, 1.0)
            
            # Check if skill node already exists (in case of duplicates)
            existing_node = any(node.id == skill_id for node in graph.nodes)
            
            if not existing_node:
                # Add skill node
                graph.add_node(
                    id=skill_id,
                    label=skill,
                    node_type="skill",
                    level=2,
                    confidence=confidence
                )
            
            # Add edge from cluster to skill
            edge_data = {"edge_type": "cluster_skill"}
            if include_confidence:
                edge_data["confidence"] = confidence
            
            graph.add_edge(
                source=cluster_id,
                target=skill_id,
                **edge_data
            )
    
    return graph


def build_skill_graph_from_clusterer_output(
    domain: str,
    clusters,  # List[SkillCluster] from skill_clusterer
    include_confidence: bool = True
) -> CytoscapeGraph:
    """
    Build graph directly from SkillCluster objects.
    
    Args:
        domain: Core professional domain.
        clusters: List of SkillCluster objects from skill_clusterer.
        include_confidence: Whether to include confidence scores.
    
    Returns:
        CytoscapeGraph object.
    """
    # Convert SkillCluster objects to dictionaries
    cluster_dicts = []
    for cluster in clusters:
        cluster_dict = {
            'cluster_id': cluster.cluster_id,
            'skills': cluster.skills,
            'centroid_skill': cluster.centroid_skill,
            'confidence_scores': cluster.confidence_scores,
            'avg_similarity': cluster.avg_similarity
        }
        cluster_dicts.append(cluster_dict)
    
    return build_skill_graph(domain, cluster_dicts, include_confidence)


def build_flat_skill_graph(
    domain: str,
    skills: List[str]
) -> CytoscapeGraph:
    """
    Build a flat graph without clustering (domain → skills directly).
    
    Args:
        domain: Core professional domain.
        skills: List of skill names.
    
    Returns:
        CytoscapeGraph object.
    """
    graph = CytoscapeGraph()
    
    # Add core domain node
    domain_id = make_url_safe_id(domain, "domain")
    graph.add_node(
        id=domain_id,
        label=domain,
        node_type="domain",
        level=0
    )
    
    # Add skill nodes and edges directly to domain
    for skill in skills:
        skill_id = make_url_safe_id(skill, "skill")
        
        graph.add_node(
            id=skill_id,
            label=skill,
            node_type="skill",
            level=1,
            confidence=1.0
        )
        
        graph.add_edge(
            source=domain_id,
            target=skill_id,
            edge_type="domain_skill"
        )
    
    return graph


def export_graph_to_json(graph: CytoscapeGraph, output_path: str) -> None:
    """
    Export graph to JSON file.
    
    Args:
        graph: CytoscapeGraph object.
        output_path: Path to output JSON file.
    """
    import json
    
    cytoscape_json = graph.to_cytoscape_json()
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cytoscape_json, f, indent=2)


# Example usage
if __name__ == "__main__":
    import json
    
    # Example skill clusters
    skill_clusters = [
        {
            'cluster_id': 0,
            'skills': ['Python', 'JavaScript', 'TypeScript'],
            'centroid_skill': 'JavaScript',
            'confidence_scores': {
                'Python': 0.85,
                'JavaScript': 0.95,
                'TypeScript': 0.90
            },
            'avg_similarity': 0.75
        },
        {
            'cluster_id': 1,
            'skills': ['React', 'Vue.js', 'Angular'],
            'centroid_skill': 'React',
            'confidence_scores': {
                'React': 0.98,
                'Vue.js': 0.88,
                'Angular': 0.82
            },
            'avg_similarity': 0.85
        },
        {
            'cluster_id': 2,
            'skills': ['Node.js', 'Express.js', 'FastAPI'],
            'centroid_skill': 'Node.js',
            'confidence_scores': {
                'Node.js': 0.95,
                'Express.js': 0.92,
                'FastAPI': 0.78
            },
            'avg_similarity': 0.80
        },
        {
            'cluster_id': 3,
            'skills': ['PostgreSQL', 'MySQL', 'MongoDB'],
            'centroid_skill': 'PostgreSQL',
            'confidence_scores': {
                'PostgreSQL': 0.96,
                'MySQL': 0.90,
                'MongoDB': 0.83
            },
            'avg_similarity': 0.82
        }
    ]
    
    # Build graph
    domain = "Web Development"
    graph = build_skill_graph(domain, skill_clusters)
    
    # Convert to Cytoscape JSON
    cytoscape_json = graph.to_cytoscape_json()
    
    print("Cytoscape Graph JSON:")
    print(json.dumps(cytoscape_json, indent=2))
    
    print(f"\nGraph statistics:")
    print(f"  Total nodes: {len(graph.nodes)}")
    print(f"  Total edges: {len(graph.edges)}")
    print(f"  Domain nodes: {sum(1 for n in graph.nodes if n.node_type == 'domain')}")
    print(f"  Cluster nodes: {sum(1 for n in graph.nodes if n.node_type == 'cluster')}")
    print(f"  Skill nodes: {sum(1 for n in graph.nodes if n.node_type == 'skill')}")
    
    # Example IDs
    print("\nExample stable IDs:")
    print(f"  Domain: {make_url_safe_id('Web Development', 'domain')}")
    print(f"  Skill: {make_url_safe_id('React.js', 'skill')}")
    print(f"  Cluster: {make_url_safe_id('JavaScript', 'cluster-0')}")
