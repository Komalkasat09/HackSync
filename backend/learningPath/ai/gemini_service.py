import os
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class RecommendationExplanation:
    resource_title: str
    explanation: str
    relevance_score: float
    learning_path_position: str

@dataclass
class SkillAssessment:
    skill: str
    current_level: str
    target_level: str
    gap_description: str
    priority: str  # "High", "Medium", "Low"

class GeminiService:
    def __init__(self, api_key: str):
        """Initialize Gemini AI service for personalized learning guidance."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini AI service initialized successfully")

    def explain_recommendation(self, user_profile: Dict, resource: Dict, gap_analysis: Dict) -> RecommendationExplanation:
        """Generate detailed explanation for why a resource is recommended."""
        prompt = f"""
        As an expert learning advisor, explain why this resource is recommended for the user:
        
        User Profile:
        - Current Skills: {user_profile.get('skills', {})}
        - Target Role: {user_profile.get('target_role', 'Not specified')}
        - Learning Preferences: {user_profile.get('preferences', {})}
        
        Resource:
        - Title: {resource.get('title', '')}
        - Topic: {resource.get('topic', '')}
        - Type: {resource.get('type', '')}
        - Duration/Views: {resource.get('views', 'N/A')}
        
        Skill Gaps Identified: {gap_analysis}
        
        Provide a concise, personalized explanation (2-3 sentences) of:
        1. Why this resource addresses the user's specific skill gaps
        2. How it fits into their learning journey
        3. What specific outcome they can expect
        
        Format as JSON:
        {{
            "explanation": "your explanation here",
            "relevance_score": 0.85,
            "learning_path_position": "Foundation/Intermediate/Advanced"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return RecommendationExplanation(
                resource_title=resource.get('title', ''),
                explanation=result.get('explanation', ''),
                relevance_score=result.get('relevance_score', 0.0),
                learning_path_position=result.get('learning_path_position', 'Unknown')
            )
        except Exception as e:
            logger.error(f"Error generating recommendation explanation: {e}")
            return RecommendationExplanation(
                resource_title=resource.get('title', ''),
                explanation="This resource is recommended based on your skill gaps and learning goals.",
                relevance_score=0.7,
                learning_path_position="Intermediate"
            )

    def chat_with_mentor(self, user_message: str, user_profile: Dict, learning_history: List[Dict]) -> str:
        """Conversational AI mentor for learning guidance."""
        context_prompt = f"""
        You are an expert AI learning mentor. Help users with their learning journey.
        
        User Profile:
        - Skills: {user_profile.get('skills', {})}
        - Target Role: {user_profile.get('target_role', '')}
        - Learning Preferences: {user_profile.get('preferences', {})}
        
        Recent Learning History: {learning_history[-5:] if learning_history else 'None'}
        
        User Question: {user_message}
        
        Provide helpful, encouraging, and actionable advice. Be concise but supportive.
        Focus on practical steps and motivation.
        """
        
        try:
            response = self.model.generate_content(context_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error in mentor chat: {e}")
            return "I'm here to help with your learning journey! Could you please rephrase your question?"

    def assess_skill_gaps(self, current_skills: Dict, target_role_requirements: Dict) -> List[SkillAssessment]:
        """Use AI to provide detailed skill gap analysis."""
        prompt = f"""
        Analyze skill gaps for career transition:
        
        Current Skills: {current_skills}
        Target Role Requirements: {target_role_requirements}
        
        For each skill gap, provide assessment in JSON format:
        [
            {{
                "skill": "skill_name",
                "current_level": "Beginner/Intermediate/Advanced/None",
                "target_level": "required level",
                "gap_description": "specific description of what needs to be learned",
                "priority": "High/Medium/Low"
            }}
        ]
        
        Focus on the most critical skills first and provide actionable gap descriptions.
        """
        
        try:
            response = self.model.generate_content(prompt)
            assessments_data = json.loads(response.text)
            
            return [
                SkillAssessment(
                    skill=item['skill'],
                    current_level=item['current_level'],
                    target_level=item['target_level'],
                    gap_description=item['gap_description'],
                    priority=item['priority']
                )
                for item in assessments_data
            ]
        except Exception as e:
            logger.error(f"Error assessing skill gaps: {e}")
            return []

    def generate_learning_insights(self, progress_data: Dict, resources_completed: List[Dict]) -> Dict:
        """Generate personalized insights about learning progress."""
        prompt = f"""
        Analyze learning progress and provide insights:
        
        Progress Data: {progress_data}
        Completed Resources: {resources_completed}
        
        Provide insights in JSON format:
        {{
            "progress_summary": "brief summary of progress",
            "strengths": ["list of strengths observed"],
            "areas_for_improvement": ["areas needing attention"],
            "next_steps": ["recommended next actions"],
            "motivation_message": "encouraging message",
            "learning_pace": "fast/moderate/slow",
            "recommendations": ["specific recommendations"]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {
                "progress_summary": "Keep up the great work on your learning journey!",
                "next_steps": ["Continue with your current learning plan"],
                "motivation_message": "Every step forward is progress!"
            }

    def personalize_content_summary(self, resource: Dict, user_context: Dict) -> str:
        """Generate personalized summary of learning content."""
        prompt = f"""
        Create a personalized summary for this learning resource:
        
        Resource: {resource}
        User Context: {user_context}
        
        Write a 2-3 sentence summary that:
        1. Highlights what's most relevant for this user
        2. Explains the expected learning outcome
        3. Mentions time investment and difficulty level
        
        Make it encouraging and specific to their goals.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error personalizing content summary: {e}")
            return f"Learn {resource.get('topic', 'new skills')} with this {resource.get('type', 'resource')}."

    def generate_project_suggestions(self, skills_to_practice: List[str], difficulty_level: str) -> List[Dict]:
        """Suggest practical projects to reinforce learning."""
        prompt = f"""
        Suggest 3 practical projects to practice these skills: {skills_to_practice}
        Difficulty level: {difficulty_level}
        
        Format as JSON array:
        [
            {{
                "title": "project title",
                "description": "brief description",
                "skills_practiced": ["skill1", "skill2"],
                "estimated_hours": 10,
                "difficulty": "Beginner/Intermediate/Advanced",
                "key_features": ["feature1", "feature2"]
            }}
        ]
        
        Make projects practical and portfolio-worthy.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating project suggestions: {e}")
            return []