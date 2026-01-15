from PyPDF2 import PdfReader
from models.schemas import ResumeData, PersonalInfo, WorkExperience, Education, Skill, Project, Certification, SocialLinks
from typing import Optional, Dict, Any
import json
import re

class ResumeParserService:
    """Service for parsing resume files (PDF, JSON)"""
    
    async def parse_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Error parsing PDF: {str(e)}")
    
    async def parse_json(self, file_path: str) -> ResumeData:
        """Parse structured JSON resume"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Map JSON to ResumeData model
            return self._map_json_to_resume_data(data)
        except Exception as e:
            raise ValueError(f"Error parsing JSON: {str(e)}")
    
    async def parse_json_from_dict(self, data: Dict[Any, Any]) -> ResumeData:
        """Parse resume data from dictionary"""
        return self._map_json_to_resume_data(data)
    
    def _map_json_to_resume_data(self, data: Dict[Any, Any]) -> ResumeData:
        """Map JSON data to ResumeData model"""
        
        # Extract personal info
        personal_info = PersonalInfo(
            full_name=data.get('name', 'Unknown'),
            title=data.get('title', data.get('headline', '')),
            bio=data.get('bio', data.get('summary', '')),
            location=data.get('location'),
            phone=data.get('phone'),
            email=data.get('email', 'contact@example.com'),
            social_links=SocialLinks(
                github=data.get('github'),
                linkedin=data.get('linkedin'),
                twitter=data.get('twitter'),
                website=data.get('website'),
                email=data.get('email')
            ),
            profile_image=data.get('profile_image')
        )
        
        # Extract work experience
        experience = []
        for exp in data.get('experience', []):
            experience.append(WorkExperience(
                company=exp.get('company', ''),
                position=exp.get('position', exp.get('title', '')),
                location=exp.get('location'),
                start_date=exp.get('start_date', exp.get('startDate', '')),
                end_date=exp.get('end_date', exp.get('endDate')),
                current=exp.get('current', False),
                description=exp.get('description', ''),
                achievements=exp.get('achievements', exp.get('highlights', []))
            ))
        
        # Extract education
        education = []
        for edu in data.get('education', []):
            education.append(Education(
                institution=edu.get('institution', edu.get('school', '')),
                degree=edu.get('degree', ''),
                field=edu.get('field', edu.get('major', '')),
                start_date=edu.get('start_date', edu.get('startDate', '')),
                end_date=edu.get('end_date', edu.get('endDate')),
                gpa=edu.get('gpa'),
                description=edu.get('description')
            ))
        
        # Extract skills
        skills = []
        for skill_item in data.get('skills', []):
            if isinstance(skill_item, str):
                skills.append(Skill(name=skill_item))
            elif isinstance(skill_item, dict):
                skills.append(Skill(
                    name=skill_item.get('name', ''),
                    level=skill_item.get('level'),
                    category=skill_item.get('category')
                ))
        
        # Extract projects
        projects = []
        for proj in data.get('projects', []):
            projects.append(Project(
                name=proj.get('name', ''),
                description=proj.get('description', ''),
                technologies=proj.get('technologies', proj.get('tech', [])),
                url=proj.get('url', proj.get('demo')),
                github_url=proj.get('github_url', proj.get('github', proj.get('repo'))),
                image=proj.get('image'),
                highlights=proj.get('highlights', [])
            ))
        
        # Extract certifications
        certifications = []
        for cert in data.get('certifications', []):
            certifications.append(Certification(
                name=cert.get('name', ''),
                issuer=cert.get('issuer', cert.get('organization', '')),
                date=cert.get('date', ''),
                credential_id=cert.get('credential_id', cert.get('id')),
                credential_url=cert.get('credential_url', cert.get('url'))
            ))
        
        return ResumeData(
            personal_info=personal_info,
            summary=data.get('summary', data.get('about')),
            experience=experience,
            education=education,
            skills=skills,
            projects=projects,
            certifications=certifications
        )
    
    async def extract_structured_data_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract structured data from plain text resume
        This is a basic implementation - can be enhanced with NLP/ML
        """
        
        # Basic extraction patterns
        data = {
            'name': self._extract_name(text),
            'email': self._extract_email(text),
            'phone': self._extract_phone(text),
            'summary': '',
            'experience': [],
            'education': [],
            'skills': []
        }
        
        # Extract sections
        sections = self._split_into_sections(text)
        
        # Process each section
        for section_name, section_content in sections.items():
            if 'experience' in section_name.lower() or 'work' in section_name.lower():
                data['experience'] = self._extract_experience(section_content)
            elif 'education' in section_name.lower():
                data['education'] = self._extract_education(section_content)
            elif 'skill' in section_name.lower():
                data['skills'] = self._extract_skills(section_content)
            elif 'summary' in section_name.lower() or 'about' in section_name.lower():
                data['summary'] = section_content.strip()
        
        return data
    
    def _extract_name(self, text: str) -> str:
        """Extract name from resume text (first line usually)"""
        lines = text.strip().split('\n')
        return lines[0].strip() if lines else "Unknown"
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number using regex"""
        phone_pattern = r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else None
    
    def _split_into_sections(self, text: str) -> Dict[str, str]:
        """Split resume into sections based on common headers"""
        sections = {}
        current_section = "Header"
        current_content = []
        
        common_headers = [
            'experience', 'work experience', 'employment',
            'education', 'academic',
            'skills', 'technical skills',
            'projects', 'certifications', 'certificates',
            'summary', 'about', 'objective'
        ]
        
        for line in text.split('\n'):
            line_lower = line.strip().lower()
            
            # Check if line is a section header
            is_header = False
            for header in common_headers:
                if header in line_lower and len(line.strip()) < 50:
                    # Save previous section
                    if current_content:
                        sections[current_section] = '\n'.join(current_content)
                    
                    # Start new section
                    current_section = line.strip()
                    current_content = []
                    is_header = True
                    break
            
            if not is_header:
                current_content.append(line)
        
        # Save last section
        if current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _extract_experience(self, text: str) -> list:
        """Extract work experience from text"""
        # This is a simplified version - can be enhanced with NLP
        experiences = []
        # Split by double newlines or date patterns
        entries = re.split(r'\n\s*\n', text)
        
        for entry in entries:
            if len(entry.strip()) > 20:  # Ignore very short entries
                experiences.append({
                    'company': '',
                    'position': '',
                    'description': entry.strip(),
                    'start_date': '',
                    'end_date': None
                })
        
        return experiences
    
    def _extract_education(self, text: str) -> list:
        """Extract education from text"""
        education = []
        entries = re.split(r'\n\s*\n', text)
        
        for entry in entries:
            if len(entry.strip()) > 20:
                education.append({
                    'institution': '',
                    'degree': '',
                    'field': '',
                    'start_date': '',
                    'end_date': None
                })
        
        return education
    
    def _extract_skills(self, text: str) -> list:
        """Extract skills from text"""
        # Split by common delimiters
        skills_text = re.sub(r'[•\-\*]', ',', text)
        skills = [s.strip() for s in skills_text.split(',') if s.strip()]
        return skills[:20]  # Limit to 20 skills

# Create singleton instance
resume_parser = ResumeParserService()
