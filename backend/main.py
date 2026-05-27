import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

try:
    from intellitrace import __version__
except ImportError:
    __version__ = "1.0.0"

app = FastAPI(
    title="IntelliTrace Backend API",
    description="Backend API for IntelliTrace Analytics and Streaming",
    version=__version__
)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
def get_db_url():
    return os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")

def get_db_connection():
    db_url = get_db_url()
    if not db_url:
        raise Exception("NEON_DATABASE_URL environment variable is not set. Cannot connect to Neon DB.")
    conn = psycopg2.connect(db_url)
    return conn

# Create users table if not exists
try:
    if get_db_url():
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                plan VARCHAR(50) NOT NULL DEFAULT 'starter',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully.")
    else:
        print("WARNING: NEON_DATABASE_URL not set. Database not initialized.")
except Exception as e:
    print(f"Error initializing database: {e}")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Pydantic Models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    plan: str = "starter"

class UserSignin(BaseModel):
    email: EmailStr
    password: str

@app.post("/api/auth/signup")
def signup(user: UserSignup):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_password = get_password_hash(user.password)
        
        cur.execute(
            "INSERT INTO users (name, email, password, plan) VALUES (%s, %s, %s, %s) RETURNING id, name, email, plan",
            (user.name, user.email, hashed_password, user.plan)
        )
        new_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "User created successfully", "user": new_user}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/auth/signin")
def signin(user: UserSignin):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not db_user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        if not verify_password(user.password, db_user['password']):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        # Return basic user info (in real app, return JWT here)
        return {
            "message": "Login successful", 
            "user": {
                "id": db_user['id'],
                "name": db_user['name'],
                "email": db_user['email'],
                "plan": db_user['plan']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signin error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
def read_root():
    return {"message": "Welcome to IntelliTrace Backend API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting IntelliTrace backend server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
