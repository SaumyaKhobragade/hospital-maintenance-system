import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv(override=True)

# Base directories
BASE_DIR = Path(__file__).resolve().parent
CHROMA_DB_DIR = str(BASE_DIR / "chroma_db")

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# RAG Configuration
# Use Gemini's embedding model if API key is set, otherwise fall back to local sentence-transformers
USE_GEMINI_EMBEDDINGS = bool(GEMINI_API_KEY)
EMBEDDING_MODEL_NAME = "models/gemini-embedding-001" if USE_GEMINI_EMBEDDINGS else "all-MiniLM-L6-v2"

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()  # "groq" or "ollama"
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama-3.3-70b-versatile")

# Ollama Configuration (used when LLM_PROVIDER = "ollama")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3")

# Document Processing
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

# Server Settings
HOST = "0.0.0.0"
PORT = 8002
