# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Project Title: Vitality Triage System (Multilingual Agentic AI Expansion)
**Document Version:** 1.0.0  
**Target Delivery Window:** 36-Hour Hackathon Implementation  
**Core Domain:** HealthTech / Emergency Medicine Infrastructure / Multi-Agent Systems  

---

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary
The **Vitality Triage System** is an adaptive, city-scale hospital triage platform. This project expands Vitality's high-performance **Java 17 / Spring Boot** core by integrating a pythonic **Agentic and Generative AI Layer** via an asynchronous sidecar gateway. 

The system transitions from a static, centralized scheduling model to a decentralized, multi-agent network. It translates messy handwritten medical documents, interprets computer vision waiting-room alerts, handles real-time peer-to-peer hospital resource negotiations, and supports code-mixed voice-triage check-ins. It bridges deterministic healthcare stability with deep linguistic reasoning.

### 1.2 Problem Statement
Emergency departments operate under critical capacity constraints where nursing shortages, surge patterns, and data fragmentation cause clinical bottlenecks. 
1. **Information Asymmetry:** Patients in high-stress triage environments frequently fail to accurately report critical historical conditions, allergies, or current prescriptions, directly impacting diagnostic pathways.
2. **Alarm Fatigue:** Real-time visual data feeds (such as OpenCV motion tracking identifying waiting-room falls or spasms) trigger continuous generic alerts, creating dashboard fatigue that causes overwhelmed nurses to overlook critical anomalies.
3. **Rigid Redirection Infrastructure:** Traditional hospital redirection protocols use rigid, centralized mathematical formulas that treat constraints as static variables, failing to adapt to dynamic, real-time localized crises (e.g., sudden staff fatigue or specialized equipment failures).
4. **Socio-Linguistic Barriers:** In highly diverse regional contexts, patients communicate using code-mixed local dialects (e.g., Hinglish, Marathi-English blend) that standard global medical interfaces cannot accurately parse, leading to miscommunication at check-in.

---

## 2. Project Goals & High-Level Value Proposition

### 2.1 Strategic Goals
* **Maximize Patient Safety:** Ensure that patient data routing never drops or breaks under system load, preserving human-in-the-loop validation as an absolute stop rule.
* **Optimize Local Resource Distribution:** Allow hospitals to coordinate and negotiate automated, peer-to-peer redirection contracts during major capacity spikes without central coordinator dependencies.
* **Fulfill Hackathon Track Eligibility:** Deliver a specialized, low-overhead unstructured telemetry log engine to secure eligibility and visibility for the **MongoDB Sponsor Track**.

### 2.2 Value Proposition
> "Our architecture retains its high-performance, thread-safe core in Java 17, while using a specialized Python sidecar running PydanticAI and Gemini Flash to handle complex clinical semantics. It features Sarvam AI for native Indian language speech comprehension, Eleven Labs for natural, clear vocal signaling on the clinical floor, and stores all system telemetry through MongoDB alongside Supabase to guarantee clean audit compliance."

---

## 3. Integrated Tech Stack Matrix

The platform is designed as a hybrid ecosystem where Java manages transactional state and thread-safe operations, while Python coordinates localized AI micro-services and third-party voice models.

| Component Layer | Core Java Architecture (Main Language) | Python Sidecar Gateway (AI Logic & Storage) | Third-Party Voice & Language Engines |
| :--- | :--- | :--- | :--- |
| **Languages & Runtimes** | **Java 17 (JVM)** | Python 3.11+ (CPython) | Cloud APIs / Python SDKs |
| **Core Frameworks** | **Spring Boot 3.x** (Endpoints, scheduling, security, thread pools) | **FastAPI** (Async sidecar HTTP & WebSockets routing) | Official Client SDK Libraries |
| **Database & Persistence**| **Supabase Client / PostgREST** (Main relational database for transactional state) | **MongoDB / Motor Driver** (Asynchronous, non-blocking telemetry event logs for Track Eligibility) | *None* |
| **AI Orchestration** | *None* | **PydanticAI** (Strict schema mapping, type safety, dependency injection) | *None* |
| **Multilingual & OCR** | *None* | Local `sentence-transformers` (`all-MiniLM-L6-v2`), ChromaDB | **Sarvam AI APIs**<br>• *Saaras V3* (Code-mixed voice tracking)<br>• *Sarvam Vision* (Layout OCR) |
| **Core Reasoning / Vision** | OpenCV (Baseline motion heuristics) | Python Asyncio Event Loop | Google AI Studio (`gemini-2.0-flash` Free Developer Tier) |
| **Expressive Audio Output**| *None* | *None* | **Eleven Labs API** (Emotional alert broadcasting & human voice cloning) |
| **Inter-Service Mesh** | **Spring Boot WebSockets / `WebClient`** | **FastAPI WebSockets Router** | HTTPS REST / Streaming Audio Payloads |
| **Resilience & Workflow** | **Temporal Java SDK** (Orchestrates durable multi-step workflows) | **Temporal Python SDK** (Executes resilient, state-preserving sub-activities) | *None* |
| **Observability** | Spring Boot Actuator / Micrometer | **Pydantic Logfire** (Real-time agent transcription & token tracing) | Cloud/Platform Developer Consoles |

---

## 4. Functional Requirements & Core Features

