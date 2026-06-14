"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScanSearch, UploadCloud, FileText, Database, Cpu, CheckCircle2,
  Loader2, RefreshCw, AlertTriangle, Sparkles, X, WifiOff, BookOpen,
  Search, ChevronRight, Hash, Tag,
} from "lucide-react";
<<<<<<< HEAD
import { pythonApi, SummaryResponse, RiskResponse, ChunkDoc, ChunksResponse } from "@/lib/pythonApi";

export default function RAGHistoryPage() {
  // ── Search / retrieve state ──────────────────────────────────────────────
  const [searchId, setSearchId] = useState("");
  const [semanticQuery, setSemanticQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [chunksData, setChunksData] = useState<ChunksResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [risks, setRisks] = useState<RiskResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedChunkIdx, setSelectedChunkIdx] = useState<number | null>(null);
=======

interface RAGTemplate {
  id: string;
  name: string;
  fileName: string;
  ocrText: string;
  extractedFields: {
    medications: { name: string; dosage: string }[];
    diagnosis: string;
    doctorNotes: string;
    allergies: string[];
  };
  embeddingMetrics: {
    latency: string;
    chunkCount: number;
    vectorDims: number;
  };
  retrievedChunks: {
    id: string;
    source: string;
    text: string;
    similarity: number;
    medOverlap: string[];
  }[];
  aiSummary: {
    summary: string;
    patterns: string[];
    alerts: string[];
  };
}

import { supabase } from "../../../lib/supabaseClient";

interface SimilarityRecord {
  id: string;
  patientId: string;
  matchType: string;
  score: number;
  source: string;
  timestamp: string;
  confidence: number;
}

export default function RAGHistoryPage() {
  const [ragTemplates, setRagTemplates] = useState<RAGTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [pipelineStep, setPipelineStep] = useState<string>("Ready");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tableRecords, setTableRecords] = useState<SimilarityRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: templates } = await supabase.from("rag_templates").select("*");
      if (templates) {
        const mapped = templates.map((t: any) => ({
          id: t.id,
          name: t.name || "Template",
          fileName: t.file_name || "Unknown",
          ocrText: t.ocr_text || "",
          extractedFields: t.extracted_fields || { medications: [], diagnosis: "", doctorNotes: "", allergies: [] },
          embeddingMetrics: t.embedding_metrics || { latency: "0ms", chunkCount: 0, vectorDims: 0 },
          retrievedChunks: t.ai_summary?.chunks || [],
          aiSummary: t.ai_summary || { summary: "", patterns: [], alerts: [] }
        }));
        setRagTemplates(mapped);
        if (mapped.length > 0) setActiveTemplateId(mapped[0].id);
      }
      const { data: records } = await supabase.from("rag_similarity_records").select("*");
      if (records) {
        const mappedRecs = records.map((r: any) => ({
          id: r.id,
          patientId: r.patient_id || "Unknown",
          matchType: r.match_type || "General",
          score: r.score || 0,
          source: r.source || "Unknown",
          timestamp: r.record_timestamp || r.created_at || "Just now",
          confidence: r.confidence || 0
        }));
        setTableRecords(mappedRecs);
        if (mappedRecs.length > 0) setSelectedRecordId(mappedRecs[0].id);
      }
    };
    fetchData();
  }, []);
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00

  // ── Ingest state ─────────────────────────────────────────────────────────
  const [ingestId, setIngestId] = useState("");
  const [textInput, setTextInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Retrieve all chunks + summary + risks for a patient ──────────────────
  const handleRetrieve = async (pid?: string) => {
    const id = (pid ?? searchId).trim();
    if (!id) return;
    setIsFetching(true);
    setFetchError(null);
    setChunksData(null);
    setSummary(null);
    setRisks(null);
    setSelectedChunkIdx(null);

    try {
      const chunks = await pythonApi.getPatientChunks(id, semanticQuery || undefined, 20);
      setChunksData(chunks);
      if (chunks.count > 0) {
        const [s, r] = await Promise.all([
          pythonApi.getSummary(id),
          pythonApi.getRisks(id),
        ]);
        setSummary(s);
        setRisks(r);
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to retrieve.");
    } finally {
      setIsFetching(false);
    }
  };

  // ── Ingest ────────────────────────────────────────────────────────────────
  const handleIngest = async () => {
    if (!ingestId.trim() || (!textInput.trim() && files.length === 0)) return;
    setIsIngesting(true);
    setIngestStatus(null);
    setIngestError(null);
    try {
      const res = await pythonApi.ingestHistory(ingestId.trim(), textInput || undefined, files.length ? files : undefined);
      setIngestStatus(`✓ ${res.chunks_count} chunks indexed for ${ingestId.trim()}`);
      setFiles([]);
      setTextInput("");
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : "Ingestion failed.");
    } finally {
      setIsIngesting(false);
    }
  };

  const removeFile = (name: string) => setFiles((p) => p.filter((f) => f.name !== name));
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((p) => [...p, ...Array.from(list).filter((f) => !p.some((e) => e.name === f.name))]);
  };

  const sourceLabel = (meta: ChunkDoc["metadata"]) => {
    if (meta.filename) return meta.filename;
    if (meta.source === "direct_input") return "Direct text input";
    return meta.source ?? "Unknown";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ChromaDB · Retrieval Engine Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Gemini Embeddings
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            RAG History & Retrieval
          </h1>
          <p className="text-sm text-slate-500">
            Enter a Patient ID to view all stored vector chunks, run semantic queries, and generate clinical summaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Patient Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Search className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Retrieve Patient Records</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient ID</label>
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRetrieve()}
                placeholder="e.g. PT-9042"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-400 transition text-slate-800 font-mono"
              />
            </div>

