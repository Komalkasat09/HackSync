"""
Gemini AI client wrapper service.

This module provides a wrapper around the Google Generative AI API (Gemini)
with support for system instructions, JSON-only output, schema validation,
and automatic retry logic.
"""

import os
import json
import time
from typing import Optional, Dict, Any, List
from enum import Enum
import google.genai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class GeminiModel(str, Enum):
    """Available Gemini models."""
    FLASH_2_5 = "models/gemini-2.5-flash"
    PRO_2_5 = "models/gemini-2.5-pro"
    FLASH_2_0 = "models/gemini-2.0-flash"


class GeminiClientError(Exception):
    """Base exception for Gemini client errors."""
    pass


class GeminiClient:
    """
    Wrapper for Google Generative AI (Gemini) with enhanced features.
    
    Features:
    - Automatic API key loading from environment
    - System-style instructions support
    - JSON-only output enforcement
    - JSON schema validation
    - Automatic retry logic
    - Malformed response handling
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = GeminiModel.FLASH_2_5,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        timeout: int = 60
    ):
        """
        Initialize the Gemini client.
        
        Args:
            api_key: Google AI API key. If None, loads from GEMINI_API_KEY env var.
            model_name: Model to use (default: gemini-1.5-flash).
            max_retries: Maximum number of retry attempts for failed requests.
            retry_delay: Delay in seconds between retries.
            timeout: Request timeout in seconds.
        
        Raises:
            GeminiClientError: If API key is not provided or found in environment.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise GeminiClientError(
                "GEMINI_API_KEY not found. Please set it in environment variables or pass it to the constructor."
            )
        
        self.model_name = model_name
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.timeout = timeout
        
        # Initialize the client
        self.client = genai.Client(api_key=self.api_key)
        
    def _create_config(
        self,
        system_instruction: Optional[str] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Create a configuration dict for generation.
        
        Args:
            system_instruction: System-level instruction for the model.
            response_schema: JSON schema for response validation.
            temperature: Override temperature setting.
        
        Returns:
            Configuration dictionary.
        """
        config = {
            "temperature": temperature if temperature is not None else 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        # Force JSON output if schema is provided
        if response_schema:
            config["response_mime_type"] = "application/json"
            config["response_schema"] = response_schema
        
        result = {"config": config}
        
        if system_instruction:
            result["system_instruction"] = system_instruction
        
        return result
    
    def _validate_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Validate and parse JSON response.
        
        Args:
            response_text: Raw response text from the model.
        
        Returns:
            Parsed JSON object.
        
        Raises:
            GeminiClientError: If response is not valid JSON.
        """
        try:
            # Try to parse the response as JSON
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            # Try to extract JSON from markdown code blocks
            if "```json" in response_text:
                try:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_str = response_text[json_start:json_end].strip()
                    return json.loads(json_str)
                except (json.JSONDecodeError, ValueError):
                    pass
            
            # Try to find JSON object in the response
            if "{" in response_text and "}" in response_text:
                try:
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    json_str = response_text[json_start:json_end]
                    return json.loads(json_str)
                except (json.JSONDecodeError, ValueError):
                    pass
            
            raise GeminiClientError(f"Invalid JSON response: {str(e)}\nResponse: {response_text[:500]}")
    
    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None,
        expect_json: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a response from the Gemini model with automatic retries.
        
        Args:
            prompt: User prompt/question.
            system_instruction: System-level instruction for the model.
            response_schema: JSON schema for structured output.
            temperature: Sampling temperature (0.0-1.0). If None, uses default (0.7).
            expect_json: Whether to expect and parse JSON response.
        
        Returns:
            Parsed JSON response or dict with 'text' key if not expecting JSON.
        
        Raises:
            GeminiClientError: If all retry attempts fail or response is invalid.
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Create configuration
                gen_config = self._create_config(
                    system_instruction=system_instruction,
                    response_schema=response_schema,
                    temperature=temperature
                )
                
                # Generate response
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=gen_config.get("config")
                )
                
                # Check if response was blocked
                if not response.text:
                    if hasattr(response, 'prompt_feedback'):
                        raise GeminiClientError(
                            f"Response blocked: {response.prompt_feedback}"
                        )
                    raise GeminiClientError("Empty response received from model")
                
                # Parse and return response
                if expect_json or response_schema:
                    return self._validate_json_response(response.text)
                else:
                    return {"text": response.text}
                
            except GeminiClientError:
                raise
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    # Wait before retrying
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
        
        # All retries exhausted
        raise GeminiClientError(
            f"Failed after {self.max_retries} attempts. Last error: {str(last_error)}"
        )
    
    def generate_with_schema(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate a response with a specific JSON schema.
        
        Args:
            prompt: User prompt/question.
            schema: JSON schema for structured output (JSON Schema format).
            system_instruction: System-level instruction for the model.
            temperature: Sampling temperature (0.0-1.0).
        
        Returns:
            Parsed JSON response conforming to the schema.
        
        Raises:
            GeminiClientError: If generation fails or response doesn't match schema.
        """
        return self.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            response_schema=schema,
            temperature=temperature,
            expect_json=True
        )
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        system_instruction: Optional[str] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Have a multi-turn conversation with the model.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys.
                     Role can be 'user' or 'model'.
            system_instruction: System-level instruction for the model.
            response_schema: JSON schema for structured output.
            temperature: Sampling temperature (0.0-1.0).
        
        Returns:
            Parsed JSON response or dict with 'text' key.
        
        Raises:
            GeminiClientError: If generation fails.
        """
        model = self._create_model(
            system_instruction=system_instruction,
            response_schema=response_schema
        )
        
        if temperature is not None:
            model._generation_config.temperature = temperature
        
        # Convert messages to Gemini format
        chat = model.start_chat(history=[])
        
        # Add conversation history (excluding the last user message)
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            chat.history.append({
                "role": role,
                "parts": [msg["content"]]
            })
        
        # Send the last message
        last_message = messages[-1]["content"]
        
        last_error = None
        for attempt in range(self.max_retries):
            try:
                response = chat.send_message(last_message)
                
                if not response.text:
                    raise GeminiClientError("Empty response received from model")
                
                if response_schema:
                    return self._validate_json_response(response.text)
                else:
                    return {"text": response.text}
                    
            except GeminiClientError:
                raise
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
        
        raise GeminiClientError(
            f"Failed after {self.max_retries} attempts. Last error: {str(last_error)}"
        )


# Convenience function for quick usage
def create_gemini_client(
    model_name: str = GeminiModel.FLASH_2_5,
    **kwargs
) -> GeminiClient:
    """
    Create a Gemini client with default settings.
    
    Args:
        model_name: Model to use (default: gemini-1.5-flash).
        **kwargs: Additional arguments to pass to GeminiClient.
    
    Returns:
        Configured GeminiClient instance.
    """
    return GeminiClient(model_name=model_name, **kwargs)
