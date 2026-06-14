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

import os
import tempfile
import uvicorn
from fastapi import FastAPI, HTTPException, File, Form, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import config
from db import fire_telemetry, close_mongo_client, get_mongo_client, get_telemetry_collection, get_patients_collection
from db.redis_cache import cache_delete_pattern, cache_get, cache_set, close_redis_client
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStoreService
from services.summary_agent import SummaryAgent
from services.risk_agent import RiskAgent
from services.scribe_workflow import ScribeWorkflowGraph
from services.report_workflow import ReportWorkflowGraph
from services.combined_report import CombinedReportService
from services.prescription_reader import PrescriptionReaderService

import sys
from pathlib import Path
image_video_backend_dir = Path(__file__).resolve().parent.parent / "imageVideoBackend"
if str(image_video_backend_dir) not in sys.path:
    sys.path.append(str(image_video_backend_dir))

from models.events import DistressEvent, AnalysisResponse
from models.injury import InjuryAnalysisResult, ISAHealthResponse
from image_video_services.image_detection import detect_image, get_results, clear_results
from image_video_services.video_detection import detect_video, get_events, clear_events

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
combined_report_service = CombinedReportService()
prescription_reader = PrescriptionReaderService()

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
    stt_provider: str = "sarvam"  # "sarvam" (India) or "elevenlabs" (International)

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

class CombinedReportResponse(BaseModel):
    patient_id: str
    patient_email: Optional[str] = None
    combined_report: str
    dispatch_receipt: Optional[str] = None
    status: str

# Prescription Reader Models
class PrescriptionMedication(BaseModel):
    name: str
    dosage: str
    frequency: str

