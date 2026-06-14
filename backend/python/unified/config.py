"""
config.py — Central configuration for the Unified HMS AI Backend.
Loads all environment variables for both RAG and Sarvam Sidecar services.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Always load the .env beside this service, regardless of the launch directory.
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=True)

# Base directories
BASE_DIR = Path(__file__).resolve().parent
CHROMA_DB_DIR = str(BASE_DIR / "chroma_db")

# ─── LLM Provider & Keys ──────────────────────────────────────────────────────
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").lower()  # "groq" or "ollama"
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ─── LLM Model Selection ──────────────────────────────────────────────────────
# Ollama settings
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "llama3.2:latest")

# Groq settings
GROQ_LLM_MODEL: str = os.getenv("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")
# Compatibility alias for old RAG config.py reference
LLM_MODEL_NAME: str = GROQ_LLM_MODEL

# ─── RAG Embeddings & Chunking ────────────────────────────────────────────────
USE_GEMINI_EMBEDDINGS: bool = bool(GEMINI_API_KEY)
EMBEDDING_MODEL_NAME: str = "models/gemini-embedding-001" if USE_GEMINI_EMBEDDINGS else "all-MiniLM-L6-v2"

CHUNK_SIZE: int = 800
CHUNK_OVERLAP: int = 150

# ─── Sarvam Speech-to-Text ────────────────────────────────────────────────────
SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
SARVAM_STT_URL: str = "https://api.sarvam.ai/speech-to-text"
SARVAM_STT_MODEL: str = "saaras:v3"
SARVAM_LANGUAGE_CODE: str = "unknown"  # auto-detect: works for Hindi, English, Hinglish, etc.

# ─── Sarvam Document Digitization (Prescription OCR) ─────────────────────────
SARVAM_OCR_URL: str = "https://api.sarvam.ai/parse-document"
SARVAM_OCR_MODEL: str = "document-ocr"

# ─── ElevenLabs Speech-to-Text (International) ───────────────────────────────
ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_STT_MODEL: str = "scribe_v2"

# ─── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# ─── MongoDB (Motor async driver) ─────────────────────────────────────────────
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "HMS_ai")
MONGO_TELEMETRY_COLLECTION: str = "ai_telemetry"

# ─── Server Settings ──────────────────────────────────────────────────────────
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8003"))  # Running unified on 8003 by default

# ─── Java Spring Boot Sidecar target ──────────────────────────────────────────
JAVA_BACKEND_URL: str = os.getenv("JAVA_BACKEND_URL", "http://localhost:9090")

# Redis read cache
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_TTL_SECONDS: int = int(os.getenv("REDIS_TTL_SECONDS", "60"))
