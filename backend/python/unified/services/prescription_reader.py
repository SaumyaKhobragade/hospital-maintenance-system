"""
services/prescription_reader.py

Prescription Reader — Sarvam AI Document Intelligence + Groq LLM
Optimized with strict Pydantic parsing bounds and index-safe object schemas.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List

import httpx
from langchain_core.prompts import ChatPromptTemplate
from sarvamai import SarvamAI
from pydantic import BaseModel, Field

import config
from db import fire_telemetry
from services.llm_factory import build_llm

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

_POLL_INTERVAL_S = 3          # seconds between status polls
_MAX_POLL_ATTEMPTS = 40       # 40 × 3s = up to 2 minutes
_TERMINAL_STATES = {"Completed", "PartiallyCompleted", "Failed"}

# ── Pydantic Verification Schemas ─────────────────────────────────────────────

class MedicationEntry(BaseModel):
    drug_name_and_strength: str = Field(
        description="Drug name and strength (e.g., Metformin 500mg)."
    )
    dosage: str = Field(
        description="Dose per administration (e.g., 1 tablet, 5ml). 'Unknown' if absent."
    )
    frequency_and_duration: str = Field(
        description="How often and for how long (e.g., Twice daily after meals for 10 days)."
    )

class PrescribedDataset(BaseModel):
    medications_list: List[MedicationEntry] = Field(default=[])
    general_instructions: List[str] = Field(default=[])
    prescribing_doctor: str = Field(default="Unknown")
    prescription_date: str = Field(default="Unknown")

# ── Extraction prompt (plain JSON, no tool-calling) ──────────────────────────

_EXTRACTION_SYSTEM_PROMPT = """\
You are a clinical pharmacist AI. Extract structured medication data from raw \
OCR text of a prescription.

Return ONLY a valid JSON object. No preamble, no explanation, no markdown fences.

JSON schema:
{{
  "medications_list": [
    {{
      "drug_name_and_strength": "...",
      "dosage": "...",
      "frequency_and_duration": "..."
    }}
  ],
  "general_instructions": ["..."],
  "prescribing_doctor": "...",
  "prescription_date": "..."
}}

