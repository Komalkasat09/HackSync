import json
import os

def generate_role_requirements():
    """
    Generates a role-to-skills mapping JSON with proficiency levels (0.0 to 1.0).
    """
    role_requirements = {
        "ML Engineer": {
            "Python": 0.9,
            "Machine Learning": 0.9,
            "Deep Learning": 0.8,
            "Algorithms": 0.8,
            "SQL": 0.6,
            "Mathematics": 0.8,
            "PyTorch": 0.7,
            "Docker": 0.5
        },
        "Backend Developer": {
            "Python": 0.8,
            "Node.js": 0.8,
            "SQL": 0.9,
            "Docker": 0.7,
            "Kubernetes": 0.6,
            "Algorithms": 0.7,
            "Git": 0.8,
            "System Design": 0.8
        },
        "Data Scientist": {
            "Python": 0.9,
            "Data Analysis": 0.9,
            "Machine Learning": 0.8,
            "SQL": 0.8,
            "Statistics": 0.9,
            "Pandas": 0.9,
            "Visualization": 0.7
        },
        "Full Stack Developer": {
            "JavaScript": 0.9,
            "React.js": 0.9,
            "Node.js": 0.8,
            "HTML": 0.9,
            "CSS": 0.8,
            "SQL": 0.7,
            "TypeScript": 0.7,
            "Git": 0.8
        },
        "DevOps Engineer": {
            "Docker": 0.9,
            "Kubernetes": 0.9,
            "Linux": 0.9,
            "CI/CD": 0.9,
            "AWS": 0.8,
            "Python": 0.6,
            "Terraform": 0.8
        }
    }

    output_path = os.path.join(os.path.dirname(__file__), 'role_requirements.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(role_requirements, f, indent=4)
    
    print(f"Successfully generated Role Requirements at: {output_path}")

if __name__ == "__main__":
    generate_role_requirements()
