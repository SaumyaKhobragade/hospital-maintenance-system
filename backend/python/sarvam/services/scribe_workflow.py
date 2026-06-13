"""
services/scribe_workflow.py

Feature 1: Ambient Clinical Scribe Pipeline
============================================
A LangGraph state machine that:
  1. Transcribes ambient room audio via the Sarvam AI speech-to-text API.
  2. Generates a structured SOAP note from the raw transcript using an LLM.
  3. Drafts a jargon-free, empathetic patient-facing email summary.
  4. INTERRUPTS before dispatching (human-in-the-loop safety gate).
  5. On doctor approval via /scribe/approve, resumes and dispatches the report
     by calling the mock email tool and firing async telemetry to MongoDB.

State is persisted in an InMemorySaver checkpointer keyed on thread_id so that
multiple concurrent consultations can be tracked simultaneously.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional

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


# ─── Pydantic State Schema ─────────────────────────────────────────────────────

class ScribeWorkflowState(BaseModel):
    """
    Full mutable state carried through every node of the Scribe graph.
    LangGraph merges partial dicts returned by each node into this model.
    """

    # ── Input fields (set at graph invocation) ──────────────────────────────
    patient_id: str = Field(default="", description="Unique patient identifier")
    patient_email: str = Field(default="", description="Patient email address for report delivery")
    audio_file_path: str = Field(default="", description="Absolute path to the recorded audio file")

    # ── Intermediate fields (populated by graph nodes) ──────────────────────
    raw_transcript: str = Field(default="", description="Raw text from Sarvam STT")
    structured_soap_note: str = Field(default="", description="SOAP-formatted clinical note")
    patient_report_draft: str = Field(default="", description="Jargon-free patient email draft")

    # ── Control field (set externally before /approve resume) ───────────────
    is_approved: bool = Field(default=False, description="Doctor approval flag")

    class Config:
        # Allow arbitrary dict merging from LangGraph node outputs
        extra = "allow"


# ─── Node implementations ──────────────────────────────────────────────────────

async def transcribe_ambient_audio(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 1 — Transcribe ambient room audio.

    Calls the Sarvam AI speech-to-text API with the audio file referenced
    by state['audio_file_path'] and writes the transcript to 'raw_transcript'.
    """
    audio_path = state.get("audio_file_path", "")
    patient_id = state.get("patient_id", "unknown")

    logger.info("[SCRIBE:Node1] Transcribing audio  patient=%s  file=%s", patient_id, audio_path)

    transcript = await transcribe_audio_with_sarvam(audio_path)

    logger.info(
        "[SCRIBE:Node1] Transcription done. chars=%d  patient=%s",
        len(transcript),
        patient_id,
    )
    return {"raw_transcript": transcript}


