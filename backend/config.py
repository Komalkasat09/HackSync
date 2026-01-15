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
    
    # API Configuration
    API_VERSION: str = "v1"
    DEBUG: bool = True
    
    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ASSEMBLYAI_API_KEY: str = os.getenv("ASSEMBLYAI_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    
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