Rules:
- Each entry in medications_list groups drug name, dosage, and frequency for ONE drug.
- general_instructions = diet, activity, follow-up advice (NOT per-drug dosing).
- Use [] or "Unknown" for any absent field.
- Never invent information not in the text."""

# ── Service ───────────────────────────────────────────────────────────────────

class PrescriptionReaderService:
    """
    Two-stage pipeline:
      Stage 1 — Sarvam Document Intelligence (async job) → OCR markdown text
      Stage 2 — Groq LLM (plain JSON output) → Pydantic validated payload
    """

    def __init__(self) -> None:
        self._llm = build_llm(temperature=0.0)
        self._prompt = ChatPromptTemplate.from_messages([
            ("system", _EXTRACTION_SYSTEM_PROMPT),
            (
                "human",
                "Raw prescription OCR text:\n\n{ocr_text}\n\nExtract the structured medication data:",
            ),
        ])
        # Plain text chain — NO with_structured_output (Groq tool-calling fails)
        self._chain = self._prompt | self._llm
        logger.info("[PrescriptionReader] Service initialized (plain JSON mode).")

    # ── Public API ─────────────────────────────────────────────────────────────

    async def read_prescription(
        self,
        file_bytes: bytes,
        filename: str,
    ) -> Dict[str, Any]:
        """Full pipeline: Sarvam OCR → LLM structured extraction."""
        if not config.SARVAM_API_KEY:
            raise RuntimeError(
                "SARVAM_API_KEY is not configured. Add it to your environment files."
            )

        logger.info(
            "[PrescriptionReader] Starting — file=%s size=%d bytes",
            filename, len(file_bytes),
        )

        # Stage 1 — Sarvam Document Intelligence Job Pipeline
        raw_ocr_text = await asyncio.to_thread(
            self._run_sarvam_job, file_bytes, filename
        )
        logger.info("[PrescriptionReader] OCR complete. chars=%d", len(raw_ocr_text))

        # Stage 2 — LLM plain JSON extraction + Pydantic validation
        MAX_LLM_RETRIES = 3

        def _call_llm_with_retry() -> str:
            """Call Groq LLM with retry-on-429 backoff."""
            last_exc: Exception | None = None
            for attempt in range(1, MAX_LLM_RETRIES + 1):
                try:
                    result = self._chain.invoke({"ocr_text": raw_ocr_text})
                    content = result.content if result.content else ""
                    logger.info(
                        "[PrescriptionReader] LLM output (attempt %d, %d chars): %s",
                        attempt, len(content), content[:500],
                    )
                    return content
                except Exception as exc:
                    last_exc = exc
                    exc_str = str(exc)
                    if "429" in exc_str or "rate" in exc_str.lower():
                        wait = 2 ** attempt  # 2s, 4s, 8s
                        logger.warning(
                            "[PrescriptionReader] Groq 429 rate limit on attempt %d/%d. "
                            "Retrying in %ds…",
                            attempt, MAX_LLM_RETRIES, wait,
                        )
                        time.sleep(wait)
                    else:
                        # Non-rate-limit error — don't retry
                        logger.error("[PrescriptionReader] LLM call failed: %s", exc)
                        raise RuntimeError(f"LLM extraction failed: {exc}") from exc
            # All retries exhausted
            raise RuntimeError(
                f"Groq rate limit exceeded after {MAX_LLM_RETRIES} retries. "
                f"Please wait a moment and try again. Last error: {last_exc}"
            )

        raw_output = await asyncio.to_thread(_call_llm_with_retry)

        # Extract and validate JSON
        raw_json = _extract_json(raw_output)

        try:
            parsed = json.loads(raw_json)
            validated = PrescribedDataset(**parsed)
        except json.JSONDecodeError as exc:
            logger.error(
                "[PrescriptionReader] JSON parse failed: %s\nExtracted: %s",
                exc, raw_json[:500],
            )
            raise RuntimeError(
                f"LLM returned non-JSON output. Raw preview: {raw_output[:200]}"
            ) from exc
        except Exception as exc:
            logger.error("[PrescriptionReader] Pydantic validation failed: %s", exc)
            raise RuntimeError(f"Structured validation failed: {exc}") from exc

        output_payload = validated.model_dump()
        output_payload["raw_ocr_text"] = raw_ocr_text

        # Telemetry
        try:
            fire_telemetry(
                event_type="PRESCRIPTION_VISION_DECODED",
                payload={
                    "filename": filename,
                    "extracted_drugs_count": len(output_payload.get("medications_list", [])),
                    "detected_doctor": output_payload.get("prescribing_doctor"),
                    "ocr_character_length": len(raw_ocr_text),
                }
            )
        except Exception as tel_err:
            logger.warning("[Telemetry] Logging bypassed: %s", tel_err)

        return output_payload

    # ── Stage 1: Sarvam Document Intelligence job pipeline ────────────────────

    def _run_sarvam_job(self, file_bytes: bytes, filename: str) -> str:
        """
        Synchronous 5-step Sarvam Document Intelligence pipeline running inside a background thread pool.
        """
        client = SarvamAI(api_subscription_key=config.SARVAM_API_KEY)

        # Detect real format from magic bytes (browser may send wrong extension)
        detected_ext = _detect_image_format(file_bytes)
        ext = detected_ext or (filename.rsplit(".", 1)[-1].lower() if "." in filename else "png")
        if ext not in ("pdf", "jpg", "jpeg", "png"):
            ext = "png"
        normalized_filename = f"prescription.{ext}"
        mime = _infer_mime(normalized_filename)
        logger.info(
            "[PrescriptionReader] Detected format=%s  normalized=%s  mime=%s",
            detected_ext, normalized_filename, mime,
        )

        # Step 1 — Create job
        init_resp = client.document_intelligence.initialise(
            job_parameters={
                "language": "en-IN",
                "output_format": "md",
            }
        )
        job_id: str = init_resp.job_id
        logger.info("[PrescriptionReader] Created Sarvam job token: job_id=%s", job_id)

        # Step 2 — Get upload link
        upload_resp = client.document_intelligence.get_upload_links(
            job_id=job_id,
            files=[normalized_filename],
        )
        url_details = upload_resp.upload_urls.get(normalized_filename)
        if not url_details or not url_details.file_url:
            raise RuntimeError(f"Sarvam did not return a presigned URL for '{normalized_filename}'.")
        upload_url: str = url_details.file_url

        # Step 3 — PUT file bytes to Azure presigned blob endpoint
        put_resp = httpx.put(
            upload_url,
            content=file_bytes,
            headers={
                "Content-Type": mime,
                "Content-Length": str(len(file_bytes)),
                "x-ms-blob-type": "BlockBlob",
            },
            timeout=60.0,
        )
        if put_resp.status_code not in (200, 201):
            raise RuntimeError(f"Upload to Sarvam blob storage failed: HTTP {put_resp.status_code} — {put_resp.text[:200]}")

        # Step 4 — Start processing job
        client.document_intelligence.start(job_id)

        # Step 5 — Poll status machine
        for attempt in range(_MAX_POLL_ATTEMPTS):
            time.sleep(_POLL_INTERVAL_S)
            status_resp = client.document_intelligence.get_status(job_id)
            state: str = status_resp.job_state
            logger.info("[PrescriptionReader] Poll step %d/%d — current_state=%s", attempt + 1, _MAX_POLL_ATTEMPTS, state)
            if state in _TERMINAL_STATES:
                break
        else:
            raise RuntimeError(f"Sarvam asynchronous parsing engine threshold timeout on token: job_id='{job_id}'")

        if state == "Failed":
            raise RuntimeError(f"Sovereign parsing matrix execution flag reported failure status for token: job_id={job_id}")

        # Step 6 — Get secure markdown download tracking parameters
        dl_resp = client.document_intelligence.get_download_links(job_id)
        if dl_resp.error_message:
            raise RuntimeError(f"Sarvam file collection path generation exception: {dl_resp.error_message}")

        dl_url: str | None = None
        for key, details in dl_resp.download_urls.items():
            if details and details.file_url:
                dl_url = details.file_url
                break

        if not dl_url:
            raise RuntimeError(f"Sarvam processing pipeline structural reference returned null link keys for token: job_id='{job_id}'")

        # Step 7 — Fetch compiled OCR text results
        get_resp = httpx.get(dl_url, timeout=30.0)
        if get_resp.status_code != 200:
            raise RuntimeError(f"Failed to extract text data from Sarvam secure object nodes: HTTP {get_resp.status_code}")

        text = get_resp.text.strip()
        if not text:
            raise RuntimeError("Sarvam successfully compiled execution boundaries but returned an empty document context stream.")

        return text


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_mime(filename: str) -> str:
    """Return an explicit, accurate MIME type string asset based on the extension parsing signature."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return {
        "pdf":  "application/pdf",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "png":  "image/png",
        "webp": "image/webp",
        "tiff": "image/tiff",
        "tif":  "image/tiff",
    }.get(ext, "image/jpeg")


def _detect_image_format(data: bytes) -> str | None:
    """
    Detect actual image format from magic bytes.
    Returns extension string ('png', 'jpg', 'pdf') or None if unknown.
    This prevents MIME mismatches when the browser sends a wrong extension.
    """
    if len(data) < 8:
        return None
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return "png"
    if data[:3] == b'\xff\xd8\xff':
        return "jpg"
    if data[:5] == b'%PDF-':
        return "pdf"
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return "webp"
    return None


def _extract_json(text: str) -> str:
    """
    Extract a JSON object string from LLM output, handling:
      - Clean JSON output
      - JSON wrapped in ```json ... ``` fences
      - JSON embedded in surrounding text/explanation
    Returns the extracted JSON string, or the original text if no JSON found.
    """
    text = text.strip()
    if not text:
        return "{}"

    # Strategy 1: Already valid JSON
    if text.startswith("{"):
        return text

    # Strategy 2: Strip markdown fences
    stripped = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    stripped = re.sub(r"\n?\s*```\s*$", "", stripped, flags=re.MULTILINE).strip()
    if stripped.startswith("{"):
        return stripped

    # Strategy 3: Find the first { ... } block by brace-matching
    start = text.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]

    # Fallback: return whatever we have
    return stripped if stripped else text