def generate_soap_note(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 2 — Convert raw transcript into a structured SOAP medical note.

    Uses the configured LLM with a strict clinical system prompt that
    forces output into the four canonical SOAP blocks.
    """
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

    logger.info(
        "[SCRIBE:Node2] SOAP note generated. chars=%d  patient=%s",
        len(soap_note),
        patient_id,
    )
    return {"structured_soap_note": soap_note}


def draft_patient_report(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 3 — Translate the clinical SOAP note into a patient-friendly email.

    Uses the LLM to rewrite complex medical language into clear, empathetic
    daily directives that a non-medical patient can understand and act upon.
    """
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

    logger.info(
        "[SCRIBE:Node3] Patient report drafted. chars=%d  patient=%s",
        len(report_draft),
        patient_id,
    )
    return {"patient_report_draft": report_draft}


def execute_dispatch_and_telemetry(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 4 — Execute approved report dispatch and log telemetry.

    This node is ONLY reached when the doctor fires the /scribe/approve endpoint,
    which resumes the frozen LangGraph thread via Command(resume=...).

    Actions:
      a) Calls the mock email tool with the compiled draft.
      b) Fires a non-blocking telemetry event to MongoDB.
    """
    patient_id = state.get("patient_id", "unknown")
    patient_email = state.get("patient_email", "")
    soap_note = state.get("structured_soap_note", "")
    report_draft = state.get("patient_report_draft", "")

    logger.info(
        "[SCRIBE:Node4] Executing dispatch  patient=%s  email=%s",
        patient_id,
        patient_email,
    )

    # ── a) Call mock email tool ─────────────────────────────────────────────
    receipt = send_patient_report_email.invoke({
        "patient_email": patient_email,
        "patient_id": patient_id,
        "report_body": report_draft,
    })
    logger.info("[SCRIBE:Node4] Email tool result: %s", receipt)

    # ── b) Fire async MongoDB telemetry ─────────────────────────────────────
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

    logger.info("[SCRIBE:Node4] Dispatch and telemetry complete  patient=%s", patient_id)
    return {"is_approved": True}


# ─── Graph Builder & Singleton ─────────────────────────────────────────────────

class ScribeWorkflowGraph:
    """
    Compiled LangGraph for the Ambient Clinical Scribe pipeline.

    The checkpointer is InMemorySaver, which serialises full graph state
    between nodes and enables resumption from the interrupt point when
    the doctor sends an /approve signal.
    """

    _instance: Optional[ScribeWorkflowGraph] = None

    def __init__(self) -> None:
        self._checkpointer = MemorySaver()
        self._graph = self._build_and_compile()
        logger.info("[ScribeGraph] Compiled with InMemorySaver checkpointer.")

    @classmethod
    def get_instance(cls) -> ScribeWorkflowGraph:
        """Return the module-level singleton graph instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_and_compile(self):
        """Construct the directed LangGraph workflow and compile with interrupt."""
        builder = StateGraph(dict)

        # ── Register nodes ────────────────────────────────────────────────
        builder.add_node("transcribe_ambient_audio", transcribe_ambient_audio)
        builder.add_node("generate_soap_note", generate_soap_note)
        builder.add_node("draft_patient_report", draft_patient_report)
        builder.add_node("execute_dispatch_and_telemetry", execute_dispatch_and_telemetry)

        # ── Define linear edges ───────────────────────────────────────────
        builder.set_entry_point("transcribe_ambient_audio")
        builder.add_edge("transcribe_ambient_audio", "generate_soap_note")
        builder.add_edge("generate_soap_note", "draft_patient_report")
        builder.add_edge("draft_patient_report", "execute_dispatch_and_telemetry")
        builder.add_edge("execute_dispatch_and_telemetry", END)

        # ── Compile with interrupt BEFORE the dispatch node ───────────────
        # This is the critical human-in-the-loop safety gate.
        # The graph will freeze after 'draft_patient_report' completes and
        # before 'execute_dispatch_and_telemetry' runs, exposing the drafts
        # to the FastAPI layer for doctor review.
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
        """
        Run the first three nodes of the pipeline (transcribe → SOAP → draft).
        The graph will halt at the interrupt and return the serialised state.

        Args:
            thread_id:        Unique ID for this consultation thread.
            patient_id:       Patient identifier.
            patient_email:    Email address for eventual dispatch.
            audio_file_path:  Path to the recorded ambient audio file.

        Returns:
            Dict containing 'raw_transcript', 'structured_soap_note',
            'patient_report_draft', and graph metadata.
        """
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

        logger.info(
            "[ScribeGraph] Starting pipeline  thread_id=%s  patient_id=%s",
            thread_id,
            patient_id,
        )

        # LangGraph's async stream — collect all events until interrupt
        final_state: Dict[str, Any] = {}
        async for event in self._graph.astream(
            initial_state,
            config=config_dict,
            stream_mode="values",
        ):
            final_state = event  # keep the latest snapshot

        logger.info(
            "[ScribeGraph] Pipeline paused at interrupt  thread_id=%s",
            thread_id,
        )
        return final_state

    async def resume_scribe_pipeline(self, thread_id: str) -> Dict[str, Any]:
        """
        Resume a frozen scribe thread after doctor approval.

        Uses LangGraph's Command(resume=...) pattern to restart execution
        from the interrupt point and run 'execute_dispatch_and_telemetry'.

        Args:
            thread_id: The thread ID of the frozen consultation.

        Returns:
            Final graph state after dispatch.

        Raises:
            KeyError: If the thread_id does not correspond to a frozen graph.
        """
        config_dict = {"configurable": {"thread_id": thread_id}}

        logger.info(
            "[ScribeGraph] Resuming thread after approval  thread_id=%s", thread_id
        )

        final_state: Dict[str, Any] = {}
        async for event in self._graph.astream(
            Command(resume=True),
            config=config_dict,
            stream_mode="values",
        ):
            final_state = event

        logger.info(
            "[ScribeGraph] Dispatch complete  thread_id=%s", thread_id
        )
        return final_state

    def get_thread_state(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """
        Read the current serialised state of a thread from the checkpointer
        without resuming or modifying it.

        Returns None if the thread does not exist.
        """
        config_dict = {"configurable": {"thread_id": thread_id}}
        try:
            snapshot = self._graph.get_state(config_dict)
            if snapshot and snapshot.values:
                return dict(snapshot.values)
            return None
        except Exception as exc:  # noqa: BLE001
            logger.warning("[ScribeGraph] get_state error: %s", exc)
            return None
