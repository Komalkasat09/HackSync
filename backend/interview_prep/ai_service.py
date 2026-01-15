"""AI Service for Interview Question Generation and Answer Evaluation"""
import google.generativeai as genai
import json
import os
from typing import List, Dict, Optional
from .schema import InterviewQuestion

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AIInterviewService:
    """Service for AI-powered interview question generation and evaluation"""
    
    @staticmethod
    def generate_questions(
        role: str,
        skills: List[str],
        experience_level: str,
        company: Optional[str] = None,
        num_questions: int = 10
    ) -> List[InterviewQuestion]:
        """Generate personalized interview questions using Gemini AI"""
        
        if not GEMINI_API_KEY:
            # Return dummy questions if no API key
            return AIInterviewService._get_dummy_questions()
        
        try:
            prompt = f"""Generate {num_questions} interview questions for a {role} position.

Experience level: {experience_level}
Skills: {', '.join(skills) if skills else 'General programming'}
Company: {company or 'Tech Company'}

Requirements:
- Mix technical, behavioral, and situational questions
- Tailor questions to the candidate's skills and experience level
- For {experience_level} level: {'focus on fundamentals' if experience_level == 'junior' else 'include advanced concepts and system design' if experience_level == 'senior' else 'balance fundamentals and practical application'}

Return ONLY valid JSON array (no markdown, no explanations):
[
  {{
    "question": "detailed interview question",
    "type": "technical|behavioral|situational",
    "difficulty": "easy|medium|hard",
    "hints": ["hint1", "hint2", "hint3"]
  }}
]

Question distribution:
- 50% technical questions about: {', '.join(skills[:3]) if skills else 'programming concepts'}
- 30% behavioral questions (use STAR method framework)
- 20% problem-solving/situational questions
"""

            # Use gemini-1.5-flash which has better free tier support
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            questions_data = json.loads(response_text)
            
            # Convert to InterviewQuestion objects
            questions = []
            for q in questions_data[:num_questions]:  # Ensure we get exactly num_questions
                questions.append(InterviewQuestion(
                    question=q.get('question', ''),
                    type=q.get('type', 'technical'),
                    difficulty=q.get('difficulty', 'medium'),
                    hints=q.get('hints', []),
                    sample_answer=None
                ))
            
            return questions
            
        except Exception as e:
            print(f"AI question generation failed: {str(e)}")
            return AIInterviewService._get_dummy_questions()
    
    @staticmethod
    def evaluate_answer(
        question: str,
        question_type: str,
        user_answer: str,
        expected_topics: Optional[List[str]] = None
    ) -> Dict:
        """Evaluate user's interview answer using Gemini AI"""
        
        if not GEMINI_API_KEY:
            # Return mock evaluation if no API key
            return AIInterviewService._get_mock_evaluation()
        
        try:
            prompt = f"""Evaluate this interview answer:

Question: {question}
Question Type: {question_type}
User's Answer: {user_answer}
{f'Expected Topics: {", ".join(expected_topics)}' if expected_topics else ''}

Provide detailed evaluation as JSON:
{{
  "technical_score": 8.5,  // 0-10 scale
  "communication_score": 9.0,  // 0-10 scale
  "completeness_score": 7.5,  // 0-10 scale
  "confidence_score": 8.0,  // 0-10 scale based on answer clarity
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "detailed_feedback": "detailed paragraph explaining the evaluation",
  "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Evaluation criteria:
- Technical accuracy and depth
- Communication clarity and structure
- Completeness of answer
- Use of examples and context
- For behavioral questions: STAR method usage
"""

            # Use gemini-1.5-flash which has better free tier support
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            evaluation = json.loads(response_text)
            return evaluation
            
        except Exception as e:
            print(f"AI answer evaluation failed: {str(e)}")
            return AIInterviewService._get_mock_evaluation()
    
    @staticmethod
    def _get_dummy_questions() -> List[InterviewQuestion]:
        """Fallback dummy questions when AI is not available"""
        return [
            InterviewQuestion(
                question="Tell me about yourself and your experience with software development",
                type="behavioral",
                difficulty="easy",
                hints=["Structure using present-past-future", "Focus on relevant experience", "Mention key achievements"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="Explain the difference between REST and GraphQL APIs. When would you use each?",
                type="technical",
                difficulty="medium",
                hints=["Discuss query flexibility", "Compare data fetching approaches", "Mention use cases"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="Describe a challenging technical problem you solved recently",
                type="behavioral",
                difficulty="medium",
                hints=["Use STAR method (Situation, Task, Action, Result)", "Highlight problem-solving skills", "Mention technologies used"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="How would you design a URL shortener service like bit.ly?",
                type="technical",
                difficulty="hard",
                hints=["Consider database design", "Discuss scalability", "Mention collision handling"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="What is your approach to debugging a production issue?",
                type="situational",
                difficulty="medium",
                hints=["Mention logging and monitoring", "Discuss systematic approach", "Include communication with team"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="Explain the concept of async/await and how it differs from callbacks",
                type="technical",
                difficulty="medium",
                hints=["Compare syntax", "Discuss error handling", "Mention readability benefits"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="Tell me about a time you had to work with a difficult team member",
                type="behavioral",
                difficulty="medium",
                hints=["Use STAR method", "Focus on resolution", "Show empathy and communication skills"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="How do you ensure code quality in your projects?",
                type="situational",
                difficulty="easy",
                hints=["Mention testing strategies", "Discuss code reviews", "Include CI/CD practices"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="What are the principles of object-oriented programming?",
                type="technical",
                difficulty="easy",
                hints=["List the 4 main principles", "Provide examples", "Explain benefits"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="How do you stay updated with new technologies and industry trends?",
                type="behavioral",
                difficulty="easy",
                hints=["Mention learning resources", "Discuss practical application", "Show continuous learning mindset"],
                sample_answer=None
            ),
        ]
    
    @staticmethod
    def _get_mock_evaluation() -> Dict:
        """Fallback mock evaluation when AI is not available"""
        return {
            "technical_score": 8.2,
            "communication_score": 8.5,
            "completeness_score": 7.8,
            "confidence_score": 8.4,
            "strengths": [
                "Clear communication",
                "Good technical understanding",
                "Well-structured answer"
            ],
            "weaknesses": [
                "Could provide more specific examples",
                "Depth of explanation could be improved"
            ],
            "detailed_feedback": "Your answer demonstrates a solid understanding of the topic. You communicated clearly and covered the main points. To improve, consider providing more specific examples from your experience and diving deeper into technical details.",
            "improvement_suggestions": [
                "Practice using the STAR method for behavioral questions",
                "Include more concrete examples from your projects",
                "Elaborate on the 'why' behind your technical decisions"
            ]
        }
