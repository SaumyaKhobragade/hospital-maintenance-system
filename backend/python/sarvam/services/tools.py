"""
services/tools.py

LangChain tool definitions used across LangGraph workflow nodes.

Tools implemented here:
  - send_patient_report_email  — mock email dispatch (logs to stdout + telemetry)
  - transcribe_audio_sarvam    — async wrapper around the Sarvam AI STT API
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone

from sarvamai import SarvamAI
from langchain_core.tools import tool

import config
from db import fire_telemetry

logger = logging.getLogger(__name__)


# ─── Mock Email Tool ───────────────────────────────────────────────────────────

@tool
def send_patient_report_email(
    patient_email: str,
    patient_id: str,
    report_body: str,
) -> str:
    """
    Mock email dispatch tool.

    In production this would integrate with SendGrid / AWS SES / SMTP.
    For the hackathon scope it logs to stdout, fires a MongoDB telemetry event,
    and returns a success receipt string.

    Args:
        patient_email: Destination email address for the patient.
        patient_id:    Identifier of the patient whose report is being sent.
        report_body:   The full text of the patient-friendly report to send.

    Returns:
        A string receipt confirming the mock send operation.
    """
    # ── Simulate email delivery ────────────────────────────────────────────────
    timestamp = datetime.now(timezone.utc).isoformat()
    receipt_id = f"MOCK-EMAIL-{patient_id}-{timestamp[:10]}"

    logger.info(
        "[EMAIL TOOL] Dispatching report to %s  patient=%s  receipt=%s",
        patient_email,
        patient_id,
        receipt_id,
    )
    print(
        f"\n{'='*60}\n"
        f"[MOCK EMAIL DISPATCH]\n"
        f"  To      : {patient_email}\n"
        f"  Patient : {patient_id}\n"
        f"  Receipt : {receipt_id}\n"
        f"  Body Preview:\n{report_body[:300]}...\n"
        f"{'='*60}\n"
    )

    # ── Fire MongoDB telemetry (non-blocking) ──────────────────────────────────
    fire_telemetry(
        event_type="EMAIL_DISPATCH",
        payload={
            "patient_id": patient_id,
            "patient_email": patient_email,
            "receipt_id": receipt_id,
            "report_preview": report_body[:500],
        },
    )

    return (
        f"SUCCESS | Receipt: {receipt_id} | "
        f"Report dispatched to {patient_email} at {timestamp}"
    )


# ─── Sarvam AI Transcription Helper ───────────────────────────────────────────

async def transcribe_audio_with_sarvam(audio_file_path: str) -> str:
    """
    Call the Sarvam AI speech-to-text service using the official Python SDK.

    Sends the audio file at `audio_file_path` to Sarvam's Saaras:v3 model
    configured for hi-IN (Hindi/Hinglish code-mixed) speech.

    Args:
        audio_file_path: Absolute path to the audio file on disk.

    Returns:
        The raw transcript string from the API.

    Raises:
        FileNotFoundError:  If the audio file does not exist.
        ValueError:         If the API response is missing expected fields.
    """
    if not os.path.isfile(audio_file_path):
        raise FileNotFoundError(
            f"Audio file not found at path: {audio_file_path}"
        )

    if not config.SARVAM_API_KEY:
        logger.warning(
            "[SARVAM] SARVAM_API_KEY is not set. Returning placeholder transcript."
        )
        return (
            "[MOCK TRANSCRIPT] Patient reports chest pain for the past three days. "
            "The pain is worse on exertion. Patient also mentions mild fever and fatigue. "
            "No known allergies. Currently taking metformin for diabetes."
        )

    logger.info(
        "[SARVAM] Transcribing audio file (via SDK): %s", audio_file_path
    )

    client = SarvamAI(api_subscription_key=config.SARVAM_API_KEY)

    def _run_transcribe():
        with open(audio_file_path, "rb") as audio_file:
            return client.speech_to_text.transcribe(
                file=audio_file,
                model=config.SARVAM_STT_MODEL,
                mode="transcribe",
                language_code=config.SARVAM_LANGUAGE_CODE,
            )

    try:
        response = await asyncio.to_thread(_run_transcribe)
    except Exception as exc:
        logger.error("[SARVAM] SDK transcription call failed: %s", exc)
        raise

    transcript = response.transcript
    if not transcript:
        raise ValueError(
            f"Sarvam SDK returned empty or invalid response: {response}"
        )

    logger.info(
        "[SARVAM] Transcription complete. Length=%d chars.", len(transcript)
    )
    return transcript

