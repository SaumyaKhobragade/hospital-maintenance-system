"""
main.py — HMS AI Sidecar (Sarvam Scribe + Report)
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from db import fire_telemetry
from services.scribe_workflow import ScribeWorkflowGraph
from services.report_workflow import ReportWorkflowGraph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Initialize workflow singletons ────────────────────────────────────────────
scribe_graph = ScribeWorkflowGraph.get_instance()
report_graph = ReportWorkflowGraph.get_instance()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="HMS AI Sidecar",
    description="Ambient Clinical Scribe + Automated Patient Report workflows.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────

class ScribeStartRequest(BaseModel):
    patient_id: str
    patient_email: str
    audio_file_path: str
    thread_id: Optional[str] = None

class ScribeDraftResponse(BaseModel):
    thread_id: str
    patient_id: str
    patient_email: str
    raw_transcript: str
    structured_soap_note: str
    patient_report_draft: str
    status: str = "PENDING_APPROVAL"

class ScribeApproveRequest(BaseModel):
    thread_id: str

class ScribeApproveResponse(BaseModel):
    thread_id: str
    patient_id: str
    status: str = "DISPATCHED"
    message: str

class ReportRequest(BaseModel):
    patient_id: str
    patient_email: str
    patient_metrics: Dict[str, Any]
    additional_context: Optional[str] = ""
    thread_id: Optional[str] = None

class ReportResponse(BaseModel):
    thread_id: str
    patient_id: str
    patient_email: str
    anomaly_report: str
    clinical_summary: str
    patient_email_body: str
    dispatch_receipt: str
    status: str = "DISPATCHED"


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "llm_provider": config.LLM_PROVIDER,
        "llm_model": (
            config.OLLAMA_LLM_MODEL
            if config.LLM_PROVIDER == "ollama"
            else config.GROQ_LLM_MODEL
        ),
        "sarvam_configured": bool(config.SARVAM_API_KEY),
    }


# ── Feature 1: Ambient Clinical Scribe ───────────────────────────────────────

@app.post("/scribe/start", response_model=ScribeDraftResponse)
async def start_scribe(body: ScribeStartRequest):
    """
    Kick off the scribe pipeline: transcribe audio → generate SOAP note → draft patient report.
    Graph pauses before dispatch. Returns draft content for doctor review.
    """
    thread_id = body.thread_id or f"scribe-{body.patient_id}-{uuid.uuid4().hex[:8]}"

    try:
        state = await scribe_graph.invoke_scribe_pipeline(
            thread_id=thread_id,
            patient_id=body.patient_id,
            patient_email=body.patient_email,
            audio_file_path=body.audio_file_path,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Audio file not found: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scribe pipeline failed: {exc}")

    return ScribeDraftResponse(
        thread_id=thread_id,
        patient_id=state.get("patient_id", body.patient_id),
        patient_email=state.get("patient_email", body.patient_email),
        raw_transcript=state.get("raw_transcript", ""),
        structured_soap_note=state.get("structured_soap_note", ""),
        patient_report_draft=state.get("patient_report_draft", ""),
    )


@app.get("/scribe/status", response_model=ScribeDraftResponse)
def get_scribe_status(thread_id: str):
    """
    Read the current frozen state of a scribe session without resuming it.
    """
    state = scribe_graph.get_thread_state(thread_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail=f"No scribe session found for thread_id='{thread_id}'.",
        )
    return ScribeDraftResponse(
        thread_id=thread_id,
        patient_id=state.get("patient_id", ""),
        patient_email=state.get("patient_email", ""),
        raw_transcript=state.get("raw_transcript", ""),
        structured_soap_note=state.get("structured_soap_note", ""),
        patient_report_draft=state.get("patient_report_draft", ""),
        status="DISPATCHED" if state.get("is_approved") else "PENDING_APPROVAL",
    )


@app.post("/scribe/approve", response_model=ScribeApproveResponse)
async def approve_scribe(body: ScribeApproveRequest):
    """
    Doctor approval: resumes the frozen LangGraph thread, dispatches the report,
    and fires a MongoDB telemetry event.
    """
    current_state = scribe_graph.get_thread_state(body.thread_id)
    if current_state is None:
        raise HTTPException(status_code=404, detail=f"Thread '{body.thread_id}' not found.")
    if current_state.get("is_approved"):
        raise HTTPException(status_code=409, detail=f"Thread '{body.thread_id}' already dispatched.")

    try:
        final_state = await scribe_graph.resume_scribe_pipeline(thread_id=body.thread_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to resume pipeline: {exc}")

    post_state = scribe_graph.get_thread_state(body.thread_id) or final_state
    return ScribeApproveResponse(
        thread_id=body.thread_id,
        patient_id=post_state.get("patient_id", ""),
        status="DISPATCHED",
        message="Report dispatched. Telemetry logged to MongoDB.",
    )


# ── Feature 2: Automated Patient Report & Mailing ─────────────────────────────

@app.post("/report/generate", response_model=ReportResponse)
async def generate_report(body: ReportRequest):
    """
    Full automated report pipeline: anomaly detection → clinical summary →
    patient email → dispatch → MongoDB telemetry.
    """
    if not body.patient_metrics:
        raise HTTPException(status_code=400, detail="patient_metrics cannot be empty.")

    thread_id = body.thread_id or f"report-{body.patient_id}-{uuid.uuid4().hex[:8]}"

    try:
        state = await report_graph.invoke_report_pipeline(
            thread_id=thread_id,
            patient_id=body.patient_id,
            patient_email=body.patient_email,
            patient_metrics=body.patient_metrics,
            additional_context=body.additional_context or "",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report pipeline failed: {exc}")

    return ReportResponse(
        thread_id=thread_id,
        patient_id=state.get("patient_id", body.patient_id),
        patient_email=state.get("patient_email", body.patient_email),
        anomaly_report=state.get("anomaly_report", ""),
        clinical_summary=state.get("clinical_summary", ""),
        patient_email_body=state.get("patient_email_body", ""),
        dispatch_receipt=state.get("dispatch_receipt", ""),
    )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
