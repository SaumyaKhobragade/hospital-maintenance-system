"""
services/scribe_workflow.py

Feature 1: Ambient Clinical Scribe Pipeline
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.types import Command
from pydantic import BaseModel, Field

import config
from db import fire_telemetry
from services.llm_factory import build_llm
from services.tools import send_patient_report_email, transcribe_audio_with_sarvam

logger = logging.getLogger(__name__)


class ScribeWorkflowState(TypedDict, total=False):
    patient_id: str
    patient_email: str
    audio_file_path: str
    raw_transcript: str
    structured_soap_note: str
    patient_report_draft: str
    is_approved: bool


async def transcribe_ambient_audio(state: Dict[str, Any]) -> Dict[str, Any]:
    audio_path = state.get("audio_file_path", "")
    patient_id = state.get("patient_id", "unknown")
    logger.info("[SCRIBE:Node1] Transcribing audio  patient=%s  file=%s", patient_id, audio_path)
    transcript = await transcribe_audio_with_sarvam(audio_path)
    return {"raw_transcript": transcript}


def generate_soap_note(state: Dict[str, Any]) -> Dict[str, Any]:
    transcript = state.get("raw_transcript", "")
    patient_id = state.get("patient_id", "unknown")
    logger.info("[SCRIBE:Node2] Generating SOAP note  patient=%s", patient_id)

    llm = build_llm(temperature=0.1)

    soap_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a senior clinical documentation specialist AI. Your task is to convert a raw ambient room transcript into a formal, structured SOAP medical chart note.

STRICT RULES:
1. Ignore ALL casual dialogue, greetings, pleasantries, and small talk.
2. Extract ONLY clinically relevant information.
3. You MUST produce EXACTLY four uppercase section headers: SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN.
4. Each section must be populated with relevant clinical findings. If information is not available for a section, write "Not available from transcript."
5. Be precise, use medical terminology where appropriate, and be concise.
6. Do NOT include any preamble, explanation, or metadata outside of the four sections.

OUTPUT FORMAT (follow exactly):
SUBJECTIVE:
<Chief complaint, patient-reported symptoms, pain scale, onset, duration, aggravating/relieving factors>

OBJECTIVE:
<Vitals if mentioned, physical exam findings, lab values, imaging results if discussed>

ASSESSMENT:
<Diagnostic impression, differential diagnoses, clinical reasoning>

PLAN:
<Treatment plan, medications with dosage and frequency, follow-up instructions, referrals, lifestyle modifications>""",
        ),
        (
            "human",
            "Ambient Room Transcript:\n\n{transcript}\n\nGenerate the SOAP note:",
        ),
    ])

    chain = soap_prompt | llm
    result = chain.invoke({"transcript": transcript})
    soap_note = result.content.strip()
    return {"structured_soap_note": soap_note}


def draft_patient_report(state: Dict[str, Any]) -> Dict[str, Any]:
    soap_note = state.get("structured_soap_note", "")
    patient_id = state.get("patient_id", "unknown")
    logger.info("[SCRIBE:Node3] Drafting patient report  patient=%s", patient_id)

    llm = build_llm(temperature=0.3)

    report_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a compassionate patient communication specialist. Your role is to translate a clinical SOAP note into a warm, empathetic, and easy-to-understand email summary for the patient.

