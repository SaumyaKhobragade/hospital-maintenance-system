"""
config.py — Central configuration for the Vitality AI Sidecar microservice.
Loads all environment variables, validates presence of critical keys,
and exposes typed constants consumed by every module in this service.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load from .env (same directory as this file, or parent directories)
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ─── LLM Provider ─────────────────────────────────────────────────────────────
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama").lower()

# ─── Ollama (local) ───────────────────────────────────────────────────────────
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "llama3.2:latest")

# ─── Groq Cloud ───────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_LLM_MODEL: str = os.getenv("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")

# ─── Sarvam AI (Speech-to-Text) ───────────────────────────────────────────────
SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
SARVAM_STT_URL: str = "https://api.sarvam.ai/speech-to-text"
SARVAM_STT_MODEL: str = "saaras:v3"
SARVAM_LANGUAGE_CODE: str = "hi-IN"

# ─── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# ─── MongoDB (Motor async driver) ─────────────────────────────────────────────
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "vitality_ai")
MONGO_TELEMETRY_COLLECTION: str = "ai_telemetry"

# ─── Server ───────────────────────────────────────────────────────────────────
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8003"))

# ─── Java Backend ─────────────────────────────────────────────────────────────
JAVA_BACKEND_URL: str = os.getenv("JAVA_BACKEND_URL", "http://localhost:9090")
