"""Voice Service for Text-to-Speech and Speech-to-Text"""
import os
import io
import base64
from typing import Optional
from elevenlabs import ElevenLabs, VoiceSettings
import assemblyai as aai

# Configure APIs
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY', '')

if ELEVENLABS_API_KEY:
    eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY

class VoiceService:
    """Service for voice features in interviews"""
    
    @staticmethod
    def text_to_speech(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Optional[bytes]:
        """
        Convert text to speech using ElevenLabs
        
        Args:
            text: The text to convert to speech
            voice_id: ElevenLabs voice ID (default: Rachel - professional female voice)
                     Other options:
                     - "21m00Tcm4TlvDq8ikWAM" - Rachel (default)
                     - "pNInz6obpgDQGcFmaJgB" - Adam (male)
                     - "EXAVITQu4vr4xnSDxMaL" - Bella (female)
        
        Returns:
            Audio bytes if successful, None otherwise
        """
        if not ELEVENLABS_API_KEY:
            print("⚠️ ElevenLabs API key not configured. Skipping TTS.")
            return None
        
        try:
            print(f"🔊 Generating speech for: '{text[:50]}...'")
            
            # Generate audio
            audio_generator = eleven_client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id="eleven_turbo_v2_5",  # Fast, high-quality model
                voice_settings=VoiceSettings(
                    stability=0.5,
                    similarity_boost=0.75,
                    style=0.0,
                    use_speaker_boost=True
                )
            )
            
            # Collect audio bytes
            audio_bytes = b''.join(audio_generator)
            print(f"✅ Generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
        except Exception as e:
            print(f"❌ TTS failed: {str(e)}")
            return None
    
    @staticmethod
    def text_to_speech_base64(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Optional[str]:
        """
        Convert text to speech and return as base64 string for web playback
        
        Returns:
            Base64 encoded audio string if successful, None otherwise
        """
        audio_bytes = VoiceService.text_to_speech(text, voice_id)
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode('utf-8')
        return None
    
    @staticmethod
    def speech_to_text(audio_file_path: str) -> Optional[str]:
        """
        Convert speech to text using AssemblyAI
        
        Args:
            audio_file_path: Path to the audio file
        
        Returns:
            Transcribed text if successful, None otherwise
        """
        if not ASSEMBLYAI_API_KEY:
            print("⚠️ AssemblyAI API key not configured. Skipping STT.")
            return None
        
        try:
            print(f"🎤 Transcribing audio from: {audio_file_path}")
            
            # Create transcriber
            transcriber = aai.Transcriber()
            
            # Transcribe audio file
            transcript = transcriber.transcribe(audio_file_path)
            
            if transcript.status == aai.TranscriptStatus.error:
                print(f"❌ Transcription failed: {transcript.error}")
                return None
            
            print(f"✅ Transcription complete: '{transcript.text[:100]}...'")
            return transcript.text
            
        except Exception as e:
            print(f"❌ STT failed: {str(e)}")
            return None
    
    @staticmethod
    def speech_to_text_from_bytes(audio_bytes: bytes) -> Optional[str]:
        """
        Convert speech to text from audio bytes
        
        Args:
            audio_bytes: Raw audio bytes (webm, mp3, wav, etc.)
        
        Returns:
            Transcribed text if successful, None otherwise
        """
        if not ASSEMBLYAI_API_KEY:
            print("⚠️ AssemblyAI API key not configured. Skipping STT.")
            return None
        
        try:
            print(f"🎤 Transcribing {len(audio_bytes)} bytes of audio")
            
            # Create transcriber
            transcriber = aai.Transcriber()
            
            # Upload audio bytes and transcribe
            transcript = transcriber.transcribe(audio_bytes)
            
            if transcript.status == aai.TranscriptStatus.error:
                print(f"❌ Transcription failed: {transcript.error}")
                return None
            
            print(f"✅ Transcription complete: '{transcript.text[:100]}...'")
            return transcript.text
            
        except Exception as e:
            print(f"❌ STT failed: {str(e)}")
            return None
    
    @staticmethod
    def is_tts_available() -> bool:
        """Check if Text-to-Speech is available"""
        return bool(ELEVENLABS_API_KEY)
    
    @staticmethod
    def is_stt_available() -> bool:
        """Check if Speech-to-Text is available"""
        return bool(ASSEMBLYAI_API_KEY)
