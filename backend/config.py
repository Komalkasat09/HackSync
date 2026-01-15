from pydantic_settings import BaseSettings
from typing import Optional
import os
import re
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    DATABASE_NAME: str = "skillsphere"
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEY_1: Optional[str] = os.getenv("GEMINI_API_KEY_1", None)
    GEMINI_API_KEY_2: Optional[str] = os.getenv("GEMINI_API_KEY_2", None)
    GEMINI_API_KEY_3: Optional[str] = os.getenv("GEMINI_API_KEY_3", None)
    GEMINI_API_KEY_4: Optional[str] = os.getenv("GEMINI_API_KEY_4", None)
    GEMINI_API_KEY_5: Optional[str] = os.getenv("GEMINI_API_KEY_5", None)
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"  # Standardized model across all services
    
    # Tavily API (optional - for Udemy/Coursera search)
    TAVILY_API_KEY: Optional[str] = os.getenv("TAVILY_API_KEY", None)
    
    # Apify API (for LinkedIn job scraping)
    APIFY_API_KEY: Optional[str] = os.getenv("APIFY_API_KEY", None)
    
    # API Configuration
    API_VERSION: str = "v1"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def get_encoded_mongodb_url(self) -> str:
        """Encode MongoDB username and password for URL safety"""
        # Match mongodb+srv://username:password@rest or mongodb://username:password@rest
        pattern = r'mongodb(?:\+srv)?://([^:]+):([^@]+)@(.+)'
        match = re.match(pattern, self.MONGODB_URL)
        
        if match:
            username, password, rest = match.groups()
            encoded_username = quote_plus(username)
            encoded_password = quote_plus(password)
            is_srv = '+srv' in self.MONGODB_URL
            protocol = "mongodb+srv" if is_srv else "mongodb"
            return f"{protocol}://{encoded_username}:{encoded_password}@{rest}"
        
        # Return as-is if no credentials found
        return self.MONGODB_URL
    
    def get_gemini_api_keys(self) -> list[str]:
        """Get all available Gemini API keys for fallback mechanism"""
        keys = [
            self.GEMINI_API_KEY_1,
            self.GEMINI_API_KEY_2,
            self.GEMINI_API_KEY,
            self.GEMINI_API_KEY_3,
            self.GEMINI_API_KEY_4,
            self.GEMINI_API_KEY_5,
        ]
        # Filter out None/empty keys
        return [key for key in keys if key]

settings = Settings()

# MongoDB Client
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
database = Database()

async def get_database():
    return database.client[settings.DATABASE_NAME]

async def connect_to_mongo():
    encoded_url = settings.get_encoded_mongodb_url()
    database.client = AsyncIOMotorClient(encoded_url)
    try:
        # Test the connection
        await database.client.admin.command('ping')
        print("✓ MongoDB connection established successfully!")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")

async def close_mongo_connection():
    if database.client:
        database.client.close()
        print("Closed MongoDB connection!")