### 4.1 Feature 1: Context-Aware Patient History RAG Pipeline
* **Description:** Ingests paper prescriptions and historical clinical sheets to build a real-time, searchable vector index mapped to the patient's current symptoms.
* **Technical Flow:** 1. A multi-modal visual prompt using `gemini-2.0-flash` parses handwritten prescription images into a structured JSON model.
  2. The structured JSON data is compiled into a text chunk and converted into a dense 384-dimensional vector using a local `sentence-transformers` model (`all-MiniLM-L6-v2`).
  3. The vector is saved into an in-memory **ChromaDB** store.
  4. When a patient arrives at triage, their current chief complaint is converted into a vector query. The RAG system retrieves the most relevant historical context and surfaces a concise 3-4 sentence clinical summary directly on the clinician's dashboard.

### 4.2 Feature 2: Peer-to-Peer Hospital Redirection Negotiator
* **Description:** Replaces static formulas with autonomous negotiating agents that coordinate patient transfers when a hospital reaches max capacity.
* **Technical Flow:**
  1. When Spring Boot flags a capacity spike, it kicks off a **Temporal Python Workflow**.
  2. Local negotiator agents use PydanticAI to exchange anonymized JSON payloads formatted to **HL7/FHIR standards**.
  3. The agents evaluate real-time factors like travel times, staffing levels, and active wait times to confirm an optimized redirection contract.

### 4.3 Feature 3: Multi-Modal Distress Synthesizer
* **Description:** Combines raw vision alerts with patient context to mitigate clinician alarm fatigue.
* **Technical Flow:**
  1. The Java-based **OpenCV** engine flags an emergency waiting-room anomaly (e.g., a patient collapsing or showing signs of a seizure).
  2. The system passes the relevant video frame to `gemini-2.0-flash` along with the patient’s active chart.
  3. The agent calculates a dynamic `DistressBoost_agent` score and generates a brief text explanation for the nursing station interface, explaining the exact clinical rationale behind the alert.

### 4.4 Feature 4: Indic Multilingual Voice Check-In Kiosk
* **Description:** Provides an accessible voice-first interface for diverse and regional user bases.
* **Technical Flow:**
  1. A patient speaks into the triage kiosk in a regional dialect or a code-mixed language (e.g., Hinglish).
  2. **Sarvam AI's Saaras V3** engine transcribes the audio, capturing the localized medical context.
  3. An agent structures the text and syncs it with **Supabase**.
  4. **Eleven Labs** synthesizes an expressive audio confirmation in the patient's language, guiding them through their immediate next steps.

---

## 5. System Architecture & Component Interactions

The following system diagram details the end-to-end data flow and architectural interactions across the hybrid stack, showcasing the communication loops between the core Java application and the AI microservices:
```
[ Triage Kiosk / User ] ──(Voice/Image Input)──> [ Java 17 / Spring Boot Core ]
│
(WebSocket Async Handoff)
│
▼
[ MongoDB Telemetry Log ] <──(Audit Capture)──── [ Python FastAPI Gateway ] ──> [ Supabase Relational DB ]
│
(PydanticAI Logic Controls)
│
┌───────────────────┴───────────────────┐
▼                                       ▼
[ Local RAG Vector Core ]                 [ Third-Party Services ]
• ChromaDB Store                          • Sarvam AI (Saaras V3)
• SentenceTransformers                    • Eleven Labs Audio
• Google AI Studio (Gemini)

```
## 6. MongoDB Sponsor Track Strategy (Telemetry & Audit Logging)

To establish complete eligibility for the MongoDB hackathon track without adding complexity to the core relational database schema in Supabase, MongoDB is deployed as an **AI Telemetry Store**.

### 6.1 Data Storage Strategy
Every time an AI pipeline executes, the FastAPI gateway captures the transaction payload and writes an unstructured document to MongoDB. This serves as a highly scalable audit log for tracking model performance and regulatory compliance.

### 6.2 Data Model Schema Example
```json
{
  "_id": "666b1a2f3e4d5c6b7a8b9c0d",
  "event_type": "PRESCRIPTION_DATA_EXTRACTION",
  "patient_id": "PT-99823",
  "timestamp": "2026-06-13T15:43:00Z",
  "execution_metrics": {
    "latency_ms": 1142,
    "input_tokens": 845,
    "output_tokens": 162
  },
  "payload_snapshot": {
    "detected_medications": ["Metformin 500mg", "Ramipril 5mg"],
    "handwriting_confidence_notes": "Slight smudging on dosage field, verified using clinical drug vocabulary matching.",
    "supabase_sync_status": "COMMITTED"
  }
}
```
## 7. Safety, Governance, and Non-Functional Requirements

### 7.1 Absolute Human-in-the-Loop Governance
* **Stop Rule:** No autonomous agent can execute a patient redirection or alter a queue priority ranking without explicit human confirmation. The system treats AI outputs purely as recommendation vectors; the ultimate decision-making power remains entirely with the medical staff.
* **Fail-Safe Mechanism:** If an API call fails, encounters a network timeout, or drops below a 0.80 confidence score threshold, the platform halts the agentic process. It immediately sounds an alert and rolls back to Vitality's base deterministic priority mathematics.

### 7.2 Non-Functional Requirements (NFRs)
* **Type Safety:** All runtime payloads entering or leaving the AI gateway must match a strict Pydantic schema. Any improperly formatted LLM strings are blocked before they can touch the database or application layers.
* **Zero-Cost Scalability:** The developer free tier of Google AI Studio combined with local execution setups for ChromaDB, SentenceTransformers, and MongoDB ensures the entire platform can be prototyped, tested, and presented with zero active cloud infrastructure fees.
* **Fault-Tolerant Workflows:** By wrapping multi-step AI tasks inside Temporal Workflows, the system maintains state execution history. This ensures complete reliability and resilience during live developer demos.