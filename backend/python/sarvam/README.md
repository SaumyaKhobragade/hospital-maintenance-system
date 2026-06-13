# Vitality AI Sidecar Microservice

Async Python FastAPI sidecar that plugs directly into the **Vitality Java 17 / Spring Boot** hospital triage backend. Provides two production-grade AI workflows powered by **LangGraph**, **LangChain**, **Sarvam AI**, and **Ollama/Groq**.

---

## Architecture Overview

```
Java Spring Boot (Port 9090)
        │
        ├── REST calls ──────────────────────────────────────────┐
        └── WebSocket /ws/events ─────────────────────────────── │
                                                                 ▼
                    Vitality AI Sidecar (Port 8003)
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │  Feature 1: Ambient Clinical Scribe     │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Node 1: transcribe_ambient_audio  │   │
                    │  │   └─ Sarvam AI Saaras:v3 (hi-IN) │   │
                    │  │ Node 2: generate_soap_note         │   │
                    │  │   └─ Ollama / Groq LLM             │   │
                    │  │ Node 3: draft_patient_report       │   │
                    │  │   └─ Ollama / Groq LLM             │   │
                    │  │ ──── INTERRUPT (human approval) ── │   │
                    │  │ Node 4: execute_dispatch_telemetry │   │
                    │  │   └─ Email Tool + MongoDB          │   │
                    │  └──────────────────────────────────┘   │
                    │                                         │
                    │  Feature 2: Automated Report & Mailing  │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Node 1: detect_anomalies          │   │
                    │  │   └─ LLM + Medical Baselines      │   │
                    │  │ Node 2: synthesise_clinical_sum.. │   │
                    │  │ Node 3: build_patient_mailing_..  │   │
                    │  │ Node 4: dispatch_report_telemetry │   │
                    │  │   └─ Email Tool + MongoDB          │   │
                    │  └──────────────────────────────────┘   │
                    │                                         │
                    │  Checkpointer: InMemorySaver            │
                    │  DB: Motor (MongoDB) + Supabase         │
                    └─────────────────────────────────────────┘
```

---

## Project Structure

```
backend/python/
├── main.py                          # FastAPI app entry point + WebSocket bridge
├── config.py                        # Environment variable loader
├── requirements.txt
├── .env.example                     # Template — copy to .env and fill in keys
│
├── db/
│   ├── __init__.py
│   └── mongo_client.py              # Motor async MongoDB client + fire_telemetry()
│
├── services/
│   ├── __init__.py
│   ├── llm_factory.py               # Provider-agnostic LLM builder (Ollama | Groq)
│   ├── tools.py                     # LangChain tools: email dispatch, Sarvam STT
│   ├── scribe_workflow.py           # Feature 1 LangGraph workflow
│   └── report_workflow.py           # Feature 2 LangGraph workflow
│
└── routers/
    ├── __init__.py
    ├── schemas.py                   # Pydantic v2 request/response models
    ├── scribe_router.py             # /scribe/* endpoints
    └── report_router.py             # /report/* endpoints
```

---

## Quick Start

### 1. Set up environment

```bash
cd backend/python
cp .env.example .env
# Edit .env with your API keys
```

### 2. Install dependencies

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 3. Start Ollama (if using local LLM)

```bash
ollama serve
ollama pull llama3.2:latest
```

### 4. Run the sidecar

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

### 5. Open API docs

```
http://localhost:8003/docs
```

---

## API Reference

### Feature 1: Ambient Clinical Scribe

#### Start Pipeline
```http
POST /scribe/start
Content-Type: application/json

{
  "patient_id": "PAT-001",
  "patient_email": "patient@example.com",
  "audio_file_path": "C:/audio/consult.wav"
}
```

**Response:** `ScribeDraftResponse` containing `thread_id`, `raw_transcript`, `structured_soap_note`, `patient_report_draft`. Status: `PENDING_APPROVAL`.

#### Poll Status
```http
GET /scribe/status?thread_id=scribe-PAT-001-abc12345
```

#### Doctor Approve & Dispatch
```http
POST /scribe/approve
Content-Type: application/json

{
  "thread_id": "scribe-PAT-001-abc12345"
}
```

This resumes the frozen LangGraph thread using `Command(resume=True)`, executes the dispatch node, and fires MongoDB telemetry.

---

### Feature 2: Automated Patient Report

```http
POST /report/generate
Content-Type: application/json

{
  "patient_id": "PAT-007",
  "patient_email": "patient@example.com",
  "patient_metrics": {
    "BP_systolic": 158,
    "BP_diastolic": 98,
    "heart_rate": 95,
    "SpO2": 93,
    "glucose_fasting": 135,
    "HbA1c": 7.2,
    "haemoglobin": 10.8,
    "creatinine": 1.6,
    "total_cholesterol": 248
  },
  "additional_context": "56-year-old male with known T2DM and hypertension."
}
```

**Response:** Full `ReportResponse` with anomaly report, clinical summary, patient email body, and dispatch receipt.

---

### WebSocket Bridge

```
ws://localhost:8003/ws/events
```

Send JSON commands:
```json
{ "action": "ping" }
{ "action": "status", "thread_id": "scribe-PAT-001-abc12345" }
```

Receive real-time events: `CONNECTION_ESTABLISHED`, `PONG`, `THREAD_STATUS`, `ERROR`.

---

## MongoDB Telemetry Schema

Every dispatch event writes to `vitality_ai.ai_telemetry`:

```json
{
  "_id": "ObjectId(...)",
  "event_type": "AMBIENT_SCRIBE_DISPATCH",
  "timestamp": "2026-06-14T00:00:00.000Z",
  "patient_id": "PAT-001",
  "patient_email": "patient@example.com",
  "soap_note": "SUBJECTIVE: ...",
  "patient_report": "Your Test Results ...",
  "email_receipt": "SUCCESS | Receipt: MOCK-EMAIL-..."
}
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `LLM_PROVIDER` | `ollama` or `groq` | `ollama` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_LLM_MODEL` | Ollama model name | `llama3.2:latest` |
| `GROQ_API_KEY` | Groq cloud API key | — |
| `GROQ_LLM_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `SARVAM_API_KEY` | Sarvam AI subscription key | — |
| `SUPABASE_URL` | Supabase project URL | — |
| `SUPABASE_KEY` | Supabase anon/service key | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | `vitality_ai` |
| `PORT` | Service port | `8003` |
| `JAVA_BACKEND_URL` | Java backend base URL | `http://localhost:9090` |