class PrescriptionResponse(BaseModel):
    patient_id: str
    filename: str
    raw_ocr_text: str
    medications: List[PrescriptionMedication]
    instructions: List[str]
    prescribing_doctor: str
    prescription_date: str
    chunks_stored: int
    status: str = "DIGITIZED"



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
    files: List[UploadFile] = File(default=[]),
    # Optional patient metadata fields – saved to MongoDB patient registry
    name: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    blood_group: Optional[str] = Form(None),
    email: Optional[str] = Form(None),

):
    """
    Ingests plain text and uploaded files for a patient, chunking and storing them in ChromaDB.
    Optionally upserts the patient's basic metadata (name, dob, etc.) into MongoDB.
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

    await cache_delete_pattern(f"patient:{patient_id}:*")

    # 4. Upsert patient metadata into MongoDB patients registry
    resolved_name = (
        name
        or f"{(first_name or '').strip()} {(last_name or '').strip()}".strip()
        or None
    )
    if resolved_name:
        try:
            patients_col = get_patients_collection()
            patient_doc = {
                "id": patient_id,
                "name": resolved_name,
                "first_name": first_name or "",
                "last_name": last_name or "",
                "dob": dob or "",
                "phone": phone or "",
                "address": address or "",
                "blood_group": blood_group or "",
                "email": email or "",
                "registered_at": datetime.now(timezone.utc).isoformat(),
            }
            await patients_col.replace_one({"id": patient_id}, patient_doc, upsert=True)
            logger.info("[MongoDB] Patient registry upserted: %s (%s)", patient_id, resolved_name)
        except Exception as e:
            # Non-fatal: registry write failure should not block ChromaDB ingestion
            logger.warning("[MongoDB] Failed to upsert patient registry: %s", e)

    return {
        "status": "success",
        "message": f"Successfully ingested {len(all_chunks)} chunks of medical history for patient {patient_id}.",
        "chunks_count": len(all_chunks),
        "patient_id": patient_id,
        "patient_name": resolved_name,
    }


# ── Patient Registry Endpoint ─────────────────────────────────────────────────

@app.get("/api/patients")
async def list_all_patients():
    """
    Returns the list of all registered patients from MongoDB.
    Each document contains at minimum: id, name, dob, phone, blood_group, email.
    """
    try:
        patients_col = get_patients_collection()
        cursor = patients_col.find({}, {"_id": 0}).sort("registered_at", -1)
        patients = await cursor.to_list(length=1000)
        return {"patients": patients, "count": len(patients)}
    except Exception as exc:
        logger.error("[MongoDB] Failed to list patients: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch patient registry: {str(exc)}")


@app.get("/api/patients/{patient_id}/chunks")
async def get_patient_chunks(
    patient_id: str,
    query: str = "medical history symptoms allergies medications",
    k: int = 20,
):
    """
    Returns all stored ChromaDB chunks for a patient as raw documents.
    Supports an optional semantic query to re-rank which chunks surface first.
    k: max number of chunks to return (default 20).
    """
    cache_key = f"patient:{patient_id}:chunks:{query}:{k}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    retrieved_docs = vector_store_service.retrieve_patient_documents(patient_id, query=query, k=k)

    if not retrieved_docs:
        result = {
            "patient_id": patient_id,
            "chunks": [],
            "count": 0,
            "message": "No records found. Register this patient first via Add Patient.",
        }
        await cache_set(cache_key, result)
        return result

    result = {
        "patient_id": patient_id,
        "chunks": retrieved_docs,   # [{"page_content": str, "metadata": dict}, ...]
        "count": len(retrieved_docs),
    }
    await cache_set(cache_key, result)
    return result


@app.get("/api/patients/{patient_id}/retrieve")
async def get_patient_details(patient_id: str):
    """Backwards-compat alias — returns first chunk only."""
    cache_key = f"patient:{patient_id}:retrieve"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    retrieved_docs = vector_store_service.retrieve_patient_documents(patient_id, k=8)
    if not retrieved_docs:
        return SummaryResponse(
            patient_id=patient_id,
            chronic_conditions=["None documented"],
            allergies=["None documented"],
            current_medications=["None documented"],
            past_surgeries=["None documented"],
            clinical_summary="No medical records found for this patient.",
            retrieved_snippets=[],
        )
    result = retrieved_docs[0]
    await cache_set(cache_key, result)
    return result


@app.get("/api/patients/{patient_id}/summary", response_model=SummaryResponse)
async def get_patient_summary(patient_id: str):
    """
    Retrieves the patient's records, runs the LangGraph summary agent, and returns the structured summary.
    """
    try:
        cache_key = f"patient:{patient_id}:summary"
        cached = await cache_get(cache_key)
        if cached is not None:
            return cached
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

        result = SummaryResponse(
            patient_id=patient_id,
            chronic_conditions=agent_output.chronic_conditions,
            allergies=agent_output.allergies,
            current_medications=agent_output.current_medications,
            past_surgeries=agent_output.past_surgeries,
            clinical_summary=agent_output.clinical_summary,
            retrieved_snippets=snippets,
        )
        await cache_set(cache_key, result.model_dump())
        return result
    except Exception as e:
        logger.error("Error compiling patient summary: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to compile medical summary: {str(e)}"
        )


@app.get("/api/patients/{patient_id}/risks", response_model=RiskResponse)
async def get_patient_risks(patient_id: str):
    """
    Runs the summary agent first, then passes the result to the RiskAgent
    to identify dangerous medications, interactions, contraindications, and allergies.
    """
    try:
        cache_key = f"patient:{patient_id}:risks"
        cached = await cache_get(cache_key)
        if cached is not None:
            return cached
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

        result = RiskResponse(
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
        await cache_set(cache_key, result.model_dump())
        return result
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
            stt_provider=body.stt_provider,
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
async def get_scribe_status(thread_id: str):
    """
    Read the current frozen state of a scribe session without resuming it.
    """
    cache_key = f"scribe:{thread_id}:status"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    state = scribe_graph.get_thread_state(thread_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail=f"No scribe session found for thread_id='{thread_id}'.",
        )
    result = ScribeDraftResponse(
        thread_id=thread_id,
        patient_id=state.get("patient_id", ""),
        patient_email=state.get("patient_email", ""),
        raw_transcript=state.get("raw_transcript", ""),
        structured_soap_note=state.get("structured_soap_note", ""),
        patient_report_draft=state.get("patient_report_draft", ""),
        status="DISPATCHED" if state.get("is_approved") else "PENDING_APPROVAL",
    )
    await cache_set(cache_key, result.model_dump())
    return result


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
    await cache_delete_pattern(f"scribe:{body.thread_id}:*")
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


@app.post("/api/patients/{patient_id}/combined-report", response_model=CombinedReportResponse)
async def generate_combined_report_route(
    patient_id: str,
    files: List[UploadFile] = File(default=[]),
    patient_email: Optional[str] = Form(None),
    additional_context: Optional[str] = Form(None),
):
    """
    Endpoint to ingest pathology, radiology, or lab report files for a patient,
    index them in ChromaDB, retrieve all patient records, and generate a unified combined report.
    """
    logger.info("Combined report generation initiated for patient: %s", patient_id)
    
    # 1. Ingest files if provided
    all_chunks = []
    if files:
        for file in files:
            if not file.filename:
                continue
            logger.info("Processing file upload: %s for patient: %s", file.filename, patient_id)
            try:
                file_bytes = await file.read()
                file_text = doc_processor.extract_text(file.filename, file_bytes)

                file_metadata = {
                    "source": "report_upload",
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

        if all_chunks:
            try:
                vector_store_service.add_patient_documents(patient_id, all_chunks)
                await cache_delete_pattern(f"patient:{patient_id}:*")
            except Exception as e:
                logger.error("Failed to index uploaded reports: %s", e)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to index uploaded reports: {str(e)}",
                )

    # 2. Retrieve all documents from ChromaDB (both historical clinical notes and newly uploaded reports)
    try:
        retrieved_docs = vector_store_service.retrieve_patient_documents(
            patient_id,
            query="pathology radiology clinical laboratory test reports history symptoms chronic conditions voice transcript conversation session soap note",
            k=15
        )
    except Exception as e:
        logger.error("Failed to retrieve documents: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve patient medical records: {str(e)}",
        )

    # 3. Generate combined clinical report via the service
    try:
        combined_report_text = combined_report_service.generate_combined_report(
            patient_id=patient_id,
            retrieved_docs=retrieved_docs,
            additional_context=additional_context or ""
        )
    except Exception as e:
        logger.error("Failed to generate combined report: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate combined clinical report: {str(e)}",
        )

    # 4. Dispatch email if patient_email is provided
    dispatch_receipt = None
    if patient_email and patient_email.strip():
        from services.tools import send_patient_report_email
        try:
            dispatch_receipt = send_patient_report_email.invoke({
                "patient_email": patient_email,
                "patient_id": patient_id,
                "report_body": combined_report_text
            })
        except Exception as e:
            logger.error("Failed to dispatch combined report email: %s", e)
            dispatch_receipt = f"ERROR | Failed to dispatch email: {str(e)}"

    return CombinedReportResponse(
        patient_id=patient_id,
        patient_email=patient_email,
        combined_report=combined_report_text,
        dispatch_receipt=dispatch_receipt,
        status="DISPATCHED" if dispatch_receipt and "SUCCESS" in dispatch_receipt else "GENERATED"
    )


# ── Prescription Reader Endpoint ─────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/prescription", response_model=PrescriptionResponse)
async def read_prescription(
    patient_id: str,
    file: UploadFile = File(...),
):
    """
    Read a doctor's prescription image or PDF using Sarvam AI Document Digitization.

    Pipeline:
      1. Sarvam OCR  — digitize the prescription (image/PDF → raw text)
      2. LLM chain   — extract structured medications, dosages, instructions
      3. ChromaDB    — store result as a patient history chunk
      4. MongoDB     — fire PRESCRIPTION_OCR telemetry event

    Accepts: JPEG, PNG, PDF (multipart/form-data field name: "file")
    Max file size: 10 MB
    """
    MAX_BYTES = 10 * 1024 * 1024  # 10 MB
    filename = file.filename or "prescription"
    content_type = file.content_type or ""

    # Validate file type
    allowed_exts = {".jpg", ".jpeg", ".png", ".pdf", ".webp", ".tiff", ".tif"}
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in allowed_exts and "image" not in content_type and "pdf" not in content_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Accepted: JPEG, PNG, PDF, WEBP, TIFF.",
        )

    # Read bytes with size guard
    file_bytes = await file.read()
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(file_bytes) // 1024} KB). Maximum allowed is 10 MB.",
        )

    logger.info(
        "[Prescription] Reading prescription for patient=%s  file=%s  size=%d bytes",
        patient_id, filename, len(file_bytes),
    )

    # Step 1 & 2 — OCR + structured extraction
    try:
        result = await prescription_reader.read_prescription(file_bytes, filename)
    except Exception as exc:
        logger.error("[Prescription] Reader pipeline failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prescription reading failed: {exc}")

    raw_ocr_text: str = result.get("raw_ocr_text", "")
    medications_list: list = result.get("medications_list", [])
    instructions: List[str] = result.get("general_instructions", [])
    prescribing_doctor: str = result.get("prescribing_doctor", "Unknown")
    prescription_date: str = result.get("prescription_date", "Unknown")

    # Build typed medication list from MedicationEntry dicts
    medications: List[PrescriptionMedication] = [
        PrescriptionMedication(
            name=entry.get("drug_name_and_strength", "Unknown") if isinstance(entry, dict) else str(entry),
            dosage=entry.get("dosage", "") if isinstance(entry, dict) else "",
            frequency=entry.get("frequency_and_duration", "") if isinstance(entry, dict) else "",
        )
        for entry in medications_list
    ]

    # Step 3 — Store in ChromaDB as a patient history chunk
    chunks_stored = 0
    try:
        prescription_text_chunk = (
            f"PRESCRIPTION OCR — {filename} — Date: {prescription_date}\n"
            f"Doctor: {prescribing_doctor}\n\n"
            f"Raw Prescription Text:\n{raw_ocr_text}\n\n"
            f"Medications:\n"
            + "\n".join(
                f"  - {m.name}: {m.dosage}, {m.frequency}"
                for m in medications
            )
            + (f"\n\nInstructions:\n" + "\n".join(f"  - {i}" for i in instructions) if instructions else "")
        )
        chunk_metadata = {
            "source": "prescription_ocr",
            "filename": filename,
            "patient_id": patient_id,
            "prescribing_doctor": prescribing_doctor,
            "prescription_date": prescription_date,
        }
        chunks = doc_processor.chunk_text(prescription_text_chunk, chunk_metadata)
        vector_store_service.add_patient_documents(patient_id, chunks)
        chunks_stored = len(chunks)
        logger.info(
            "[Prescription] Stored %d ChromaDB chunks for patient=%s",
            chunks_stored, patient_id,
        )
    except Exception as exc:
        logger.warning("[Prescription] ChromaDB storage failed (non-fatal): %s", exc)

    # Step 4 — MongoDB telemetry
    fire_telemetry(
        event_type="PRESCRIPTION_OCR",
        payload={
            "patient_id": patient_id,
            "filename": filename,
            "prescribing_doctor": prescribing_doctor,
            "prescription_date": prescription_date,
            "medication_count": len(medications),
            "chunks_stored": chunks_stored,
            "raw_ocr_preview": raw_ocr_text[:300],
        },
    )

    return PrescriptionResponse(
        patient_id=patient_id,
        filename=filename,
        raw_ocr_text=raw_ocr_text,
        medications=medications,
        instructions=instructions,
        prescribing_doctor=prescribing_doctor,
        prescription_date=prescription_date,
        chunks_stored=chunks_stored,
    )


# ── Telemetry Endpoint ───────────────────────────────────────────────────────

@app.get("/api/telemetry")
async def get_telemetry_logs(limit: int = 50):
    """
    Returns the latest AI inference telemetry events from MongoDB,
    sorted newest-first. Limit defaults to 50.
    """
    try:
        cache_key = f"telemetry:{limit}"
        cached = await cache_get(cache_key)
        if cached is not None:
            return cached
        collection = get_telemetry_collection()
        cursor = collection.find(
            {},
            {"_id": 0},  # exclude Mongo ObjectId for JSON serialization
        ).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        result = {"events": docs, "count": len(docs)}
        await cache_set(cache_key, result)
        return result
    except Exception as exc:
        logger.error("Failed to fetch telemetry logs: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch telemetry logs: {str(exc)}")


# ── Ambient Scribe: Browser Audio Upload Endpoint ─────────────────────────────

@app.post("/scribe/upload", response_model=ScribeDraftResponse)
async def upload_scribe_audio(
    patient_id: str = Form(...),
    patient_email: str = Form(...),
    audio: UploadFile = File(...),
    thread_id: Optional[str] = Form(None),
    stt_provider: str = Form("sarvam"),
):
    """
    Accept an audio file recorded in the browser (WAV/WebM/MP3),
    save it to a temp file, then run the full scribe pipeline.
    Returns transcript, SOAP note, and patient report draft.
    """
    thread_id = thread_id or f"scribe-{patient_id}-{uuid.uuid4().hex[:8]}"

    # Save uploaded audio to a temp file
    suffix = "." + (audio.filename.rsplit(".", 1)[-1] if audio.filename and "." in audio.filename else "wav")
    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        logger.info("[Scribe Upload] Saved audio to %s for patient %s (provider=%s)", tmp_path, patient_id, stt_provider)

        state = await scribe_graph.invoke_scribe_pipeline(
            thread_id=thread_id,
            patient_id=patient_id,
            patient_email=patient_email,
            audio_file_path=tmp_path,
            stt_provider=stt_provider,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Audio file error: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scribe upload pipeline failed: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return ScribeDraftResponse(
        thread_id=thread_id,
        patient_id=state.get("patient_id", patient_id),
        patient_email=state.get("patient_email", patient_email),
        raw_transcript=state.get("raw_transcript", ""),
        structured_soap_note=state.get("structured_soap_note", ""),
        patient_report_draft=state.get("patient_report_draft", ""),
    )


# ── Image and Video Detection Endpoints ────────────────────────────────────────

@app.post("/api/image/analyze", response_model=InjuryAnalysisResult, tags=["Injury Analysis"])
async def analyze_injury_image(image: UploadFile = File(...)):
    """
    Analyze an injury image for severity assessment.
    Upload an image (JPG/PNG) of a visible external injury.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    file_ext = Path(image.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        try:
            content = await image.read()
            tmp_file.write(content)
            tmp_file.flush()
            
            # Use service layer
            result = detect_image(tmp_file.name)
            return result
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error("Error analyzing image: %s", e, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
        finally:
            try:
                os.unlink(tmp_file.name)
            except Exception:
                pass


@app.post("/api/image/analyze-local", response_model=InjuryAnalysisResult, tags=["Injury Analysis"])
async def analyze_local_injury_image(image_path: str):
    """
    Analyze an injury image from local filesystem.
    """
    path = Path(image_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Image file not found: {image_path}")
    
    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    if path.suffix.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid image format")
        
    try:
        result = detect_image(str(path))
        return result
    except Exception as e:
        logger.error("Error analyzing local image: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")


@app.get("/api/image/results", response_model=List[InjuryAnalysisResult], tags=["Injury Analysis"])
async def get_injury_results(limit: int = 10):
    """
    Get recent injury analysis results.
    """
    return get_results(limit)


@app.delete("/api/image/results", tags=["Injury Analysis"])
async def clear_injury_results():
    """
    Clear all stored injury analysis results.
    """
    return clear_results()


@app.post("/api/video/analyze", response_model=AnalysisResponse, tags=["Video Analysis"])
async def analyze_video_feed(video: UploadFile = File(...)):
    """
    Analyze a video file for behavioral distress signals.
    """
    allowed_extensions = {".mp4", ".avi", ".mov", ".mkv"}
    file_ext = Path(video.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
        
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        try:
            content = await video.read()
            tmp_file.write(content)
            tmp_file.flush()
            
            # Use service layer
            response = detect_video(tmp_file.name)
            return response
        except Exception as e:
            logger.error("Error analyzing video: %s", e, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")
        finally:
            try:
                os.unlink(tmp_file.name)
            except Exception:
                pass


@app.post("/api/video/analyze-local", response_model=AnalysisResponse, tags=["Video Analysis"])
async def analyze_local_video_feed(video_path: str):
    """
    Analyze a video file from local filesystem.
    """
    path = Path(video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Video file not found: {video_path}")
        
    if path.suffix.lower() not in {".mp4", ".avi", ".mov", ".mkv"}:
        raise HTTPException(status_code=400, detail="Invalid video format")
        
    try:
        response = detect_video(str(path))
        return response
    except Exception as e:
        logger.error("Error analyzing local video: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@app.get("/api/video/events", response_model=List[DistressEvent], tags=["Video Analysis"])
async def get_video_distress_events():
    """
    Get all stored distress events.
    """
    return get_events()


@app.delete("/api/video/events", tags=["Video Analysis"])
async def clear_video_distress_events():
    """
    Clear all stored distress events.
    """
    return clear_events()


@app.get("/api/image/health", response_model=ISAHealthResponse, tags=["Injury Analysis"])
async def get_isa_health():
    """
    Health check for ISA module.
    """
    from core.injury_analyzer import get_analyzer
    analyzer = get_analyzer()
    return ISAHealthResponse(
        status="healthy",
        modelLoaded=analyzer.is_model_loaded(),
        version="1.0.0"
    )


# ── Shutdown Hook ─────────────────────────────────────────────────────────────


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Closing MongoDB client...")
    await close_mongo_client()
    await close_redis_client()

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Reload comment
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
