import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

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

@app.get("/")
def read_root():
    return {"message": "Welcome to IntelliTrace Backend API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting IntelliTrace backend server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
