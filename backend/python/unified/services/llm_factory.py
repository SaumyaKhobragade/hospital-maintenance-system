"""
services/llm_factory.py

Builds the correct LangChain LLM instance depending on LLM_PROVIDER env var.
Supports:
  - "ollama"  → local Ollama (ChatOllama)
  - "groq"    → Groq cloud   (ChatGroq)

Returns a standard BaseChatModel so all downstream nodes are provider-agnostic.
"""

from __future__ import annotations

import logging

from langchain_core.language_models.chat_models import BaseChatModel

import config

logger = logging.getLogger(__name__)


def build_llm(temperature: float = 0.2) -> BaseChatModel:
    """
    Instantiate and return the configured LLM.

    Args:
        temperature: Sampling temperature passed to the underlying model.

    Returns:
        A LangChain BaseChatModel instance ready for chaining.

    Raises:
        ValueError: If LLM_PROVIDER is not one of the recognised values.
        ImportError: If the required provider package is not installed.
    """
    provider = config.LLM_PROVIDER

    if provider == "ollama":
        try:
            from langchain_ollama import ChatOllama  # type: ignore
        except ImportError as exc:
            raise ImportError(
                "langchain-ollama is not installed. "
                "Run: pip install langchain-ollama"
            ) from exc

        llm = ChatOllama(
            model=config.OLLAMA_LLM_MODEL,
            base_url=config.OLLAMA_BASE_URL,
            temperature=temperature,
        )
        logger.info(
            "[LLM] Initialised ChatOllama  model=%s  base_url=%s",
            config.OLLAMA_LLM_MODEL,
            config.OLLAMA_BASE_URL,
        )
        return llm

    elif provider == "groq":
        try:
            from langchain_groq import ChatGroq  # type: ignore
        except ImportError as exc:
            raise ImportError(
                "langchain-groq is not installed. "
                "Run: pip install langchain-groq"
            ) from exc

        if not config.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY is not set. "
                "Please configure it in your .env file."
            )

        llm = ChatGroq(
            model=config.GROQ_LLM_MODEL,
            groq_api_key=config.GROQ_API_KEY,
            temperature=temperature,
        )
        logger.info(
            "[LLM] Initialised ChatGroq  model=%s",
            config.GROQ_LLM_MODEL,
        )
        return llm

    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER='{provider}'. "
            "Valid options are: 'ollama', 'groq'."
        )