WRITING GUIDELINES:
1. Use clear, everyday English — avoid all medical jargon. If a medical term is essential, explain it in simple words immediately after in parentheses.
2. Structure the email with clear bullet points for easy scanning.
3. Be warm, caring, and reassuring in tone — the patient may be anxious.
4. Include SPECIFIC action items: exact medication names with plain English dosing instructions (e.g., "Take one white Metformin tablet every morning with breakfast"), food and diet restrictions with examples, activity limitations, and exact warning signs that require calling a doctor or going to the ER.
5. Include a "When to Seek Immediate Help" section listing red-flag symptoms.
6. Do NOT include a salutation or sign-off — the system will add those.
7. Do NOT include any information not present in the SOAP note.""",
        ),
        (
            "human",
            "Clinical SOAP Note:\n\n{soap_note}\n\nWrite the patient-friendly email body:",
        ),
    ])

    chain = report_prompt | llm
    result = chain.invoke({"soap_note": soap_note})
    report_draft = result.content.strip()
    return {"patient_report_draft": report_draft}


def execute_dispatch_and_telemetry(state: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = state.get("patient_id", "unknown")
    patient_email = state.get("patient_email", "")
    soap_note = state.get("structured_soap_note", "")
    report_draft = state.get("patient_report_draft", "")
    raw_transcript = state.get("raw_transcript", "")

    logger.info("[SCRIBE:Node4] Executing dispatch  patient=%s  email=%s", patient_id, patient_email)

    receipt = send_patient_report_email.invoke({
        "patient_email": patient_email,
        "patient_id": patient_id,
        "report_body": report_draft,
    })

    fire_telemetry(
        event_type="AMBIENT_SCRIBE_DISPATCH",
        payload={
            "patient_id": patient_id,
            "patient_email": patient_email,
            "soap_note": soap_note,
            "patient_report": report_draft,
            "email_receipt": receipt,
        },
    )

    # ─── Store transcription data in ChromaDB ─────────────────────────────
    try:
        from services.vector_store import VectorStoreService
        from services.document_processor import DocumentProcessor

        vector_store = VectorStoreService()
        doc_processor = DocumentProcessor()

        # Index raw transcript
        if raw_transcript and raw_transcript.strip():
            transcript_metadata = {
                "source": "voice_checkin_transcript",
                "patient_id": patient_id,
            }
            chunks = doc_processor.chunk_text(raw_transcript, transcript_metadata)
            vector_store.add_patient_documents(patient_id, chunks)
            logger.info("[SCRIBE:Node4] Successfully indexed voice check-in transcript in ChromaDB")

        # Index structured SOAP note
        if soap_note and soap_note.strip():
            soap_metadata = {
                "source": "voice_checkin_soap_note",
                "patient_id": patient_id,
            }
            chunks = doc_processor.chunk_text(soap_note, soap_metadata)
            vector_store.add_patient_documents(patient_id, chunks)
            logger.info("[SCRIBE:Node4] Successfully indexed voice check-in SOAP note in ChromaDB")
    except Exception as e:
        logger.error("[SCRIBE:Node4] Failed to index scribe data in ChromaDB: %s", e)

    return {"is_approved": True}


class ScribeWorkflowGraph:
    _instance: Optional[ScribeWorkflowGraph] = None

    def __init__(self) -> None:
        self._checkpointer = MemorySaver()
        self._graph = self._build_and_compile()

    @classmethod
    def get_instance(cls) -> ScribeWorkflowGraph:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_and_compile(self):
        builder = StateGraph(ScribeWorkflowState)
        builder.add_node("transcribe_ambient_audio", transcribe_ambient_audio)
        builder.add_node("generate_soap_note", generate_soap_note)
        builder.add_node("draft_patient_report", draft_patient_report)
        builder.add_node("execute_dispatch_and_telemetry", execute_dispatch_and_telemetry)

        builder.set_entry_point("transcribe_ambient_audio")
        builder.add_edge("transcribe_ambient_audio", "generate_soap_note")
        builder.add_edge("generate_soap_note", "draft_patient_report")
        builder.add_edge("draft_patient_report", "execute_dispatch_and_telemetry")
        builder.add_edge("execute_dispatch_and_telemetry", END)

        compiled = builder.compile(
            checkpointer=self._checkpointer,
            interrupt_before=["execute_dispatch_and_telemetry"],
        )
        return compiled

    async def invoke_scribe_pipeline(
        self,
        thread_id: str,
        patient_id: str,
        patient_email: str,
        audio_file_path: str,
    ) -> Dict[str, Any]:
        config_dict = {"configurable": {"thread_id": thread_id}}
        initial_state = {
            "patient_id": patient_id,
            "patient_email": patient_email,
            "audio_file_path": audio_file_path,
            "raw_transcript": "",
            "structured_soap_note": "",
            "patient_report_draft": "",
            "is_approved": False,
        }

        final_state: Dict[str, Any] = {}
        async for event in self._graph.astream(
            initial_state,
            config=config_dict,
            stream_mode="values",
        ):
            final_state = event

        return final_state

    async def resume_scribe_pipeline(self, thread_id: str) -> Dict[str, Any]:
        config_dict = {"configurable": {"thread_id": thread_id}}
        final_state: Dict[str, Any] = {}
        async for event in self._graph.astream(
            Command(resume=True),
            config=config_dict,
            stream_mode="values",
        ):
            final_state = event
        return final_state

    def get_thread_state(self, thread_id: str) -> Optional[Dict[str, Any]]:
        config_dict = {"configurable": {"thread_id": thread_id}}
        try:
            snapshot = self._graph.get_state(config_dict)
            if snapshot and snapshot.values:
                return dict(snapshot.values)
            return None
        except Exception as exc:
            logger.warning("[ScribeGraph] get_state error: %s", exc)
            return None
