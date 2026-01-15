"""
Career Counselor Integration Service
Orchestrates user data + Tavily web intelligence + Gemini AI
"""
import os
from typing import List, Dict, Optional
from datetime import datetime
import google.generativeai as genai
from .tavily_service import tavily_service

class CareerCounselorService:
    def __init__(self):
        # Try multiple API key environment variables
        api_key = (
            os.getenv("GEMINI_API_KEY_1") or 
            os.getenv("GEMINI_API_KEY_2") or 
            os.getenv("GEMINI_API_KEY_3") or 
            os.getenv("GEMINI_API_KEY")
        )
        
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            print(f"✓ Gemini AI initialized successfully")
        else:
            self.model = None
            print("✗ No Gemini API key found")
    
    async def generate_response(
        self,
        user_message: str,
        user_profile: Optional[Dict] = None,
        conversation_history: List[Dict] = None,
        attachments: List[Dict] = None
    ) -> tuple[str, List[Dict]]:
        """
        Generate AI counseling response with web intelligence
        Returns: (response_text, tavily_references)
        """
        if not self.model:
            return "AI service unavailable. Please configure GEMINI_API_KEY.", []
        
        # Step 1: Gather intelligence from Tavily
        tavily_data = await self._gather_intelligence(user_message, user_profile)
        references = tavily_service.format_references(tavily_data)
        
        # Step 2: Build context-rich prompt
        prompt = self._build_counseling_prompt(
            user_message=user_message,
            user_profile=user_profile,
            tavily_data=tavily_data,
            conversation_history=conversation_history,
            attachments=attachments
        )
        
        # Step 3: Generate response with Gemini
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text, references
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return "I apologize, but I'm having trouble generating a response. Please try again.", references
    
    async def generate_streaming_response(
        self,
        user_message: str,
        user_profile: Optional[Dict] = None,
        conversation_history: List[Dict] = None,
        attachments: List[Dict] = None
    ):
        """
        Stream AI counseling response token by token
        Yields: (text_chunk, references) - references only on first chunk
        """
        if not self.model:
            yield "AI service unavailable. Please configure GEMINI_API_KEY.", []
            return
        
        # Gather intelligence first
        tavily_data = await self._gather_intelligence(user_message, user_profile)
        references = tavily_service.format_references(tavily_data)
        
        # Build prompt
        prompt = self._build_counseling_prompt(
            user_message=user_message,
            user_profile=user_profile,
            tavily_data=tavily_data,
            conversation_history=conversation_history,
            attachments=attachments
        )
        
        # Stream response
        try:
            response = await self.model.generate_content_async(
                prompt,
                stream=True
            )
            
            first_chunk = True
            async for chunk in response:
                if chunk.text:
                    # Send references only with first chunk
                    yield chunk.text, (references if first_chunk else [])
                    first_chunk = False
                    
        except Exception as e:
            print(f"Gemini Streaming Error: {str(e)}")
            yield "I apologize, but I'm having trouble generating a response. Please try again.", references
    
    async def _gather_intelligence(
        self,
        user_message: str,
        user_profile: Optional[Dict]
    ) -> Dict:
        """
        Intelligently decide what to search based on user query
        """
        message_lower = user_message.lower()
        
        # Career suggestion queries
        if any(keyword in message_lower for keyword in ["suggest", "recommend", "career", "job", "profession"]):
            if user_profile and user_profile.get("skills"):
                skills = user_profile.get("skills", [])
                interests = user_profile.get("interests", [])
                return await tavily_service.search_career_trends(skills, interests)
            else:
                # Generic career search if no profile
                return await tavily_service.search_career_trends(["technology"], ["innovation"])
        
        # Specific career queries
        elif any(keyword in message_lower for keyword in ["tell me about", "what is", "how to become"]):
            # Extract career title (simplified - can be improved)
            return await tavily_service.search_specific_career(user_message)
        
        # Skill demand queries
        elif "demand" in message_lower or "market" in message_lower:
            if user_profile and user_profile.get("skills"):
                skills = user_profile.get("skills", [])
                return await tavily_service.search_skill_demand(skills)
            else:
                return await tavily_service.search_skill_demand(["programming", "AI", "data science"])
        
        # Default: broad search
        else:
            if user_profile and user_profile.get("skills"):
                skills = user_profile.get("skills", [])[:2]
                interests = user_profile.get("interests", [])[:1]
                return await tavily_service.search_career_trends(skills, interests)
            else:
                # Generic trending careers search
                return await tavily_service.search_career_trends(["technology"], ["career growth"])
    
    def _build_counseling_prompt(
        self,
        user_message: str,
        user_profile: Optional[Dict],
        tavily_data: Dict,
        conversation_history: Optional[List[Dict]],
        attachments: Optional[List[Dict]]
    ) -> str:
        """
        Build comprehensive prompt for Gemini
        """
        prompt_parts = [
            "You are an empathetic AI Career Counselor helping professionals navigate their career paths.",
            "Your role is to provide personalized, actionable, and encouraging career guidance.",
            ""
        ]
        
        # Add user profile context (if available)
        if user_profile:
            prompt_parts.append("=== USER PROFILE ===")
            prompt_parts.append(f"Skills: {', '.join(user_profile.get('skills', []))}")
            prompt_parts.append(f"Interests: {', '.join(user_profile.get('interests', []))}")
            prompt_parts.append(f"Education: {user_profile.get('education', 'Not specified')}")
            prompt_parts.append(f"Experience: {user_profile.get('experience_years', 0)} years")
            prompt_parts.append("")
        
        # Add web intelligence
        if tavily_data.get("results"):
            prompt_parts.append("=== CURRENT MARKET INTELLIGENCE (2026) ===")
            for result in tavily_data["results"][:5]:
                prompt_parts.append(f"- {result.get('title', '')}: {result.get('content', '')[:150]}")
            prompt_parts.append("")
        
        # Add conversation history (last 5 exchanges)
        if conversation_history and len(conversation_history) > 0:
            prompt_parts.append("=== CONVERSATION HISTORY ===")
            for msg in conversation_history[-10:]:  # Last 10 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                prompt_parts.append(f"{role.upper()}: {content[:200]}")
            prompt_parts.append("")
        
        # Handle multimodal attachments
        if attachments and len(attachments) > 0:
            prompt_parts.append("=== USER ATTACHMENTS ===")
            for att in attachments:
                prompt_parts.append(f"- {att.get('type', 'unknown')}: {att.get('filename', 'unnamed')}")
            prompt_parts.append("")
        
        # Add instructions
        prompt_parts.extend([
            "=== INSTRUCTIONS ===",
            "1. Consider the user's profile data, but use your judgment on what's relevant",
            "2. Reference the market intelligence naturally (don't just list sources)",
            "3. Be conversational, empathetic, and encouraging",
            "4. Provide specific, actionable advice with clear next steps",
            "5. If suggesting careers, explain WHY they're a good fit",
            "6. Handle career anxiety with empathy and realistic optimism",
            "7. Keep responses concise but comprehensive (aim for 150-250 words)",
            "",
            f"=== USER QUESTION ===",
            user_message,
            "",
            "Now provide your counseling response:"
        ])
        
        return "\n".join(prompt_parts)

# Singleton instance
career_counselor = CareerCounselorService()
