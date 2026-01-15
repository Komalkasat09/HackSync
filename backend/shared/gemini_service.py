"""
Centralized Gemini API Service with Automatic Key Rotation
Handles rate limits by cycling through multiple API keys
"""
import os
from typing import Optional, AsyncIterator
from google import genai
from google.genai import types
import asyncio

class GeminiKeyRotator:
    def __init__(self):
        # Load all available API keys
        self.api_keys = [
            os.getenv("GEMINI_API_KEY_1"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3"),
            os.getenv("GEMINI_API_KEY"),
        ]
        # Filter out None values
        self.api_keys = [key for key in self.api_keys if key]
        
        if not self.api_keys:
            print("❌ No Gemini API keys found!")
            self.client = None
            self.current_key_index = -1
            return
        
        self.current_key_index = 0
        self.client = None
        self._initialize_client()
        print(f"✓ Gemini Service initialized with {len(self.api_keys)} API keys")
    
    def _initialize_client(self):
        """Initialize client with current API key"""
        if self.current_key_index >= 0 and self.current_key_index < len(self.api_keys):
            self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
    
    def _rotate_key(self):
        """Rotate to next API key"""
        if len(self.api_keys) <= 1:
            print("⚠ No alternative API keys available for rotation")
            return False
        
        old_index = self.current_key_index
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._initialize_client()
        print(f"🔄 Rotated API key from #{old_index+1} to #{self.current_key_index+1}")
        return True
    
    async def generate_content(
        self, 
        prompt: str, 
        model: str = "gemini-2.5-flash",
        max_retries: int = None
    ) -> str:
        """
        Generate content with automatic key rotation on rate limit errors
        """
        if not self.client:
            return "AI service unavailable. Please configure GEMINI_API_KEY."
        
        # Default max_retries to number of API keys
        if max_retries is None:
            max_retries = len(self.api_keys)
        
        attempts = 0
        last_error = None
        
        while attempts < max_retries:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response.text
                
            except Exception as e:
                error_str = str(e)
                last_error = e
                
                # Check if it's a rate limit error (429 or quota exceeded)
                if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                    print(f"⚠ API Key #{self.current_key_index+1} hit rate limit")
                    
                    # Try rotating to next key
                    if self._rotate_key():
                        attempts += 1
                        await asyncio.sleep(1)  # Brief delay before retry
                        continue
                    else:
                        # No more keys to try
                        return f"All API keys have hit rate limits. Please try again later. Error: {error_str}"
                else:
                    # Non-rate-limit error, don't retry
                    print(f"Gemini API Error: {error_str}")
                    return f"I apologize, but I'm having trouble generating a response. Please try again."
            
            attempts += 1
        
        # All retries exhausted
        return f"Unable to generate response after trying {max_retries} API keys. Please try again later."
    
    async def generate_content_stream(
        self,
        prompt: str,
        model: str = "gemini-2.5-flash",
        max_retries: int = None
    ) -> AsyncIterator[str]:
        """
        Stream content with automatic key rotation on rate limit errors
        """
        if not self.client:
            yield "AI service unavailable. Please configure GEMINI_API_KEY."
            return
        
        # Default max_retries to number of API keys
        if max_retries is None:
            max_retries = len(self.api_keys)
        
        attempts = 0
        
        while attempts < max_retries:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["TEXT"],
                    )
                )
                
                # Stream the response
                async for chunk in response:
                    if chunk.text:
                        yield chunk.text
                
                return  # Success, exit
                
            except Exception as e:
                error_str = str(e)
                
                # Check if it's a rate limit error
                if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                    print(f"⚠ API Key #{self.current_key_index+1} hit rate limit during streaming")
                    
                    # Try rotating to next key
                    if self._rotate_key():
                        attempts += 1
                        await asyncio.sleep(1)
                        continue
                    else:
                        yield f"All API keys have hit rate limits. Please try again later."
                        return
                else:
                    print(f"Gemini Streaming Error: {error_str}")
                    yield "I apologize, but I'm having trouble generating a response. Please try again."
                    return
            
            attempts += 1
        
        yield f"Unable to generate response after trying {max_retries} API keys. Please try again later."

# Singleton instance
gemini_service = GeminiKeyRotator()
