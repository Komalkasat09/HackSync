"""
Static HTML portfolio renderer using Jinja2.

Generates a single deployable HTML file with:
- Generated content
- Embedded skill graph
- Cytoscape.js visualization
"""

from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, Template
from pathlib import Path
import json


class PortfolioRenderer:
    """Render portfolio data to static HTML."""
    
    def __init__(self, template_path: Optional[str] = None):
        """
        Initialize the portfolio renderer.
        
        Args:
            template_path: Path to custom template directory. If None, uses default template.
        """
        self.template_path = template_path
        self.default_template = self._get_default_template()
    
    def _get_default_template(self) -> str:
        """Get default HTML template."""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ name }} - {{ domain }} Portfolio</title>
    
    <!-- Cytoscape.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js"></script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: white;
            padding: 40px 20px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #7f8c8d;
            margin-bottom: 10px;
        }
        
        .domain-tag {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-top: 10px;
        }
        
        section {
            background: white;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .about-text {
            font-size: 1.05rem;
            line-height: 1.8;
            color: #555;
        }
        
        #skill-graph {
            width: 100%;
            height: 500px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #fafafa;
        }
        
        .project-card, .experience-card {
            background: #f9f9f9;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        
        .project-card:last-child, .experience-card:last-child {
            margin-bottom: 0;
        }
        
        .project-title, .experience-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .experience-meta {
            color: #7f8c8d;
            font-size: 0.95rem;
            margin-bottom: 15px;
        }
        
        .company {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .project-section {
            margin-bottom: 15px;
        }
        
        .project-label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .project-text, .experience-text {
            color: #555;
            line-height: 1.6;
        }
        
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
        }
        
        .tech-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85rem;
        }
        
        .project-url {
            display: inline-block;
            margin-top: 10px;
            color: #3498db;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .project-url:hover {
            text-decoration: underline;
        }
        
        .stars {
            color: #f39c12;
            font-size: 0.9rem;
            margin-left: 10px;
        }
        
        footer {
            text-align: center;
            padding: 20px;
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }
            
            h2 {
                font-size: 1.5rem;
            }
            
            #skill-graph {
                height: 400px;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>{{ name }}</h1>
        {% if current_role %}
        <div class="subtitle">{{ current_role }}</div>
        {% endif %}
        <div class="domain-tag">{{ domain }}</div>
    </header>
    
    <div class="container">
        <!-- About Section -->
        <section id="about">
            <h2>About</h2>
            <p class="about-text">{{ about }}</p>
        </section>
        
        <!-- Skills Visualization -->
        <section id="skills">
            <h2>Skills & Expertise</h2>
            <div id="skill-graph"></div>
        </section>
        
        {% if projects %}
        <!-- Projects Section -->
        <section id="projects">
            <h2>Projects</h2>
            {% for project in projects %}
            <div class="project-card">
                <div class="project-title">
                    {{ project.name }}
                    {% if project.stars %}
                    <span class="stars">★ {{ project.stars }}</span>
                    {% endif %}
                </div>
                
                {% if project.summary %}
                <div class="project-section">
                    <div class="project-label">Problem</div>
                    <div class="project-text">{{ project.summary.problem }}</div>
                </div>
                
                <div class="project-section">
                    <div class="project-label">Solution</div>
                    <div class="project-text">{{ project.summary.solution }}</div>
                </div>
                
                <div class="project-section">
                    <div class="project-label">Impact</div>
                    <div class="project-text">{{ project.summary.impact }}</div>
                </div>
                {% elif project.description %}
                <div class="project-text">{{ project.description }}</div>
                {% endif %}
                
                {% if project.tech_stack %}
                <div class="tech-stack">
                    {% for tech in project.tech_stack %}
                    <span class="tech-tag">{{ tech }}</span>
                    {% endfor %}
                </div>
                {% endif %}
                
                {% if project.url %}
                <a href="{{ project.url }}" class="project-url" target="_blank">View Project →</a>
                {% endif %}
            </div>
            {% endfor %}
        </section>
        {% endif %}
        
        {% if experiences %}
        <!-- Experience Section -->
        <section id="experience">
            <h2>Experience</h2>
            {% for exp in experiences %}
            <div class="experience-card">
                <div class="experience-title">{{ exp.role }}</div>
                <div class="experience-meta">
                    <span class="company">{{ exp.company }}</span>
                    {% if exp.start_date and exp.end_date %}
                    <span> | {{ exp.start_date }} - {{ exp.end_date }}</span>
                    {% endif %}
                </div>
                {% if exp.summary %}
                <div class="experience-text">{{ exp.summary }}</div>
                {% endif %}
            </div>
            {% endfor %}
        </section>
        {% endif %}
    </div>
    
    <footer>
        <p>Generated with AI-powered portfolio generator</p>
    </footer>
    
    <script>
        // Embedded skill graph data
        const graphData = {{ graph_data|tojson }};
        
        // Cytoscape.js configuration
        const cy = cytoscape({
            container: document.getElementById('skill-graph'),
            
            elements: graphData.elements,
            
            style: [
                // Domain node style
                {
                    selector: 'node[type="domain"]',
                    style: {
                        'background-color': '#2c3e50',
                        'label': 'data(label)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '18px',
                        'font-weight': 'bold',
                        'width': 120,
                        'height': 120,
                        'text-wrap': 'wrap',
                        'text-max-width': 100
                    }
                },
                // Cluster node style
                {
                    selector: 'node[type="cluster"]',
                    style: {
                        'background-color': '#3498db',
                        'label': 'data(label)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '14px',
                        'font-weight': '600',
                        'width': 80,
                        'height': 80,
                        'text-wrap': 'wrap',
                        'text-max-width': 70
                    }
                },
                // Skill node style
                {
                    selector: 'node[type="skill"]',
                    style: {
                        'background-color': '#ecf0f1',
                        'border-width': 2,
                        'border-color': '#95a5a6',
                        'label': 'data(label)',
                        'color': '#2c3e50',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '11px',
                        'width': 50,
                        'height': 50,
                        'text-wrap': 'wrap',
                        'text-max-width': 45
                    }
                },
                // Edge style
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#bdc3c7',
                        'target-arrow-color': '#bdc3c7',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'opacity': 0.6
                    }
                },
                // Highlight on hover
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 4,
                        'border-color': '#e74c3c'
                    }
                }
            ],
            
            layout: {
                name: 'breadthfirst',
                directed: true,
                spacingFactor: 1.5,
                padding: 30,
                animate: true,
                animationDuration: 500,
                fit: true
            },
            
            // Interaction options
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            minZoom: 0.5,
            maxZoom: 2
        });
        
        // Add interactivity
        cy.on('tap', 'node', function(evt) {
            const node = evt.target;
            console.log('Selected:', node.data('label'), node.data('type'));
        });
        
        // Highlight connected nodes on hover
        cy.on('mouseover', 'node', function(evt) {
            const node = evt.target;
            node.connectedEdges().style('line-color', '#3498db');
            node.connectedEdges().style('width', 3);
        });
        
        cy.on('mouseout', 'node', function(evt) {
            const node = evt.target;
            node.connectedEdges().style('line-color', '#bdc3c7');
            node.connectedEdges().style('width', 2);
        });
    </script>
