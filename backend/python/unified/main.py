"""
main.py — Unified HMS AI Backend Service
Consolidates both the RAG Medical History Backend and the Sarvam Clinical workflows
into a single FastAPI application.
"""

import logging
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, File, Form, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from db import fire_telemetry, close_mongo_client, get_mongo_client
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStoreService
from services.summary_agent import SummaryAgent
from services.risk_agent import RiskAgent
from services.scribe_workflow import ScribeWorkflowGraph
from services.report_workflow import ReportWorkflowGraph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Initialize Services ───────────────────────────────────────────────────────
doc_processor = DocumentProcessor()
vector_store_service = VectorStoreService()
summary_agent = SummaryAgent()
risk_agent = RiskAgent()

scribe_graph = ScribeWorkflowGraph.get_instance()
report_graph = ReportWorkflowGraph.get_instance()

# ── FastAPI Application ───────────────────────────────────────────────────────
app = FastAPI(
    title="HMS Unified AI Backend",
    description="Unified service combining RAG Patient Summaries, Risk Assessments, and Sarvam Scribe & Reporting workflows.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Request/Response Models ──────────────────────────────────────────

# RAG Models
class SummaryResponse(BaseModel):
    patient_id: str
    chronic_conditions: List[str]
    allergies: List[str]
    current_medications: List[str]
    past_surgeries: List[str]
    clinical_summary: str
    retrieved_snippets: List[str]

class RiskFlagResponse(BaseModel):
    risk_type: str
    severity: str
    description: str
    implicated_items: List[str]

class RiskResponse(BaseModel):
    patient_id: str
    safe_to_prescribe: bool
    summary_note: str
    risk_flags: List[RiskFlagResponse]

# Sarvam Scribe Models
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

# Report Models
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


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    mongo_ok = False
    try:
        client = get_mongo_client()
        await asyncio.wait_for(client.admin.command("ping"), timeout=2.0)
        mongo_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "llm_provider": config.LLM_PROVIDER,
        "llm_model": (
            config.OLLAMA_LLM_MODEL
            if config.LLM_PROVIDER == "ollama"
            else config.GROQ_LLM_MODEL
        ),
        "use_gemini_embeddings": config.USE_GEMINI_EMBEDDINGS,
        "embedding_model": config.EMBEDDING_MODEL_NAME,
        "sarvam_configured": bool(config.SARVAM_API_KEY),
        "mongodb_connected": mongo_ok,
    }


# ── RAG Medical History Endpoints ─────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/history")
async def ingest_patient_history(
    patient_id: str,
    text: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
):
    """
    Ingests plain text and uploaded files for a patient, chunking and storing them in ChromaDB.
    """
    all_chunks = []

    # 1. Process plain text notes if provided
    if text and text.strip():
        logger.info("Processing text notes for patient: %s", patient_id)
        text_metadata = {"source": "direct_input", "patient_id": patient_id}
        text_chunks = doc_processor.chunk_text(text, text_metadata)
        all_chunks.extend(text_chunks)

    # 2. Process uploaded files if provided
    if files:
        for file in files:
            if not file.filename:
                continue
            logger.info("Processing file %s for patient: %s", file.filename, patient_id)
            try:
                file_bytes = await file.read()
                file_text = doc_processor.extract_text(file.filename, file_bytes)

                file_metadata = {
                    "source": "file_upload",
                    "filename": file.filename,
                    "patient_id": patient_id,
                }
                file_chunks = doc_processor.chunk_text(file_text, file_metadata)
                all_chunks.extend(file_chunks)
            except Exception as e:
                logger.error("Failed to process file %s: %s", file.filename, e)
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process file {file.filename}: {str(e)}",
                )

    if not all_chunks:
        raise HTTPException(
            status_code=400, detail="No medical history notes or files were provided."
        )

    # 3. Add to ChromaDB vector store
    try:
        vector_store_service.add_patient_documents(patient_id, all_chunks)
    except Exception as e:
        logger.error("Failed to index documents: %s", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to index medical records: {str(e)}"
        )

    return {
        "status": "success",
        "message": f"Successfully ingested {len(all_chunks)} chunks of medical history for patient {patient_id}.",
        "chunks_count": len(all_chunks),
    }


