from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from .schema import UserSignup, Token, UserResponse
import secrets
from config import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security - Use a persistent secret key (you should store this in environment variables)
# For now, using a fixed key. In production, use: SECRET_KEY = os.getenv("SECRET_KEY")
SECRET_KEY = "your-secret-key-change-this-in-production-make-it-long-and-secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate to 72 bytes for bcrypt compatibility
    password_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes for bcrypt compatibility
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from MongoDB
    db = await get_database()
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
async def signup(user: UserSignup):
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_data = {
        "email": user.email,
        "full_name": user.full_name,
        "user_type": user.user_type,
        "hashed_password": get_password_hash(user.password),
        "created_at": datetime.utcnow()
    }
    
    # Insert into MongoDB
    result = await db.users.insert_one(user_data)
    user_data["id"] = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_database()
    
    # Find user in MongoDB
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        user_type=current_user.get("user_type", "Student")
    )
