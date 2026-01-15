"""
Skill normalization utilities for consistent skill naming.

Provides deterministic, rule-based skill normalization without AI:
- Canonical casing (JavaScript, PostgreSQL, etc.)
- Alias mapping (react.js -> React, nodejs -> Node.js)
- Noise term removal (proficient in, experienced with, etc.)
"""

from typing import List, Set, Dict
import re


# Canonical skill names with proper casing
CANONICAL_SKILLS = {
    # Programming Languages
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",
    "matlab": "MATLAB",
    "shell": "Shell",
    "bash": "Bash",
    "powershell": "PowerShell",
    "perl": "Perl",
    "lua": "Lua",
    "dart": "Dart",
    "elixir": "Elixir",
    "haskell": "Haskell",
    "clojure": "Clojure",
    
    # Web Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "svelte": "Svelte",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "nuxt": "Nuxt.js",
    "nuxtjs": "Nuxt.js",
    "gatsby": "Gatsby",
    "jquery": "jQuery",
    "html": "HTML",
    "html5": "HTML5",
    "css": "CSS",
    "css3": "CSS3",
    "sass": "Sass",
    "scss": "Sass",
    "less": "Less",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "material-ui": "Material-UI",
    "mui": "Material-UI",
    "chakra": "Chakra UI",
    "webpack": "Webpack",
    "vite": "Vite",
    "rollup": "Rollup",
    "parcel": "Parcel",
    
    # Backend Frameworks
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "rails": "Ruby on Rails",
    "laravel": "Laravel",
    "asp.net": "ASP.NET",
    "dotnet": ".NET",
    ".net": ".NET",
    "nestjs": "NestJS",
    "nest.js": "NestJS",
    "koa": "Koa",
    "hapi": "Hapi",
    "gin": "Gin",
    "echo": "Echo",
    "actix": "Actix",
    
    # Databases
    "sql": "SQL",
    "nosql": "NoSQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "mariadb": "MariaDB",
    "oracle": "Oracle",
    "mssql": "SQL Server",
    "sqlserver": "SQL Server",
    "sql server": "SQL Server",
    "dynamodb": "DynamoDB",
    "cassandra": "Cassandra",
    "elasticsearch": "Elasticsearch",
    "firebase": "Firebase",
    "firestore": "Firestore",
    "supabase": "Supabase",
    "prisma": "Prisma",
    "typeorm": "TypeORM",
    "sequelize": "Sequelize",
    "mongoose": "Mongoose",
    
    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "gitlab": "GitLab",
    "github": "GitHub",
    "github actions": "GitHub Actions",
    "circleci": "CircleCI",
    "travis": "Travis CI",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "nginx": "Nginx",
    "apache": "Apache",
    "heroku": "Heroku",
    "vercel": "Vercel",
    "netlify": "Netlify",
    "cloudflare": "Cloudflare",
    
    # Tools & Technologies
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "bitbucket": "Bitbucket",
    "vscode": "VS Code",
    "visual studio code": "VS Code",
    "vim": "Vim",
    "emacs": "Emacs",
    "intellij": "IntelliJ IDEA",
    "pycharm": "PyCharm",
    "webstorm": "WebStorm",
    "eclipse": "Eclipse",
    "postman": "Postman",
    "insomnia": "Insomnia",
    "graphql": "GraphQL",
    "rest": "REST",
    "restful": "REST",
    "rest api": "REST API",
    "grpc": "gRPC",
    "websocket": "WebSocket",
    "websockets": "WebSocket",
    "api": "API",
    "microservices": "Microservices",
    "serverless": "Serverless",
    
    # Testing
    "jest": "Jest",
    "mocha": "Mocha",
    "chai": "Chai",
    "pytest": "pytest",
    "unittest": "unittest",
    "junit": "JUnit",
    "selenium": "Selenium",
    "cypress": "Cypress",
    "playwright": "Playwright",
    "puppeteer": "Puppeteer",
    "testing library": "Testing Library",
    "enzyme": "Enzyme",
    
    # Data Science & ML
    "numpy": "NumPy",
    "pandas": "pandas",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tensorflow": "TensorFlow",
    "keras": "Keras",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "opencv": "OpenCV",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "plotly": "Plotly",
    "jupyter": "Jupyter",
    "jupyter notebook": "Jupyter",
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "hadoop": "Hadoop",
    "airflow": "Apache Airflow",
    
    # Mobile
    "react native": "React Native",
    "react-native": "React Native",
    "flutter": "Flutter",
    "android": "Android",
    "ios": "iOS",
    "swift": "Swift",
    "swiftui": "SwiftUI",
    "kotlin": "Kotlin",
    "xamarin": "Xamarin",
    
    # Other
    "agile": "Agile",
    "scrum": "Scrum",
    "kanban": "Kanban",
    "jira": "Jira",
    "confluence": "Confluence",
    "slack": "Slack",
    "trello": "Trello",
    "figma": "Figma",
    "sketch": "Sketch",
    "photoshop": "Photoshop",
    "illustrator": "Illustrator",
}

