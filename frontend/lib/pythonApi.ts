/**
 * pythonApi.ts
 * Typed API client for the HMS Unified Python AI Backend (FastAPI, port 8003).
 *
 * All functions return typed responses or throw on HTTP error.
 */

export const PYTHON_API = (
  process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8003"
).replace(/\/$/, "");

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ChunkDoc {
  page_content: string;
  metadata: {
    patient_id?: string;
    source?: string;
    filename?: string;
    [key: string]: unknown;
  };
}

export interface ChunksResponse {
  patient_id: string;
  chunks: ChunkDoc[];
  count: number;
  message?: string;
}

export interface SummaryResponse {
  patient_id: string;
  chronic_conditions: string[];
  allergies: string[];
  current_medications: string[];
  past_surgeries: string[];
  clinical_summary: string;
  retrieved_snippets: string[];
}

export interface RiskFlag {
  risk_type: string;
  severity: string;
  description: string;
  implicated_items: string[];
}

export interface RiskResponse {
  patient_id: string;
  safe_to_prescribe: boolean;
  summary_note: string;
  risk_flags: RiskFlag[];
}

export interface IngestHistoryResponse {
  status: string;
  message: string;
  chunks_count: number;
}

export interface ScribeDraftResponse {
  thread_id: string;
  patient_id: string;
  patient_email: string;
  raw_transcript: string;
  structured_soap_note: string;
  patient_report_draft: string;
  status: string;
}

export interface ScribeApproveResponse {
  thread_id: string;
  patient_id: string;
  status: string;
  message: string;
}

export interface CombinedReportResponse {
  patient_id: string;
  patient_email: string | null;
  combined_report: string;
  dispatch_receipt: string | null;
  status: string;
}

export interface TelemetryEvent {
  event_type: string;
  timestamp: string;
  patient_id?: string;
  thread_id?: string;
  [key: string]: unknown;
}

export interface TelemetryResponse {
  events: TelemetryEvent[];
  count: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function pyGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PYTHON_API}${path}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${path} failed [${res.status}]: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function pyPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PYTHON_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} failed [${res.status}]: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function pyPostForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${PYTHON_API}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} failed [${res.status}]: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const pythonApi = {
  /** Health check – verify the Python backend is reachable. */
  health: () => pyGet<Record<string, unknown>>("/health"),

  // ── RAG Medical History ──────────────────────────────────────────────────

  /**
   * Ingest patient history as text and/or file uploads.
   * files: array of File objects from a file input.
   */
  ingestHistory: (
    patientId: string,
    text?: string,
    files?: File[]
  ): Promise<IngestHistoryResponse> => {
    const form = new FormData();
    if (text) form.append("text", text);
    if (files) files.forEach((f) => form.append("files", f));
    return pyPostForm<IngestHistoryResponse>(
      `/api/patients/${patientId}/history`,
      form
    );
  },

  /** Get structured clinical summary for a patient. */
  getSummary: (patientId: string) =>
    pyGet<SummaryResponse>(`/api/patients/${patientId}/summary`),

  /** Get all raw ChromaDB chunks stored for a patient. */
  getPatientChunks: (patientId: string, query?: string, k = 20) =>
    pyGet<ChunksResponse>(
      `/api/patients/${patientId}/chunks?k=${k}${query ? `&query=${encodeURIComponent(query)}` : ""}`
    ),

  /** Get risk assessment (drug interactions, contraindications) for a patient. */
  getRisks: (patientId: string) =>
    pyGet<RiskResponse>(`/api/patients/${patientId}/risks`),

  // ── Ambient Clinical Scribe ──────────────────────────────────────────────

  /**
   * Upload a browser-recorded audio blob to start the scribe pipeline.
   * audioBlob: Blob from MediaRecorder, patientId + patientEmail required.
   */
  uploadScribeAudio: (
    patientId: string,
    patientEmail: string,
    audioBlob: Blob,
    filename = "recording.wav"
  ): Promise<ScribeDraftResponse> => {
    const form = new FormData();
    form.append("patient_id", patientId);
    form.append("patient_email", patientEmail);
    form.append("audio", audioBlob, filename);
    return pyPostForm<ScribeDraftResponse>("/scribe/upload", form);
  },

  /** Get frozen state of a scribe session (without resuming). */
  getScribeStatus: (threadId: string) =>
    pyGet<ScribeDraftResponse>(`/scribe/status?thread_id=${threadId}`),

  /** Doctor approval – resume the scribe pipeline and dispatch via email. */
  approveScribe: (threadId: string) =>
    pyPost<ScribeApproveResponse>("/scribe/approve", { thread_id: threadId }),

  // ── Patient Report (Metrics-based) ───────────────────────────────────────

  /**
   * Generate an anomaly / lab metrics report and dispatch to patient.
   */
  generateReport: (body: {
    patient_id: string;
    patient_email: string;
    patient_metrics: Record<string, unknown>;
    additional_context?: string;
  }) => pyPost<Record<string, unknown>>("/report/generate", body),

  // ── Combined Multi-disciplinary Report ───────────────────────────────────

  /**
   * Upload lab/pathology/radiology files and generate a combined report.
   * Optionally dispatches via email if patient_email is provided.
   */
  generateCombinedReport: (
    patientId: string,
    files: File[],
    patientEmail?: string,
    additionalContext?: string
  ): Promise<CombinedReportResponse> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    if (patientEmail) form.append("patient_email", patientEmail);
    if (additionalContext) form.append("additional_context", additionalContext);
    return pyPostForm<CombinedReportResponse>(
      `/api/patients/${patientId}/combined-report`,
      form
    );
  },

  // ── Telemetry Logs ───────────────────────────────────────────────────────

  /**
   * Fetch the latest AI inference telemetry events from MongoDB.
   */
  getTelemetryLogs: (limit = 50) =>
    pyGet<TelemetryResponse>(`/api/telemetry?limit=${limit}`),
};
