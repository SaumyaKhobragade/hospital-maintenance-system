"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Send,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  Mail,
  User,
  ClipboardList,
  FileSearch,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { pythonApi, CombinedReportResponse } from "@/lib/pythonApi";


export default function CombinedReportPage() {
  const [patientId, setPatientId] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CombinedReportResponse | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  // Real patients from DB
  const [dbPatients, setDbPatients] = useState<{ id: string; name: string }[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/db/patients")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setDbPatients(
            data.map((p) => ({ id: p.id, name: p.name || "Unknown" }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected).filter(
      (f) => !files.some((existing) => existing.name === f.name)
    );
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!patientId.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await pythonApi.generateCombinedReport(
        patientId.trim(),
        files,
        patientEmail.trim() || undefined,
        additionalContext.trim() || undefined
      );
      setResult(response);
      setShowFullReport(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([result.combined_report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combined-report-${patientId}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Multi-Disciplinary AI Report Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Powered by Groq LLaMA 3.3
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            Combined Medical Report Generator
          </h1>
          <p className="text-sm text-slate-500">
            Upload pathology, radiology, and lab reports to generate a unified AI-synthesized clinical summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Controls */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Patient Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Patient Selection</span>
            </div>

            {/* Searchable patient picker */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Search Patient
              </label>
              <div className="relative">
                <input
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                  placeholder={dbPatients.length ? `Search among ${dbPatients.length} patients…` : "Loading patients…"}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
                />
                {showPatientDropdown && dbPatients.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {dbPatients
                      .filter((p) =>
                        patientSearch === "" ||
                        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                        p.id.toLowerCase().includes(patientSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((p) => (
                        <button
                          key={p.id}
                          onMouseDown={() => {
                            setPatientId(p.id);
                            setPatientSearch(p.name);
                            setShowPatientDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition flex items-center justify-between gap-2 ${
                            patientId === p.id ? "bg-blue-50 text-blue-700" : "text-slate-700"
                          }`}
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <span className="font-mono text-slate-400 shrink-0">{p.id.substring(0, 8)}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {patientId && (
                <p className="text-[10px] text-emerald-600 font-mono">Selected: {patientId}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Or enter Patient ID manually
              </label>
              <input
                value={patientId}
                onChange={(e) => { setPatientId(e.target.value); setPatientSearch(""); }}
                placeholder="e.g. PT-1234 or UUID"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Email & Context */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <Mail className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Dispatch Options</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Patient Email (optional)
              </label>
              <input
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@testmail.app"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
              />
              <p className="text-[10px] text-slate-400">
                If provided, the synthesized report will be emailed after generation.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Additional Clinical Context
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Optional: Add notes for the AI to consider (e.g. recent symptoms, medications)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800 resize-none min-h-[80px]"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <UploadCloud className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-900">Upload Test Reports</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition ${
                isDragging
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
              }`}
            >
              <UploadCloud className={`w-8 h-8 ${isDragging ? "text-blue-500" : "text-slate-400"}`} />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-slate-700">
                  {isDragging ? "Drop files here" : "Drag & drop or click to upload"}
                </span>
                <span className="text-slate-400">PDF, TXT, images · Pathology, Radiology, Lab reports</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{file.name}</span>
                      <span className="text-slate-400 shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-slate-400 hover:text-rose-600 transition shrink-0 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || !patientId.trim()}
              id="generate-combined-report-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synthesizing report…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Combined Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Report Output */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-violet-600 absolute animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900">
                    AI is synthesizing your combined report
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Ingesting files → Embedding → LLM synthesis → Formatting…
                  </p>
                </div>
                <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full animate-pulse w-3/4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-rose-800">Generation Failed</span>
                <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !result && !error && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[400px]">
              <FileSearch className="w-10 h-10 text-slate-300" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">No report generated yet</span>
                <span className="text-sm text-slate-400 max-w-xs">
                  Select a patient, upload their test reports on the left, then click Generate.
                </span>
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-400 mt-2">
                {[
                  "Accepts pathology, radiology, and lab reports",
                  "Synthesizes all documents into a unified clinical summary",
                  "Optionally dispatches via email",
                ].map((hint, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Status Banner */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">
                        Report generated for {result.patient_id}
                      </span>
                      <span className={`text-xs font-mono font-bold ${
                        result.status === "DISPATCHED"
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}>
                        Status: {result.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadReport}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Dispatch Receipt */}
                {result.dispatch_receipt && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-xs">
                    <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-emerald-800">Email Dispatched</span>
                      <span className="text-emerald-700 font-mono break-all">{result.dispatch_receipt}</span>
                    </div>
                  </div>
                )}

                {/* Report Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="p-5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-slate-900">
                        Combined Clinical Report
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {result.patient_id}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFullReport((v) => !v)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                    >
                      {showFullReport ? (
                        <><ChevronUp className="w-4 h-4" /> Collapse</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Expand</>
                      )}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {showFullReport && (
                      <motion.div
                        key="report-body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[600px] overflow-y-auto">
                            <pre
                              className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans"
                              style={{ fontFamily: "inherit" }}
                            >
                              {result.combined_report}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Generate Another */}
                <button
                  onClick={() => {
                    setResult(null);
                    setFiles([]);
                    setAdditionalContext("");
                    setPatientEmail("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition self-center underline underline-offset-2"
                >
                  Generate another report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