# Noise terms to remove
NOISE_TERMS = {
    "proficient in",
    "experienced with",
    "knowledge of",
    "familiar with",
    "skilled in",
    "expertise in",
    "working knowledge",
    "strong background in",
    "understanding of",
    "experience in",
    "experience with",
    "background in",
    "proficiency in",
    "advanced",
    "intermediate",
    "beginner",
    "basic",
    "expert",
    "programming",
    "language",
    "framework",
    "library",
    "tool",
    "technology",
    "using",
    "with",
    "and",
    "or",
    "including",
    "such as",
}

# Words that should be kept even if they seem generic
KEEP_WORDS = {
    "go", "r", "c", "api", "sql", "css", "html", "git", "vim"
}


def normalize_skill(skill: str) -> str:
    """
    Normalize a single skill to its canonical form.
    
    Args:
        skill: Raw skill string.
    
    Returns:
        Normalized skill name with proper casing.
    """
    if not skill or not isinstance(skill, str):
        return ""
    
    # Remove extra whitespace and convert to lowercase for matching
    skill = skill.strip()
    skill_lower = skill.lower()
    
    # Check if it's in the canonical skills dictionary
    if skill_lower in CANONICAL_SKILLS:
        return CANONICAL_SKILLS[skill_lower]
    
    # If not found but is in keep_words, return with proper casing
    if skill_lower in KEEP_WORDS:
        return skill_lower.upper() if len(skill_lower) <= 2 else skill.title()
    
    # Return with title casing as fallback
    return skill.title()