@app.get("/api/patients/{patient_id}/retrieve")
def get_patient_details(patient_id: str):
    retrieved_docs = vector_store_service.retrieve_patient_documents(patient_id, k=8)

    # If no documents are found, return empty fields but don't error out
    if not retrieved_docs:
        return SummaryResponse(
            patient_id=patient_id,
            chronic_conditions=["None documented"],
            allergies=["None documented"],
            current_medications=["None documented"],
            past_surgeries=["None documented"],
            clinical_summary="No medical records found for this patient. Please ensure history was submitted correctly.",
            retrieved_snippets=[],
        )

    return retrieved_docs[0]


@app.get("/api/patients/{patient_id}/summary", response_model=SummaryResponse)
def get_patient_summary(patient_id: str):
    """
    Retrieves the patient's records, runs the LangGraph summary agent, and returns the structured summary.
    """
    try:
        # 1. Retrieve patient documents from ChromaDB
        retrieved_docs = vector_store_service.retrieve_patient_documents(patient_id, k=8)

        # If no documents are found, return empty fields
        if not retrieved_docs:
            return SummaryResponse(
                patient_id=patient_id,
                chronic_conditions=["None documented"],
                allergies=["None documented"],
                current_medications=["None documented"],
                past_surgeries=["None documented"],
                clinical_summary="No medical records found for this patient. Please ensure history was submitted correctly.",
                retrieved_snippets=[],
            )

        # 2. Run the LangGraph summary agent
        agent_output = summary_agent.run_agent(patient_id, retrieved_docs)

        # 3. Extract source text snippets for doctor reference
        snippets = [doc["page_content"] for doc in retrieved_docs]

        return SummaryResponse(
            patient_id=patient_id,
            chronic_conditions=agent_output.chronic_conditions,
            allergies=agent_output.allergies,
            current_medications=agent_output.current_medications,
            past_surgeries=agent_output.past_surgeries,
            clinical_summary=agent_output.clinical_summary,
            retrieved_snippets=snippets,
        )
    except Exception as e:
        logger.error("Error compiling patient summary: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to compile medical summary: {str(e)}"
        )


@app.get("/api/patients/{patient_id}/risks", response_model=RiskResponse)
def get_patient_risks(patient_id: str):
    """
    Runs the summary agent first, then passes the result to the RiskAgent
    to identify dangerous medications, interactions, contraindications, and allergies.
    """
    try:
        # 1. Retrieve documents
        retrieved_docs = vector_store_service.retrieve_patient_documents(patient_id, k=8)

        if not retrieved_docs:
            return RiskResponse(
                patient_id=patient_id,
                safe_to_prescribe=True,
                summary_note="No medical records found. Risk assessment skipped.",
                risk_flags=[],
            )

        # 2. Run summary agent to get structured patient facts
        summary = summary_agent.run_agent(patient_id, retrieved_docs)

        # 3. Pass summary output into risk agent
        assessment = risk_agent.run_agent(
            patient_id=patient_id,
            chronic_conditions=summary.chronic_conditions,
            allergies=summary.allergies,
            current_medications=summary.current_medications,
            past_surgeries=summary.past_surgeries,
            clinical_summary=summary.clinical_summary,
        )

        return RiskResponse(
            patient_id=patient_id,
            safe_to_prescribe=assessment.safe_to_prescribe,
            summary_note=assessment.summary_note,
            risk_flags=[
                RiskFlagResponse(
                    risk_type=f.risk_type,
                    severity=f.severity,
                    description=f.description,
                    implicated_items=f.implicated_items,
                )
                for f in assessment.risk_flags
            ],
        )
    except Exception as e:
        logger.error("Risk assessment failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


# ── Feature 1: Ambient Clinical Scribe Endpoints ──────────────────────────────

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


# ── Feature 2: Automated Patient Report & Mailing Endpoints ──────────────────

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


# ── Shutdown Hook ─────────────────────────────────────────────────────────────

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Closing MongoDB client...")
    await close_mongo_client()

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Reload comment
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
