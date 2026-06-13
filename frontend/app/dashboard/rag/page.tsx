"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScanSearch,
  UploadCloud,
  FileText,
  Database,
  Cpu,
  Layers,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  RefreshCw,
  MoreVertical,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen
} from "lucide-react";

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

const ragTemplates: RAGTemplate[] = [
  {
    id: "T1",
    name: "Template: Cardiac Rx",
    fileName: "rx_cardiac_jenkins.pdf",
    ocrText: "Rx: Lisinopril 20mg once daily. Metformin 1000mg twice daily. Atorvastatin 40mg once daily. Ibuprofen 400mg as needed.",
    extractedFields: {
      medications: [
        { name: "Lisinopril", dosage: "20mg daily" },
        { name: "Metformin", dosage: "1000mg twice daily" },
        { name: "Atorvastatin", dosage: "40mg daily" },
        { name: "Ibuprofen", dosage: "400mg as needed" }
      ],
      diagnosis: "Stage-II Hypertension & Type 2 Diabetes",
      doctorNotes: "Monitor BP twice daily. Review renal clearance profiles next visit.",
      allergies: ["Penicillin", "Sulfa drugs"]
    },
    embeddingMetrics: {
      latency: "42ms",
      chunkCount: 3,
      vectorDims: 1536
    },
    retrievedChunks: [
      {
        id: "CH-8802",
        source: "Cardiology EMR (Jan 2026)",
        text: "Patient admitted with hypertensive crisis. Blood pressure reached 180/110 mmHg. Confirmed patient history of chronic renal stress. Prescribed Lisinopril 20mg.",
        similarity: 0.92,
        medOverlap: ["Lisinopril 20mg"]
      },
      {
        id: "CH-8803",
        source: "Outpatient Clinic Log (Sep 2025)",
        text: "Metformin dosage adjusted to 1000mg twice daily due to rising HbA1c (8.2%). Diabetic peripheral neuropathy monitoring advised.",
        similarity: 0.85,
        medOverlap: ["Metformin 1000mg"]
      }
    ],
    aiSummary: {
      summary: "High similarity match with Jan 2026 hypertensive crisis. Recent scan includes Metformin and Ibuprofen (NSAID) which introduces critical drug interaction risk in a patient with stage 2 kidney disease.",
      patterns: ["Recurrent blood pressure spikes on admission", "Renal filtration stress under NSAID use"],
      alerts: ["DRUG INTERACTION: Metformin + Ibuprofen in renal compromise", "CARDIOVASCULAR RISK: History of left ventricular hypertrophy"]
    }
  },
  {
    id: "T2",
    name: "Template: Asthma Rx",
    fileName: "rx_asthma_chen.pdf",
    ocrText: "Rx: Propranolol 40mg daily. Albuterol HFA 2 puffs q4h prn. Fluticasone/Salmeterol 250/50 mcg twice daily.",
    extractedFields: {
      medications: [
        { name: "Propranolol", dosage: "40mg daily" },
        { name: "Albuterol HFA", dosage: "2 puffs q4h prn" },
        { name: "Fluticasone/Salmeterol", dosage: "250/50 mcg twice daily" }
      ],
      diagnosis: "Severe Persistent Asthma & Allergic Rhinitis",
      doctorNotes: "Check spirometry parameters. Monitor inhaler technique.",
      allergies: ["Aspirin"]
    },
    embeddingMetrics: {
      latency: "38ms",
      chunkCount: 2,
      vectorDims: 1536
    },
    retrievedChunks: [
      {
        id: "CH-7742",
        source: "Intensive Care Records (Aug 2024)",
        text: "Patient admitted for status asthmaticus. Required mechanical ventilation for 24 hours. Sensitivities to non-selective beta-blockers noted.",
        similarity: 0.95,
        medOverlap: ["Albuterol", "Beta-blockers"]
      }
    ],
    aiSummary: {
      summary: "95% similarity match with Riverside ICU ventilation incident. Current scan contains Propranolol (non-selective beta-blocker), which is strictly contraindicated due to bronchial spasm risk.",
      patterns: ["Severe bronchospasm episodes", "Prior mechanical ventilation history"],
      alerts: ["CONTRAINDICATION: Propranolol prescribed to severe asthmatic patient"]
    }
  }
];

interface SimilarityRecord {
  id: string;
  patientId: string;
  matchType: string;
  score: number;
  source: string;
  timestamp: string;
  confidence: number;
}