<<<<<<< HEAD
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Semantic Query <span className="text-slate-300 font-normal">(optional)</span>
              </label>
              <input
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                placeholder="e.g. drug interactions, allergies"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-400 transition text-slate-800"
              />
              <p className="text-[10px] text-slate-400">Reranks chunks by similarity to your query.</p>
            </div>
=======
      <AnimatePresence mode="wait">
        {!isProcessing && (
          <motion.div
            key={activeTemplate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* Left Column: Upload widget, extraction checklist */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {activeTemplate && (
                <>
                  {/* 3. Prescription Upload & OCR Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                    <span className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2 block">
                      Drag & Drop Prescription Ingest
                    </span>

                    <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-slate-100/50 transition">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-slate-800">{activeTemplate?.fileName}</span>
                    <span className="text-slate-400">PDF / Image uploaded successfully</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Parsed OCR Stream</span>
                  <p className="text-slate-700 italic font-medium leading-normal">
                    "{activeTemplate.ocrText}"
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Extracted Schema</span>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold block">Extracted Meds</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {activeTemplate.extractedFields.medications.map((med, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-semibold">
                            {med.name} ({med.dosage})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold block">Extracted Diagnosis</span>
                      <span className="font-semibold text-slate-800">{activeTemplate.extractedFields.diagnosis}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold block">Allergies Detected</span>
                      <div className="flex flex-wrap gap-1">
                        {activeTemplate.extractedFields.allergies.map((al, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded">
                            {al}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-semibold block">Doctor Notes Summary</span>
                      <p className="text-slate-650 leading-normal font-medium italic">
                        "{activeTemplate.extractedFields.doctorNotes}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Embedding Generation Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <span className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2 block">
                  Embedding Ingestion Pipeline
                </span>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-800">Chunk Ingestion</span>
                      <span className="text-slate-400">Dimensions: {activeTemplate.embeddingMetrics.vectorDims} | Latency: {activeTemplate.embeddingMetrics.latency}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div>
                      <span className="block text-slate-400">Model Name</span>
                      <span className="font-semibold text-slate-700">text-embedding-ada-002</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-400">Segment Chunks</span>
                      <span className="font-semibold text-slate-700">{activeTemplate.embeddingMetrics.chunkCount} Nodes</span>
                    </div>
                  </div>
                </div>

                {/* 9. AI Monitoring Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-3">
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Retr Latency</span>
                    <span className="font-semibold text-slate-700 font-mono">45 ms</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Embed Acc.</span>
                    <span className="font-semibold text-emerald-600 font-mono">99.8%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00

            <button
              onClick={() => handleRetrieve()}
              disabled={isFetching || !searchId.trim()}
              id="retrieve-chunks-btn"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isFetching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Retrieving…</>
              ) : (
                <><ScanSearch className="w-4 h-4" /> Retrieve from ChromaDB</>
              )}
            </button>

            {fetchError && (
              <div className="flex gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                <WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          {chunksData && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Chunks", value: chunksData.count, icon: Database, color: "text-blue-600 bg-blue-50 border-blue-100" },
                { label: "Risk Flags", value: risks?.risk_flags.length ?? 0, icon: AlertTriangle, color: "text-rose-600 bg-rose-50 border-rose-100" },
                { label: "Conditions", value: summary?.chronic_conditions.filter(c => c !== "None documented").length ?? 0, icon: Hash, color: "text-violet-600 bg-violet-50 border-violet-100" },
                { label: "Prescribe?", value: risks?.safe_to_prescribe ? "Safe" : "No", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <span className="text-slate-900 font-bold text-lg leading-none">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ingest Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <UploadCloud className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900">Ingest New History</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient ID</label>
              <input
                value={ingestId}
                onChange={(e) => setIngestId(e.target.value)}
                placeholder="e.g. PT-9042"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-400 transition text-slate-800 font-mono"
              />
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste clinical notes, discharge summaries, prescriptions…"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white focus:border-blue-400 transition text-slate-800 resize-none min-h-[80px]"
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center text-center gap-1 cursor-pointer transition text-xs ${
                isDragging ? "border-blue-400 bg-blue-50/30" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
              }`}
            >
              <UploadCloud className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-700">Drag files or click</span>
              <span className="text-slate-400">PDF, TXT, Images</span>
              <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.txt,.png,.jpg"
                onChange={(e) => addFiles(e.target.files)} />
            </div>

            {files.map((f) => (
              <div key={f.name} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate text-slate-700">{f.name}</span>
                </div>
                <button onClick={() => removeFile(f.name)} className="text-slate-400 hover:text-rose-500 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {ingestStatus && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {ingestStatus}
              </div>
            )}
            {ingestError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-xs text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{ingestError}
              </div>
            )}

            <button
              onClick={handleIngest}
              disabled={isIngesting || !ingestId.trim() || (!textInput.trim() && files.length === 0)}
              id="ingest-history-btn"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isIngesting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Indexing…</> : <><UploadCloud className="w-3.5 h-3.5" /> Ingest & Index</>}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Loading */}
          <AnimatePresence>
            {isFetching && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center gap-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                  <ScanSearch className="w-5 h-5 text-blue-600 absolute animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Querying ChromaDB…</p>
                <p className="text-xs text-slate-500 font-mono">Filtering by patient_id metadata · running similarity search</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results */}
          {!isFetching && chunksData && chunksData.count === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center gap-3 text-center">
              <BookOpen className="w-9 h-9 text-slate-300" />
              <span className="font-semibold text-slate-700">No records found for {chunksData.patient_id}</span>
              <p className="text-xs text-slate-400 max-w-xs">
                {chunksData.message ?? "Register this patient via Add Patient, then retrieve here."}
              </p>
              <button onClick={() => { setIngestId(chunksData.patient_id); }}
                className="mt-1 text-xs text-blue-600 underline underline-offset-2">
                Pre-fill ingest panel with this ID →
              </button>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {!isFetching && chunksData && chunksData.count > 0 && (
              <motion.div key={chunksData.patient_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5">

                {/* AI Summary */}
                {summary && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-slate-900">AI Clinical Summary</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {chunksData.patient_id}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-700 bg-blue-50/20 border border-blue-100/40 rounded-xl p-4">
                      {summary.clinical_summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {[
                        { label: "Conditions", items: summary.chronic_conditions },
                        { label: "Allergies", items: summary.allergies, red: true },
                        { label: "Medications", items: summary.current_medications, blue: true },
                      ].map(({ label, items, red, blue }) => (
                        <div key={label}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</span>
                          <div className="flex flex-wrap gap-1">
                            {items.filter(i => i !== "None documented").map((item, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-lg border text-xs ${red ? "bg-rose-50 text-rose-700 border-rose-100" : blue ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-700 border-slate-100"}`}>
                                {item}
                              </span>
                            ))}
                            {items.filter(i => i !== "None documented").length === 0 && (
                              <span className="text-slate-400 italic">None documented</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {risks && risks.risk_flags.length > 0 && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Flags</span>
                        {risks.risk_flags.map((flag, i) => (
                          <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-rose-800">{flag.severity} · {flag.risk_type}</span>
                              <p className="text-rose-700 mt-0.5">{flag.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chunk Browser */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="p-5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-900">Vector Store Chunks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{chunksData.count} chunks · ChromaDB</span>
                      <button
                        onClick={() => handleRetrieve(chunksData.patient_id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {chunksData.chunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedChunkIdx(selectedChunkIdx === idx ? null : idx)}
                        className={`p-4 cursor-pointer transition hover:bg-slate-50/60 ${selectedChunkIdx === idx ? "bg-blue-50/30 border-l-2 border-l-blue-500" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold font-mono flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-mono font-semibold">
                                  {sourceLabel(chunk.metadata)}
                                </span>
                                {chunk.metadata.source && (
                                  <span className="text-[10px] text-slate-400">{chunk.metadata.source}</span>
                                )}
                              </div>
                              <p className={`text-xs text-slate-700 mt-1 leading-relaxed ${selectedChunkIdx === idx ? "" : "line-clamp-2"}`}>
                                {chunk.page_content}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform ${selectedChunkIdx === idx ? "rotate-90" : ""}`} />
                        </div>

                        {selectedChunkIdx === idx && Object.keys(chunk.metadata).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                            {Object.entries(chunk.metadata).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                <span className="text-slate-400">{k}: </span>{String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty idle state */}
          {!isFetching && !chunksData && !fetchError && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[350px]">
              <ScanSearch className="w-10 h-10 text-slate-300" />
              <span className="font-semibold text-slate-700">Enter a Patient ID and retrieve</span>
              <p className="text-xs text-slate-400 max-w-xs">
                All stored ChromaDB chunks for that patient will appear here, along with their AI clinical summary and risk flags.
              </p>
              <div className="flex flex-col gap-2 text-xs text-slate-400 mt-1">
                {["Filter by patient_id metadata in ChromaDB", "Expandable chunks with full metadata", "AI summary + risk flags inline"].map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{h}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