</body>
</html>'''
    
    def render(
        self,
        name: str,
        domain: str,
        about: str,
        graph_data: Dict[str, Any],
        current_role: Optional[str] = None,
        projects: Optional[list] = None,
        experiences: Optional[list] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        Render portfolio to HTML.
        
        Args:
            name: Person's name.
            domain: Professional domain.
            about: About section text.
            graph_data: Cytoscape graph data (from graph_builder).
            current_role: Optional current job title.
            projects: Optional list of project dictionaries.
            experiences: Optional list of experience dictionaries.
            output_path: Optional path to save HTML file.
        
        Returns:
            Rendered HTML string.
        """
        # Load template
        if self.template_path and Path(self.template_path).exists():
            env = Environment(loader=FileSystemLoader(str(Path(self.template_path).parent)))
            template = env.get_template(Path(self.template_path).name)
        else:
            template = Template(self.default_template)
        
        # Prepare context
        context = {
            'name': name,
            'domain': domain,
            'about': about,
            'current_role': current_role,
            'graph_data': graph_data,
            'projects': projects or [],
            'experiences': experiences or []
        }
        
        # Render
        html = template.render(**context)
        
        # Save to file if path provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html)
        
        return html
    
    def render_from_portfolio_data(
        self,
        portfolio_content: Dict[str, Any],
        graph_data: Dict[str, Any],
        resume_data: Dict[str, Any],
        project_data: Optional[list] = None,
        domain: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        Render portfolio from structured data.
        
        Args:
            portfolio_content: Generated portfolio content with 'about', 'projects', 'experiences'.
            graph_data: Cytoscape graph data.
            resume_data: Parsed resume data with 'name', 'current_role', etc.
            project_data: Optional enriched project data.
            domain: Optional professional domain.
            output_path: Optional path to save HTML file.
        
        Returns:
            Rendered HTML string.
        """
        name = resume_data.get('name', 'Professional')
        current_role = resume_data.get('current_role')
        
        if not domain:
            domain = 'Software Development'
        
        # Combine portfolio content with project data
        projects = []
        if project_data and portfolio_content.get('projects'):
            for i, proj_data in enumerate(project_data):
                if i < len(portfolio_content['projects']):
                    summary = portfolio_content['projects'][i]
                    projects.append({
                        'name': proj_data.get('name', 'Project'),
                        'description': proj_data.get('description'),
                        'tech_stack': proj_data.get('tech_stack', []),
                        'url': proj_data.get('url'),
                        'stars': proj_data.get('stars'),
                        'summary': {
                            'problem': summary.get('problem') if isinstance(summary, dict) else getattr(summary, 'problem', ''),
                            'solution': summary.get('solution') if isinstance(summary, dict) else getattr(summary, 'solution', ''),
                            'impact': summary.get('impact') if isinstance(summary, dict) else getattr(summary, 'impact', '')
                        }
                    })
        elif project_data:
            projects = project_data
        
        # Prepare experiences
        experiences = []
        exp_summaries = portfolio_content.get('experiences', [])
        resume_experiences = resume_data.get('experience', [])
        
        for i, exp in enumerate(resume_experiences):
            if isinstance(exp, dict):
                exp_dict = {
                    'company': exp.get('company', ''),
                    'role': exp.get('role', ''),
                    'start_date': exp.get('start_date', ''),
                    'end_date': exp.get('end_date', ''),
                    'summary': None
                }
                
                if i < len(exp_summaries):
                    summary = exp_summaries[i]
                    exp_dict['summary'] = summary.get('summary') if isinstance(summary, dict) else getattr(summary, 'summary', '')
                
                experiences.append(exp_dict)
        
        return self.render(
            name=name,
            domain=domain,
            about=portfolio_content.get('about', ''),
            graph_data=graph_data,
            current_role=current_role,
            projects=projects,
            experiences=experiences,
            output_path=output_path
        )


# Example usage
if __name__ == "__main__":
    # Example data
    example_graph = {
        "elements": [
            {"data": {"id": "domain-web-dev", "label": "Web Development", "type": "domain"}},
            {"data": {"id": "cluster-0", "label": "Frontend", "type": "cluster"}},
            {"data": {"id": "skill-react", "label": "React", "type": "skill"}},
            {"data": {"id": "skill-vue", "label": "Vue.js", "type": "skill"}},
            {"data": {"id": "domain-web-dev-cluster-0", "source": "domain-web-dev", "target": "cluster-0"}},
            {"data": {"id": "cluster-0-skill-react", "source": "cluster-0", "target": "skill-react"}},
            {"data": {"id": "cluster-0-skill-vue", "source": "cluster-0", "target": "skill-vue"}}
        ]
    }
    
    example_projects = [
        {
            'name': 'E-commerce Platform',
            'description': 'Full-stack web application',
            'tech_stack': ['React', 'Node.js', 'PostgreSQL'],
            'url': 'https://github.com/user/project',
            'stars': 120,
            'summary': {
                'problem': 'Small businesses needed an affordable online store solution.',
                'solution': 'Built a scalable platform with React frontend and Node.js backend.',
                'impact': 'Enabled 50+ businesses to establish online presence.'
            }
        }
    ]
    
    example_experiences = [
        {
            'company': 'Tech Corp',
            'role': 'Senior Software Engineer',
            'start_date': '2020',
            'end_date': 'Present',
            'summary': 'Led development of microservices architecture and mentored junior developers.'
        }
    ]
    
    # Render
    renderer = PortfolioRenderer()
    html = renderer.render(
        name='Alex Johnson',
        domain='Web Development',
        about='Alex Johnson is a software engineer specializing in web development with expertise in React, Node.js, and cloud infrastructure. With over 5 years of experience, Alex has built scalable applications serving thousands of users. Focused on clean code, performance optimization, and mentoring teams to deliver high-quality solutions. Experienced in full-stack development, CI/CD pipelines, and agile methodologies. Passionate about creating efficient and user-friendly web applications that solve real-world problems.',
        current_role='Senior Software Engineer',
        graph_data=example_graph,
        projects=example_projects,
        experiences=example_experiences,
        output_path='portfolio.html'
    )
    
    print("Portfolio rendered successfully!")
    print(f"Output file: portfolio.html")
    print(f"HTML length: {len(html)} characters")