def remove_noise(skill: str) -> str:
    """
    Remove noise terms from skill description.
    
    Args:
        skill: Skill string that may contain noise terms.
    
    Returns:
        Cleaned skill string.
    """
    if not skill or not isinstance(skill, str):
        return ""
    
    skill = skill.strip().lower()
    
    # Remove noise terms
    for noise in NOISE_TERMS:
        # Use word boundaries to avoid removing parts of words
        pattern = r'\b' + re.escape(noise) + r'\b'
        skill = re.sub(pattern, '', skill, flags=re.IGNORECASE)
    
    # Clean up extra whitespace and punctuation
    skill = re.sub(r'\s+', ' ', skill).strip()
    skill = skill.strip(',.;:')
    
    return skill


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract individual skills from a text containing multiple skills.
    
    Args:
        text: Text containing skills (comma or slash separated).
    
    Returns:
        List of individual skill strings.
    """
    if not text or not isinstance(text, str):
        return []
    
    # Remove noise terms first
    text = remove_noise(text)
    
    # Split by common separators
    separators = [',', '/', '|', ';', '&', ' and ', ' or ']
    skills = [text]
    
    for sep in separators:
        new_skills = []
        for skill in skills:
            parts = skill.split(sep)
            new_skills.extend(parts)
        skills = new_skills
    
    # Clean and filter
    cleaned_skills = []
    for skill in skills:
        skill = skill.strip()
        if skill and len(skill) > 1:  # At least 2 characters
            cleaned_skills.append(skill)
    
    return cleaned_skills


def normalize_skills(skills: List[str], deduplicate: bool = True) -> List[str]:
    """
    Normalize a list of skills to canonical forms.
    
    Args:
        skills: List of raw skill strings.
        deduplicate: Whether to remove duplicates (default: True).
    
    Returns:
        List of normalized skill names.
    """
    if not skills:
        return []
    
    normalized = []
    seen = set()
    
    for skill in skills:
        if not skill or not isinstance(skill, str):
            continue
        
        # Extract individual skills if multiple are in one string
        individual_skills = extract_skills_from_text(skill)
        
        for individual_skill in individual_skills:
            # Normalize the skill
            normalized_skill = normalize_skill(individual_skill)
            
            if normalized_skill:
                # Add to list if not deduplicating or not seen yet
                if not deduplicate:
                    normalized.append(normalized_skill)
                else:
                    normalized_lower = normalized_skill.lower()
                    if normalized_lower not in seen:
                        normalized.append(normalized_skill)
                        seen.add(normalized_lower)
    
    return normalized


def categorize_skills(skills: List[str]) -> Dict[str, List[str]]:
    """
    Categorize normalized skills into groups.
    
    Args:
        skills: List of normalized skill names.
    
    Returns:
        Dictionary mapping category names to lists of skills.
    """
    categories = {
        "Languages": [],
        "Frontend": [],
        "Backend": [],
        "Databases": [],
        "Cloud & DevOps": [],
        "Tools": [],
        "Data Science & ML": [],
        "Mobile": [],
        "Testing": [],
        "Other": []
    }
    
    # Language patterns
    languages = {"Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", 
                "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R"}
    
    # Frontend patterns
    frontend = {"React", "Vue.js", "Angular", "Svelte", "Next.js", "HTML", "HTML5",
               "CSS", "CSS3", "Sass", "Tailwind CSS", "Bootstrap", "jQuery", "Material-UI"}
    
    # Backend patterns
    backend = {"Node.js", "Express.js", "FastAPI", "Django", "Flask", "Spring", 
              "Spring Boot", "Ruby on Rails", "Laravel", "ASP.NET", ".NET", "NestJS"}
    
    # Database patterns
    databases = {"PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "SQL", 
                "DynamoDB", "Cassandra", "Elasticsearch", "Firebase"}
    
    # Cloud & DevOps patterns
    cloud_devops = {"AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", 
                   "Terraform", "Ansible", "Jenkins", "CI/CD", "Nginx"}
    
    # Data Science & ML patterns
    data_ml = {"NumPy", "pandas", "scikit-learn", "TensorFlow", "PyTorch", 
              "Keras", "OpenCV", "Matplotlib", "Jupyter", "Apache Spark"}
    
    # Mobile patterns
    mobile = {"React Native", "Flutter", "Android", "iOS", "SwiftUI"}
    
    # Testing patterns
    testing = {"Jest", "Mocha", "pytest", "JUnit", "Selenium", "Cypress", "Playwright"}
    
    # Tools patterns
    tools = {"Git", "GitHub", "GitLab", "VS Code", "Postman", "GraphQL", "REST", "API"}
    
    for skill in skills:
        categorized = False
        
        if skill in languages:
            categories["Languages"].append(skill)
            categorized = True
        if skill in frontend:
            categories["Frontend"].append(skill)
            categorized = True
        if skill in backend:
            categories["Backend"].append(skill)
            categorized = True
        if skill in databases:
            categories["Databases"].append(skill)
            categorized = True
        if skill in cloud_devops:
            categories["Cloud & DevOps"].append(skill)
            categorized = True
        if skill in data_ml:
            categories["Data Science & ML"].append(skill)
            categorized = True
        if skill in mobile:
            categories["Mobile"].append(skill)
            categorized = True
        if skill in testing:
            categories["Testing"].append(skill)
            categorized = True
        if skill in tools:
            categories["Tools"].append(skill)
            categorized = True
        
        if not categorized:
            categories["Other"].append(skill)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}


# Example usage
if __name__ == "__main__":
    # Test skill normalization
    raw_skills = [
        "proficient in Python",
        "react.js and nodejs",
        "experienced with PostgreSQL, MongoDB",
        "docker / kubernetes",
        "AWS (Amazon Web Services)",
        "javascript, typescript, html5",
        "FastAPI & Django",
    ]
    
    print("Raw skills:")
    for skill in raw_skills:
        print(f"  - {skill}")
    
    normalized = normalize_skills(raw_skills)
    
    print("\nNormalized skills:")
    for skill in normalized:
        print(f"  - {skill}")
    
    print("\nCategorized:")
    categories = categorize_skills(normalized)
    for category, skills in categories.items():
        print(f"\n{category}:")
        for skill in skills:
            print(f"  - {skill}")
