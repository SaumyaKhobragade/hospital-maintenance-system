"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BrainCircuit,
  Sparkles,
  Activity,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User,
  Clock,
  Layers,
  Sparkle,
  WifiOff,
} from "lucide-react";
<<<<<<< HEAD
import { pythonApi, SummaryResponse, RiskResponse } from "@/lib/pythonApi";

const PATIENTS = [
  { id: "PT-9042", name: "Sarah Jenkins", age: 62, bloodGroup: "A+" },
  { id: "PT-7719", name: "Robert Chen", age: 45, bloodGroup: "O-" },
  { id: "PT-5521", name: "Elena Rostova", age: 58, bloodGroup: "B-" },
];

export default function AIClinicalSummaryPage() {
  const [selectedPatientId, setSelectedPatientId] = useState("PT-9042");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState("Ready");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [risks, setRisks] = useState<RiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePatient = PATIENTS.find((p) => p.id === selectedPatientId) || PATIENTS[0];
=======
import { supabase } from "../../../lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  patientId: string;
  age: number;
  bloodGroup: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  symptoms: string[];
  allergies: string[];
  conditions: string[];
  confidence: number;
  summary: string;
  ocr: {
    imageName: string;
    extractedMedications: { name: string; dosage: string; confidence: number; status: string }[];
    ocrConfidence: number;
    status: string;
  };
  rag: {
    chunks: { text: string; similarity: number; source: string }[];
    vectorConfidence: number;
    insights: string[];
  };
  alerts: { type: "critical" | "warning" | "info"; msg: string; dept: string; priority: string }[];
  timeline: { step: string; status: "completed" | "processing" | "pending"; time: string }[];
}