const mockSearchRecords: SimilarityRecord[] = [
  { id: "REC-4409", patientId: "PT-9042", matchType: "Hypertension History", score: 92, source: "Central Hospital EMR", timestamp: "Just now", confidence: 96 },
  { id: "REC-4408", patientId: "PT-7719", matchType: "ICU Intubation History", score: 95, source: "Riverside ICU", timestamp: "3m ago", confidence: 98 },
  { id: "REC-4407", patientId: "PT-5521", matchType: "Nephropathy eGFR Decline", score: 91, source: "State Renal Institute", timestamp: "7m ago", confidence: 93 },
  { id: "REC-4406", patientId: "PT-9042", matchType: "Diabetes Outpatient Log", score: 85, source: "Metropolitan Clinic", timestamp: "12m ago", confidence: 94 }
];

export default function RAGHistoryPage() {
  const [activeTemplateId, setActiveTemplateId] = useState<string>("T1");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [pipelineStep, setPipelineStep] = useState<string>("Ready");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tableRecords, setTableRecords] = useState<SimilarityRecord[]>(mockSearchRecords);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("REC-4409");

  const activeTemplate = ragTemplates.find((t) => t.id === activeTemplateId) || ragTemplates[0];

  const handleTriggerPipeline = () => {
    setIsProcessing(true);
    setPipelineProgress(0);
    setPipelineStep("Parsing Prescription OCR Stream...");

    const steps = [
      { progress: 25, label: "Sentence Segmentation & Chunking..." },
      { progress: 55, label: "Generating Vector Embeddings via MedAda-002..." },
      { progress: 75, label: "Querying MongoDB Atlas Vector Database..." },
      { progress: 90, label: "Synthesizing Semantic Triage Match Context..." },
      { progress: 100, label: "Ready" }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPipelineProgress(step.progress);
        setPipelineStep(step.label);
        if (step.progress === 100) {
          setIsProcessing(false);

          // Add a dummy entry to the similarity search table to simulate live indexing
          const newRecordId = `REC-${Math.floor(Math.random() * 1000) + 4000}`;
          const newRec: SimilarityRecord = {
            id: newRecordId,
            patientId: activeTemplate.id === "T1" ? "PT-9042" : "PT-7719",
            matchType: activeTemplate.id === "T1" ? "Hypertension History" : "ICU Intubation History",
            score: activeTemplate.id === "T1" ? 92 : 95,
            source: activeTemplate.id === "T1" ? "Central Hospital EMR" : "Riverside ICU",
            timestamp: "Just now",
            confidence: activeTemplate.id === "T1" ? 96 : 98
          };
          setTableRecords((prev) => [newRec, ...prev.slice(0, 5)]);
          setSelectedRecordId(newRecordId);
        }
      }, (index + 1) * 700);
    });
  };

  const filteredRecords = tableRecords.filter((rec) => {
    return (
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.matchType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.source.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Retrieval Engine Operational · Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Vector Sync Completed
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>RAG History & Retrieval</h1>
          <p className="text-sm text-slate-500">
            Historical medical retrieval, OCR processing, and AI-powered contextual analysis.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
            {ragTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTemplateId(t.id);
                  setPipelineProgress(100);
                  setPipelineStep("Ready");
                  setIsProcessing(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTemplateId === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerPipeline}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer animate-none"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
            Run RAG Pipeline
          </button>
        </div>
      </div>

      {/* 2. RAG Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Embedded Records", value: "148,294", change: "+1,245 EMR nodes", icon: Database, color: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "OCR Documents Processed", value: "12,834", change: "Prescription PDF scan", icon: FileText, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
          { label: "Retrieval Requests Today", value: "4,212", change: "API inference triggers", icon: ScanSearch, color: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "Average Similarity Score", value: "91.8%", change: "stable threshold metric", icon: TrendingUp, color: "bg-amber-50 text-amber-600 border border-amber-100" },
          { label: "Active Vector Searches", value: "14", change: "Live query index", icon: Activity, color: "bg-teal-50 text-teal-600 border border-teal-100" },
          { label: "AI Context Matches", value: "4,192", change: "99.4% precision index", icon: Sparkles, color: "bg-indigo-50 text-indigo-600 border border-indigo-100" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4.5 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-slate-500 font-semibold leading-tight">{stat.label}</span>
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold mt-1" style={{ fontSize: "24px", lineHeight: "1" }}>
                {stat.value}
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Processing State Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/90 border border-slate-200/60 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center min-h-[250px] shadow-sm"
          >
            <div className="relative flex items-center justify-center">
              <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
              <ScanSearch className="w-5 h-5 text-blue-600 absolute animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <p className="text-sm font-semibold text-slate-900">Processing RAG Pipeline Matcher</p>
              <p className="text-xs text-slate-500 font-mono">{pipelineStep}</p>
            </div>
            <div className="w-64 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
              <motion.div
                className="bg-blue-600 h-full shadow-sm"
                initial={{ width: "0%" }}
                animate={{ width: `${pipelineProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {/* 3. Prescription Upload & OCR Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <span className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2 block">
                  Drag & Drop Prescription Ingest
                </span>

                <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-slate-100/50 transition">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-slate-800">{activeTemplate.fileName}</span>
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
            </div>

            {/* Center & Right Column combined layout */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* 5. Retrieval Context Panel & AI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 5. Retrieval Context Chunks Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-900">Semantic History Matches</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Atlas Query matches</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {activeTemplate.retrievedChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-200/50 pb-1.5">
                          <span className="text-slate-500 font-semibold">{chunk.source}</span>
                          <span className="text-blue-600 font-bold">Score: {(chunk.similarity * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-650 font-medium">
                          "{chunk.text}"
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-450 mt-1 border-t border-slate-100/50 pt-2">
                          <span className="block shrink-0">Overlap:</span>
                          <div className="flex flex-wrap gap-1">
                            {chunk.medOverlap.map((med, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 rounded">{med}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. AI Context Summary Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-900">AI Context Analysis</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Model synthesis</span>
                  </div>

                  <div className="bg-blue-50/20 border border-blue-100/50 rounded-xl p-3.5 text-xs text-slate-700 flex flex-col gap-3">
                    <div>
                      <span className="text-blue-700 font-bold block mb-1">Synthesized Summary</span>
                      <p className="leading-relaxed font-semibold">
                        {activeTemplate.aiSummary.summary}
                      </p>
                    </div>

                    <div className="border-t border-blue-100 pt-2.5">
                      <span className="text-blue-700 font-bold block mb-1">Historical Patterns</span>
                      <ul className="flex flex-col gap-1.5 pl-1.5">
                        {activeTemplate.aiSummary.patterns.map((pat, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-650 leading-relaxed font-medium">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <span>{pat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {activeTemplate.aiSummary.alerts.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5">Triage Alerts</span>
                      {activeTemplate.aiSummary.alerts.map((al, idx) => (
                        <div key={idx} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-xs text-rose-800 font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{al}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Similarity Search Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="p-5 flex flex-col gap-3.5 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">Inference History & Similarity Records</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 relative min-w-[200px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Record ID, Patient ID, Source..."
                        className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/50 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/50">
                        {["Record ID", "Patient ID", "Match Type", "Similarity Score", "Retrieval Source", "Timestamp", "AI Conf."].map((h) => (
                          <th key={h} className="py-2.5 px-5 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredRecords.map((rec) => (
                        <tr
                          key={rec.id}
                          onClick={() => setSelectedRecordId(rec.id)}
                          className={`hover:bg-slate-50/40 transition cursor-pointer text-xs ${
                            selectedRecordId === rec.id ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-5 font-mono text-slate-650 font-semibold">{rec.id}</td>
                          <td className="py-3 px-5 font-mono text-slate-700 font-medium">{rec.patientId}</td>
                          <td className="py-3 px-5 text-slate-800 font-semibold">{rec.matchType}</td>
                          <td className="py-3 px-5">
                            <span className="inline-flex px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold border border-blue-100">
                              {rec.score}% match
                            </span>
                          </td>
                          <td className="py-3 px-5 text-slate-550">{rec.source}</td>
                          <td className="py-3 px-5 text-slate-450">{rec.timestamp}</td>
                          <td className="py-3 px-5 font-mono text-slate-700">{rec.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 flex items-center justify-between text-xs text-slate-450 border-t border-slate-50 bg-slate-50/10">
                  <span>Showing {filteredRecords.length} of {tableRecords.length} records</span>
                  <div className="flex gap-2">
                    <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-650 cursor-not-allowed">Prev</button>
                    <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-650 cursor-not-allowed">Next</button>
                  </div>
                </div>
              </div>

              {/* 8. Retrieval Timeline stepper */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <span className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2 block">
                  Retrieval Execution Steps
                </span>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 px-2 text-xs">
                  {[
                    { step: "Prescription Uploaded", status: "completed", time: "10:14 AM" },
                    { step: "OCR Parsing complete", status: "completed", time: "10:15 AM" },
                    { step: "Embedding generation complete", status: "completed", time: "10:15 AM" },
                    { step: "Atlas Vector Search initiated", status: "completed", time: "10:15 AM" },
                    { step: "Context matching complete", status: "completed", time: "10:15 AM" }
                  ].map((t, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-2.5 relative flex-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{t.step}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 ml-7">{t.time}</span>
                        </div>
                      </div>
                      {idx < 4 && (
                        <div className="hidden md:block w-6 h-px bg-slate-100 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
