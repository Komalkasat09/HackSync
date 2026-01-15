import json
import os

def build_skill_taxonomy():
    """
    Creates a structured skill taxonomy for the Learning Path system.
    """
    taxonomy = [
        {
            "category": "Frontend Development",
            "name": "JavaScript",
            "difficulty_level": "Beginner",
            "aliases": ["JS", "ES6", "Vanilla JS"],
            "related_skills": ["HTML", "CSS", "React.js", "TypeScript"]
        },
        {
            "category": "Frontend Development",
            "name": "React.js",
            "difficulty_level": "Intermediate",
            "aliases": ["React", "ReactJS"],
            "related_skills": ["JavaScript", "Redux", "Next.js"]
        },
        {
            "category": "Backend Development",
            "name": "Python",
            "difficulty_level": "Beginner",
            "aliases": ["Py"],
            "related_skills": ["Django", "Flask", "FastAPI", "Pandas"]
        },
        {
            "category": "Backend Development",
            "name": "Node.js",
            "difficulty_level": "Intermediate",
            "aliases": ["Node", "NodeJS"],
            "related_skills": ["Express.js", "JavaScript", "MongoDB"]
        },
        {
            "category": "Cloud & DevOps",
            "name": "Docker",
            "difficulty_level": "Intermediate",
            "aliases": ["Containerization"],
            "related_skills": ["Kubernetes", "CI/CD", "AWS"]
        },
        {
            "category": "Cloud & DevOps",
            "name": "Kubernetes",
            "difficulty_level": "Advanced",
            "aliases": ["K8s", "Kube"],
            "related_skills": ["Docker", "Helm", "Cloud Computing"]
        },
        {
            "category": "AI & Machine Learning",
            "name": "Machine Learning",
            "difficulty_level": "Intermediate",
            "aliases": ["ML", "Statistical Learning"],
            "related_skills": ["Python", "Deep Learning", "Data Science", "Algorithms"]
        },
        {
            "category": "AI & Machine Learning",
            "name": "Deep Learning",
            "difficulty_level": "Advanced",
            "aliases": ["DL", "Neural Networks"],
            "related_skills": ["TensorFlow", "PyTorch", "Computer Vision"]
        },
        {
            "category": "Data & Databases",
            "name": "SQL",
            "difficulty_level": "Beginner",
            "aliases": ["Relational Databases", "PostgreSQL", "MySQL"],
            "related_skills": ["Database Design", "Data Analysis", "ORM"]
        },
        {
            "category": "Computer Science Core",
            "name": "Algorithms",
            "difficulty_level": "Intermediate",
            "aliases": ["DSA", "Competitive Programming"],
            "related_skills": ["Data Structures", "Big O", "Problem Solving"]
        }
    ]

    output_path = os.path.join(os.path.dirname(__file__), 'skill_taxonomy.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(taxonomy, f, indent=4)
    
    print(f"Successfully created structured taxonomy at: {output_path}")
    print(f"Total categories: {len(set(item['category'] for item in taxonomy))}")
    print(f"Total skills defined: {len(taxonomy)}")

if __name__ == "__main__":
    build_skill_taxonomy()
