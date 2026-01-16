"""
Centralized Gemini API Service with Automatic Key Rotation
Handles rate limits by cycling through multiple API keys
"""
import os
from typing import Optional, AsyncIterator
import google.generativeai as genai
from google.generativeai import types
import asyncio

class GeminiKeyRotator:
    def __init__(self):
        # Load all available API keys (all 5 keys)
        self.api_keys = [
            os.getenv("GEMINI_API_KEY_1"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3"),
            os.getenv("GEMINI_API_KEY_4"),
            os.getenv("GEMINI_API_KEY_5"),
            os.getenv("GEMINI_API_KEY"),  # Fallback to main key
        ]
        # Filter out None values
        self.api_keys = [key for key in self.api_keys if key]
        
        if not self.api_keys:
            print("❌ No Gemini API keys found!")
            self.model = None
            self.current_key_index = -1
            return
        
        self.current_key_index = 0
        self.model = None
        self._initialize_client()
        print(f"✓ Gemini Service initialized with {len(self.api_keys)} API keys")
    
    def _initialize_client(self):
        """Initialize client with current API key"""
        if self.current_key_index >= 0 and self.current_key_index < len(self.api_keys):
            api_key = self.api_keys[self.current_key_index]
            if not api_key or api_key.strip() == "":
                print(f"⚠ API Key #{self.current_key_index+1} is empty!")
                return
            genai.configure(api_key=api_key)
            try:
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"❌ Failed to initialize model with key #{self.current_key_index+1}: {str(e)}")
                self.model = None
    
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
        if not self.model:
            return "AI service unavailable. Please configure GEMINI_API_KEY."
        
        # Default max_retries to number of API keys
        if max_retries is None:
            max_retries = len(self.api_keys)
        
        attempts = 0
        last_error = None
        
        while attempts < max_retries:
            try:
                response = await self.model.generate_content_async(prompt)
                return response.text
                
            except Exception as e:
                error_str = str(e)
                last_error = e
                
                # Print full error for debugging
                print(f"❌ Gemini API Error (Key #{self.current_key_index+1}): {error_str}")
                
                # Check if it's a recoverable error (rate limit, leaked key, quota, etc.)
                is_recoverable = (
                    "429" in error_str or 
                    "403" in error_str or 
                    "permission" in error_str.lower() or
                    "quota" in error_str.lower() or 
                    "rate" in error_str.lower() or
                    "leaked" in error_str.lower() or
                    "api key" in error_str.lower() or
                    "invalid" in error_str.lower()
                )
                
                # Special handling for quota errors
                if "429" in error_str and "quota" in error_str.lower():
                    print(f"⚠ QUOTA EXCEEDED on Key #{self.current_key_index+1}")
                    print(f"   All API keys may have exceeded their quota.")
                    print(f"   Please check: https://ai.google.dev/gemini-api/docs/rate-limits")
                
                if is_recoverable:
                    print(f"⚠ API Key #{self.current_key_index+1} encountered recoverable error: {error_str[:200]}")
                    
                    # Try rotating to next key
                    if self._rotate_key():
                        attempts += 1
                        await asyncio.sleep(1)  # Brief delay before retry
                        continue
                    else:
                        # No more keys to try
                        print(f"❌ All API keys exhausted. Last error: {error_str[:200]}")
                        if "429" in error_str and "quota" in error_str.lower():
                            return f"All API keys have exceeded their quota. Please check your Google Cloud billing or wait for quota reset. See: https://ai.google.dev/gemini-api/docs/rate-limits"
                        return f"All API keys failed. Please check your API keys. Last error: {error_str[:200]}"
                else:
                    # Non-recoverable error, don't retry
                    print(f"❌ Non-recoverable Gemini API Error: {error_str[:200]}")
                    return f"Gemini API Error: {error_str[:200]}"
            
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
        if not self.model:
            yield "AI service unavailable. Please configure GEMINI_API_KEY."
            return
        
        # Default max_retries to number of API keys
        if max_retries is None:
            max_retries = len(self.api_keys)
        
        attempts = 0
        
        while attempts < max_retries:
            try:
                # Use generate_content_stream for streaming responses
                response = await self.model.generate_content_async(prompt, stream=True)
                
                # Stream the response
                async for chunk in response:
                    if chunk.text:
                        yield chunk.text
                
                return  # Success, exit
                
            except Exception as e:
                error_str = str(e)
                
                # Check if it's a recoverable error (rate limit, leaked key, quota, etc.)
                is_recoverable = (
                    "429" in error_str or 
                    "403" in error_str or 
                    "permission" in error_str.lower() or
                    "quota" in error_str.lower() or 
                    "rate" in error_str.lower() or
                    "leaked" in error_str.lower()
                )
                
                if is_recoverable:
                    print(f"⚠ API Key #{self.current_key_index+1} error during streaming: {error_str[:100]}")
                    
                    # Try rotating to next key
                    if self._rotate_key():
                        attempts += 1
                        await asyncio.sleep(1)
                        continue
                    else:
                        yield f"All API keys failed. Please check your API keys and try again."
                        return
                else:
                    print(f"Gemini Streaming Error: {error_str}")
                    yield "I apologize, but I'm having trouble generating a response. Please try again."
                    return
            
            attempts += 1
        
        yield f"Unable to generate response after trying {max_retries} API keys. Please try again later."

# Singleton instance
gemini_service = GeminiKeyRotator()
