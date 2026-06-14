"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, FileText, X, Loader2, CheckCircle2, AlertTriangle,
  Pill, User, Calendar, Stethoscope, Database, ChevronDown,
  ClipboardList, Info, Sparkles,
} from "lucide-react";
import { pythonApi, PrescriptionResponse } from "@/lib/pythonApi";

const PATIENT_PRESETS = [
  { id: "PT-9042", name: "Sarah Jenkins", email: "sarah.jenkins@testmail.app" },
  { id: "PT-7719", name: "Robert Chen", email: "robert.chen@testmail.app" },
  { id: "PT-5521", name: "Elena Rostova", email: "elena.rostova@testmail.app" },
];

type UploadState = "idle" | "uploading" | "done" | "error";

export default function PrescriptionReaderPage() {
  const [selectedPatient, setSelectedPatient] = useState(PATIENT_PRESETS[0]);
  const [allPatients, setAllPatients] = useState<any[]>(PATIENT_PRESETS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionResponse | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  // Load patients from MongoDB
  useEffect(() => {
    (async () => {
      try {
        const res = await pythonApi.listPatients();
        if (res.patients?.length) {
          const mongo = res.patients.map((p) => ({
            id: p.id,
            name: p.name || "Unknown",
            email: p.email || `${(p.name || "patient").toLowerCase().replace(/\s+/g, ".")}@testmail.app`,
          }));
          const merged = [...PATIENT_PRESETS];
          mongo.forEach((mp) => { if (!merged.some((e) => e.id === mp.id)) merged.push(mp); });
          setAllPatients(merged);
        }
      } catch { /* silently fall back to presets */ }
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPatients = allPatients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".pdf", ".webp"];

  const validateAndSet = (file: File | null) => {
    if (!file) return;
    const ext = "." + file.name.split(".").pop()!.toLowerCase();
    if (!ALLOWED_EXT.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Unsupported file. Please upload a JPEG, PNG, PDF, or WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File is too large. Maximum size is 10 MB.");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setResult(null);
    setUploadState("idle");
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0] ?? null);
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setUploadState("idle");
    setErrorMsg(null);
    setShowRawOcr(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setUploadState("uploading");
    setErrorMsg(null);
    try {
      const res = await pythonApi.uploadPrescription(selectedPatient.id, selectedFile);
      setResult(res);
      setUploadState("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Prescription reading failed.");
      setUploadState("error");
    }
  };

  const SEVERITY_COLOR: Record<string, string> = {
    "0": "bg-blue-50 border-blue-100 text-blue-700",
    "1": "bg-emerald-50 border-emerald-100 text-emerald-700",
    "2": "bg-violet-50 border-violet-100 text-violet-700",
    "3": "bg-amber-50 border-amber-100 text-amber-700",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Sarvam AI · Document OCR
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              ChromaDB · Auto-Indexed
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            Prescription Reader
          </h1>
          <p className="text-sm text-slate-500">
            Upload a doctor's handwritten or printed prescription. Sarvam AI digitizes it and extracts structured medication data.
          </p>
        </div>

        {/* Patient selector */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <span className="text-xs text-slate-400 font-semibold block mb-1">Select Patient:</span>
          <button
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition min-w-[220px] text-left cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate flex-1">{selectedPatient.name} ({selectedPatient.id.length > 8 ? `${selectedPatient.id.slice(0, 8)}…` : selectedPatient.id})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-2.5 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs outline-none focus:border-blue-400 transition"
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setIsDropdownOpen(false); setPatientSearch(""); reset(); }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex flex-col gap-0.5 cursor-pointer ${selectedPatient.id === p.id ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="font-mono text-[9px] text-slate-400">{p.id}</span>
                  </button>
                ))}
                {filteredPatients.length === 0 && <div className="text-center py-3 text-xs text-slate-400">No patients found</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Patient", value: selectedPatient.id, icon: User, color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "OCR Engine", value: "Sarvam AI", icon: Sparkles, color: "bg-violet-50 text-violet-600 border-violet-100" },
          { label: "Accepted Formats", value: "JPG · PNG · PDF", icon: FileText, color: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: "Storage", value: "ChromaDB · RAG", icon: Database, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold" style={{ fontSize: "16px" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Upload */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Prescription</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">SARVAM-OCR</span>
            </div>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              className="hidden"
              onChange={(e) => { validateAndSet(e.target.files?.[0] ?? null); e.target.value = ""; }}
            />

            {/* Drop zone */}
            <div
              onClick={() => { if (uploadState !== "uploading") fileInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all min-h-[180px] ${
                isDragOver ? "border-violet-400 bg-violet-50/60"
                : selectedFile ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/30"
              }`}
            >
              {selectedFile ? (
                <>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg object-contain shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-violet-600" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">{isDragOver ? "Drop it here!" : "Drag & drop or click to browse"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">JPEG · PNG · PDF · Max 10 MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Submit */}
            {uploadState === "uploading" ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sarvam AI digitizing…
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || uploadState === "done"}
                id="read-prescription-btn"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-sm"
              >
                <Pill className="w-4 h-4" />
                {uploadState === "done" ? "Digitized ✓" : "Read Prescription"}
              </button>
            )}

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Sarvam AI reads the prescription text. The result is stored in ChromaDB and appears in AI Clinical Summary & Combined Reports.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Error</p>
                <p className="text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 text-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 block">Patient Details</span>
            {[
              { label: "Patient ID", value: selectedPatient.id },
              { label: "Name", value: selectedPatient.name },
              { label: "OCR Engine", value: "Sarvam Document Digitization" },
              { label: "Extraction LLM", value: "Groq LLaMA-3.3-70b" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-semibold text-slate-700 font-mono text-right truncate max-w-[160px]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Processing */}
          <AnimatePresence>
            {uploadState === "uploading" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200/60 rounded-2xl p-10 flex flex-col items-center gap-4 text-center shadow-sm"
              >
                <div className="relative">
                  <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
                  <Stethoscope className="w-5 h-5 text-violet-600 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Reading Prescription</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">Sarvam OCR → LLM extraction → ChromaDB indexing…</p>
                </div>
                <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full animate-pulse w-2/3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {uploadState === "idle" && !result && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[360px]">
              <ClipboardList className="w-10 h-10 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-700">No prescription uploaded yet</p>
                <p className="text-sm text-slate-400 max-w-xs mt-1">Upload a prescription image or PDF to extract structured medication data using Sarvam AI.</p>
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-400 mt-2">
                {[
                  "Supports handwritten & printed prescriptions",
                  "Extracts medications, dosages & instructions",
                  "Multilingual — Hindi, English, regional scripts",
                  "Auto-saved to patient's RAG history in ChromaDB",
                ].map((hint, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && uploadState === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Success badge */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Prescription digitized successfully</p>
                      <p className="text-xs text-slate-400 font-mono">{result.filename} · {result.chunks_stored} chunk{result.chunks_stored !== 1 ? "s" : ""} saved to ChromaDB</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">DIGITIZED</span>
                </div>

                {/* Doctor & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Prescribing Doctor</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{result.prescribing_doctor}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Prescription Date</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{result.prescription_date}</p>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                {result.medications.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Pill className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-slate-900">Medications</span>
                      <span className="ml-auto text-xs font-mono text-slate-400">{result.medications.length} prescribed</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {result.medications.map((med, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`rounded-xl border p-3.5 flex flex-col gap-1 ${SEVERITY_COLOR[String(i % 4)]}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold">{med.name}</p>
                            <span className="text-[10px] font-mono font-bold opacity-60 shrink-0">Rx {i + 1}</span>
                          </div>
                          {med.dosage && <p className="text-xs"><span className="font-semibold">Dosage:</span> {med.dosage}</p>}
                          {med.frequency && <p className="text-xs"><span className="font-semibold">Frequency:</span> {med.frequency}</p>}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {result.instructions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-slate-900">Doctor's Instructions</span>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {result.instructions.map((ins, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raw OCR collapsible */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                  <button
                    onClick={() => setShowRawOcr((v) => !v)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">Raw OCR Text</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${showRawOcr ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showRawOcr && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[200px] overflow-y-auto">
                          <pre className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                            {result.raw_ocr_text || "No OCR text returned."}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition"
                  >
                    Upload Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