export default function AIClinicalSummaryPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState("Ready");
  const [ocrBoundingBoxActive, setOcrBoundingBoxActive] = useState<number | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase.from("patients").select("*");
      if (data) {
        const mapped = data.map((dbP: any) => ({
          id: dbP.id,
          name: dbP.name || "Unknown Patient",
          patientId: "PT-" + dbP.id.substring(0, 4),
          age: dbP.age || 0,
          bloodGroup: dbP.blood_group || "Unknown",
          riskLevel: dbP.base_severity > 7 ? "CRITICAL" : dbP.base_severity > 4 ? "HIGH" : "MEDIUM",
          symptoms: dbP.symptoms || [],
          allergies: dbP.allergies || [],
          conditions: dbP.conditions || [],
          confidence: dbP.ai_risk_score || 0,
          summary: dbP.ai_summary || "No summary available.",
          ocr: {
            imageName: "scanned_rx.pdf",
            extractedMedications: [],
            ocrConfidence: 0,
            status: "Pending"
          },
          rag: {
            chunks: [],
            vectorConfidence: 0,
            insights: []
          },
          alerts: dbP.alerts || [],
          timeline: dbP.timeline || []
        }));
        setPatients(mapped);
        if (mapped.length > 0) setSelectedPatientId(mapped[0].id);
      }
    };
    fetchPatients();
  }, []);

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00

  const runPipeline = async () => {
    setIsProcessing(true);
    setPipelineProgress(10);
    setError(null);
    setSummary(null);
    setRisks(null);

    try {
      setPipelineStep("Querying vector store for patient history…");
      setPipelineProgress(30);

      const [summaryData, riskData] = await Promise.all([
        pythonApi.getSummary(selectedPatientId),
        pythonApi.getRisks(selectedPatientId),
      ]);

      setPipelineStep("Evaluating drug interactions…");
      setPipelineProgress(75);
      await new Promise((r) => setTimeout(r, 400));

      setPipelineStep("Synthesizing AI clinical summary…");
      setPipelineProgress(95);
      await new Promise((r) => setTimeout(r, 300));

      setSummary(summaryData);
      setRisks(riskData);
      setPipelineProgress(100);
      setPipelineStep("Ready");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch clinical summary from backend."
      );
      setPipelineStep("Ready");
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-load on patient change
  useEffect(() => {
<<<<<<< HEAD
    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  const riskLevelColor = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === "critical" || s === "high") return "bg-rose-50 text-rose-700 border-rose-100";
    if (s === "medium" || s === "moderate") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  const overallRisk = risks?.risk_flags?.length
    ? risks.risk_flags[0]?.severity?.toUpperCase()
    : "UNKNOWN";
=======
    if (!activePatient || !activePatient.ocr || !activePatient.ocr.extractedMedications) return;
    const interval = setInterval(() => {
      setOcrBoundingBoxActive((prev) => {
        if (prev === null) return 0;
        if (prev >= activePatient.ocr.extractedMedications.length - 1) return null;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activePatient]);
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Engine Online · Groq LLaMA 3.3
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            AI Clinical Summary
          </h1>
          <p className="text-sm text-slate-500">
            Live AI-generated clinical summaries, drug interaction warnings, and risk assessments pulled from the Python backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
<<<<<<< HEAD
            {PATIENTS.map((p) => (
=======
            {patients.map((p) => (
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3 py-1 rounded-md text-sm transition ${
                  selectedPatientId === p.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p.name.split(" ")[0]} ({p.id})
              </button>
            ))}
          </div>

          <button
            onClick={runPipeline}
            disabled={isProcessing}
            id="run-pipeline-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Loader */}
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
              <BrainCircuit className="w-5 h-5 text-blue-600 absolute animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <p className="text-sm font-semibold text-slate-900">Executing Medical AI Pipeline</p>
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

      {/* Error State */}
      {error && !isProcessing && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex gap-3">
          <WifiOff className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-rose-800">Backend Unreachable</span>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            <p className="text-[11px] text-rose-500 mt-1">
              Make sure the Python backend is running on <code className="bg-rose-100 px-1 rounded">http://localhost:8003</code>. 
              You can seed patient data via <code className="bg-rose-100 px-1 rounded">POST /api/patients/{"{id}"}/history</code>.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
<<<<<<< HEAD
        {!isProcessing && (summary || error) && (
=======
        {!isProcessing && activePatient && (
>>>>>>> 94bac8fe2e71ae26466f436c985f54f920c0cf00
          <motion.div
            key={selectedPatientId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* Left Column */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {/* Patient Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-slate-900" style={{ fontWeight: 600 }}>
                        {activePatient.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{activePatient.id}</p>
                    </div>
                  </div>
                  {risks && (
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${riskLevelColor(overallRisk)}`}
                    >
                      {overallRisk} RISK
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Age</span>
                    <span className="font-semibold text-slate-800">{activePatient.age} yrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Blood Group</span>
                    <span className="font-semibold text-blue-600">{activePatient.bloodGroup}</span>
                  </div>
                </div>

                {summary && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Chronic Conditions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.chronic_conditions.map((c, i) => (
                          <span key={i} className="text-xs bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Allergies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.allergies.map((a, i) => (
                          <span key={i} className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-lg border border-rose-100">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Current Medications
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.current_medications.map((m, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {risks && (
                  <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Safe to Prescribe
                      </span>
                      <span className={`font-bold ${risks.safe_to_prescribe ? "text-emerald-600" : "text-rose-600"}`}>
                        {risks.safe_to_prescribe ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Flags */}
              {risks && risks.risk_flags.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                    Alerts & Risk Flags
                  </span>
                  {risks.risk_flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-4 border flex gap-3.5 ${riskLevelColor(flag.severity)}`}
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {flag.severity} · {flag.risk_type}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">{flag.description}</p>
                        {flag.implicated_items.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {flag.implicated_items.map((item, j) => (
                              <span key={j} className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded border border-current/20 font-mono">
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Center Column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Clinical Summary */}
              {summary && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-900 font-semibold" style={{ fontSize: "15px" }}>
                        AI Generated Clinical Summary
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Live from ChromaDB + Groq
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700 font-medium bg-blue-50/20 border border-blue-100/40 rounded-xl p-4">
                    {summary.clinical_summary}
                  </p>

                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      {risks?.summary_note ?? "Risk assessment pending"}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Engine: Groq LLaMA-3.3-70b
                    </span>
                  </div>
                </div>
              )}

              {/* Surgeries */}
              {summary && summary.past_surgeries.filter(s => s !== "None documented").length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Past Surgeries</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.past_surgeries.map((s, i) => (
                      <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-lg border border-violet-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Retrieved Snippets */}
              {summary && summary.retrieved_snippets.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <h3 className="text-slate-900" style={{ fontWeight: 600 }}>
                        RAG Retrieval Context
                      </h3>
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full font-semibold">
                      {summary.retrieved_snippets.length} chunks retrieved
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.retrieved_snippets.slice(0, 4).map((snippet, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 hover:border-slate-200 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold">Chunk #{i + 1}</span>
                          <span className="text-blue-600 font-bold">RAG</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 line-clamp-3 font-normal">
                          {snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No data state */}
              {!summary && !error && !isProcessing && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
                  <Layers className="w-8 h-8 text-slate-300" />
                  <span className="font-semibold text-slate-700">No patient data ingested yet</span>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Upload patient history via the RAG History page first, then run the pipeline here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
