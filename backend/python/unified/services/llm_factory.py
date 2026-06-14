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
from typing import Any, List, Optional

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult

import config

logger = logging.getLogger(__name__)


class MockChatModel(BaseChatModel):
    """Deterministic local fallback used when no live LLM provider is configured."""

    model_name: str = "mock-local"

    @property
    def _llm_type(self) -> str:
        return self.model_name

    def _generate(self, messages: List[BaseMessage], stop: Optional[List[str]] = None, **kwargs: Any) -> ChatResult:
        prompt_text = "\n".join(getattr(message, "content", str(message)) for message in messages)
        lower_prompt = prompt_text.lower()

        if "soap" in lower_prompt:
            content = (
                "SUBJECTIVE:\n"
                "Not available from transcript.\n\n"
                "OBJECTIVE:\n"
                "Not available from transcript.\n\n"
                "ASSESSMENT:\n"
                "No live LLM configured. Using local fallback SOAP note.\n\n"
                "PLAN:\n"
                "Review the patient manually and configure GROQ_API_KEY or OLLAMA if live generation is required."
            )
        elif "warm" in lower_prompt or "patient email body" in lower_prompt:
            content = (
                "Your Test Results Summary:\n"
                "- A local fallback generated this message because no live LLM is configured.\n\n"
                "What These Results Mean For You:\n"
                "- The backend is running in demo mode.\n\n"
                "What You Should Do Next:\n"
                "- Provide GROQ_API_KEY or run Ollama to enable live AI output.\n\n"
                "Important Warning Signs:\n"
                "- If you feel worse, contact your clinician or go to the nearest emergency room."
            )
        elif "clinical" in lower_prompt and "summary" in lower_prompt:
            content = (
                "Local fallback clinical summary: the system is running without a live LLM. "
                "Relevant details should be reviewed manually until a provider key or Ollama is configured."
            )
        elif "anomaly" in lower_prompt or "risk" in lower_prompt:
            content = (
                "- No live LLM configured; using local fallback analysis.\n"
                "- Overall Risk Assessment: MODERATE"
            )
        else:
            content = "Local fallback response: configure GROQ_API_KEY or OLLAMA for live generation."

        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])


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
            logger.warning("[LLM] GROQ_API_KEY is not set; using local mock model instead.")
            return MockChatModel()

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
        logger.warning("[LLM] Unknown provider '%s'; using local mock model.", provider)
        return MockChatModel()
