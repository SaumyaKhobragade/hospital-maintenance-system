"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Languages,
  Volume2,
  Play,
  Pause,
  Clock,
  Activity,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User,
  Headphones,
  Sparkles,
  Award,
  Send,
  WifiOff,
  Stethoscope,
} from "lucide-react";
import { pythonApi, ScribeDraftResponse } from "@/lib/pythonApi";

const PATIENT_PRESETS = [
  { id: "PT-9042", name: "Sarah Jenkins", email: "sarah.jenkins@testmail.app" },
  { id: "PT-7719", name: "Robert Chen", email: "robert.chen@testmail.app" },
  { id: "PT-5521", name: "Elena Rostova", email: "elena.rostova@testmail.app" },
];

type RecordingState = "idle" | "recording" | "processing" | "done" | "error";

export default function VoiceCheckInKioskPage() {
  const [selectedPreset, setSelectedPreset] = useState(PATIENT_PRESETS[0]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(10));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScribeDraftResponse | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalResult, setApprovalResult] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Waveform animation
  useEffect(() => {
    if (recordingState !== "recording") {
      setWaveformBars(Array(24).fill(10));
      return;
    }
    const interval = setInterval(() => {
      setWaveformBars(Array.from({ length: 24 }, () => Math.floor(Math.random() * 45) + 8));
    }, 120);
    return () => clearInterval(interval);
  }, [recordingState]);

  // Timer
  useEffect(() => {
    if (recordingState !== "recording") {
      setTimerSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndProcess(blob);
      };

      recorder.start(250);
      setRecordingState("recording");
      setErrorMsg(null);
      setDraft(null);
      setApprovalResult(null);
    } catch (err) {
      setErrorMsg("Microphone access denied. Please allow microphone permissions and try again.");
      setRecordingState("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("processing");
    }
  };

  const uploadAndProcess = async (blob: Blob) => {
    try {
      const ext = blob.type.includes("webm") ? "webm" : "wav";
      const result = await pythonApi.uploadScribeAudio(
        selectedPreset.id,
        selectedPreset.email,
        blob,
        `recording.${ext}`
      );
      setDraft(result);
      setRecordingState("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Scribe pipeline failed.");
      setRecordingState("error");
    }
  };

  const handleApprove = async () => {
    if (!draft) return;
    setIsApproving(true);
    try {
      const res = await pythonApi.approveScribe(draft.thread_id);
      setApprovalResult(res.message);
    } catch (err: unknown) {
      setApprovalResult("Approval failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsApproving(false);
    }
  };

  const reset = () => {
    setRecordingState("idle");
    setDraft(null);
    setErrorMsg(null);
    setApprovalResult(null);
    setTimerSeconds(0);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sarvam STT · Ambient Clinical Scribe
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              LangGraph Workflow
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            Voice Check-In & Clinical Scribe
          </h1>
          <p className="text-sm text-slate-500">
            Record doctor-patient conversations. The AI transcribes, structures as a SOAP note, and drafts a patient report.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold sm:text-right">Select Patient:</span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
            {PATIENT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPreset(p); reset(); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedPreset.id === p.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Patient", value: selectedPreset.id, icon: User, iconBg: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "Scribe Model", value: "Sarvam v3", icon: Languages, iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
          { label: "Recording Status", value: recordingState.charAt(0).toUpperCase() + recordingState.slice(1), icon: Activity, iconBg: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "Pipeline", value: "LangGraph", icon: Award, iconBg: "bg-amber-50 text-amber-600 border border-amber-100" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold" style={{ fontSize: "18px", lineHeight: "1" }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Recording Controls */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* Mic Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between w-full border-b border-slate-50 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice Capture Terminal</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
                SARVAM-STT
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 py-4">
              {/* Mic Button */}
              {recordingState === "idle" || recordingState === "error" ? (
                <button
                  onClick={startRecording}
                  id="start-recording-btn"
                  className="relative h-20 w-20 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 hover:scale-[1.03] cursor-pointer flex items-center justify-center transition-all"
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : recordingState === "recording" ? (
                <button
                  onClick={stopRecording}
                  id="stop-recording-btn"
                  className="relative h-20 w-20 rounded-full bg-red-500 text-white shadow-lg shadow-red-200 scale-95 flex items-center justify-center transition-all cursor-pointer"
                >
                  <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
                  <MicOff className="w-8 h-8" />
                </button>
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">
                  {recordingState === "idle" && "Click microphone to start recording"}
                  {recordingState === "recording" && "Recording… Click to stop"}
                  {recordingState === "processing" && "AI pipeline processing…"}
                  {recordingState === "done" && "Transcription complete ✓"}
                  {recordingState === "error" && "Error — see details below"}
                </span>
                <span className="text-xs text-slate-400">
                  {recordingState === "recording"
                    ? `Recording: ${formatTimer(timerSeconds)}`
                    : "Supports any spoken language · WAV/WebM upload"}
                </span>
              </div>
            </div>

            {/* Waveform */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Waveform</span>
                <span className={recordingState === "recording" ? "text-red-500 font-bold" : "text-slate-400"}>
                  {recordingState === "recording" ? "ACTIVE FEED" : "MUTED"}
                </span>
              </div>
              <div className="h-14 flex items-center justify-center gap-1">
                {waveformBars.map((h, i) => (
                  <motion.div
                    key={i}
                    className={`w-1.5 rounded-full ${recordingState === "recording" ? "bg-red-500/80" : "bg-slate-300"}`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-xs text-slate-400 border-t border-slate-50 pt-3">
              <span>Patient:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {selectedPreset.name} ({selectedPreset.id})
              </span>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-2 text-xs">
              <WifiOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-rose-800">Error</span>
                <span className="text-rose-700">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Patient info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 text-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 block">
              Intake Details
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Patient ID</span>
                <span className="font-mono font-semibold text-slate-700">{selectedPreset.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email</span>
                <span className="font-mono text-slate-600 truncate max-w-[160px]">{selectedPreset.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">STT Engine</span>
                <span className="font-semibold text-slate-700">Sarvam saaras:v3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Report Engine</span>
                <span className="font-semibold text-slate-700">Groq LLaMA-3.3-70b</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Scribe Results */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Processing state */}
          <AnimatePresence>
            {recordingState === "processing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white/90 border border-slate-200/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center shadow-sm"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                  <Stethoscope className="w-5 h-5 text-blue-600 absolute animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900">Running Clinical Scribe Pipeline</p>
                  <p className="text-xs text-slate-500 font-mono">
                    Upload → Sarvam STT → SOAP structuring → Patient report draft…
                  </p>
                </div>
                <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {(recordingState === "idle" || recordingState === "error") && !draft && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[350px]">
              <Headphones className="w-10 h-10 text-slate-300" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">No recording yet</span>
                <span className="text-sm text-slate-400 max-w-xs">
                  Click the microphone to start recording a doctor-patient conversation. The AI will transcribe, structure, and draft a report.
                </span>
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-400 mt-2">
                {[
                  "Sarvam STT handles Hinglish, Hindi, English & more",
                  "Generates structured SOAP note automatically",
                  "Doctor approval dispatches the report by email",
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
            {draft && recordingState === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Thread status */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">
                        Scribe session ready for review
                      </span>
                      <span className="text-xs font-mono text-slate-400">{draft.thread_id}</span>
                    </div>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                    PENDING APPROVAL
                  </span>
                </div>

                {/* Transcript */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-slate-900">Raw Transcript</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[150px] overflow-y-auto">
                    <p className="text-xs leading-relaxed text-slate-700 italic font-medium">
                      {draft.raw_transcript || "No transcript returned (Sarvam may have used mock fallback)."}
                    </p>
                  </div>
                </div>

                {/* SOAP Note */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-slate-900">Structured SOAP Note</span>
                  </div>
                  <div className="bg-violet-50/20 border border-violet-100/50 rounded-xl p-3 max-h-[200px] overflow-y-auto">
                    <pre className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                      {draft.structured_soap_note || "SOAP note generation pending."}
                    </pre>
                  </div>
                </div>

                {/* Patient Report */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-slate-900">Patient Report Draft</span>
                  </div>
                  <div className="bg-blue-50/20 border border-blue-100/50 rounded-xl p-3 max-h-[200px] overflow-y-auto">
                    <pre className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                      {draft.patient_report_draft || "Patient report generation pending."}
                    </pre>
                  </div>
                </div>

                {/* Approval */}
                {approvalResult ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-emerald-800">Report Dispatched</span>
                      <span className="text-emerald-700">{approvalResult}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition"
                    >
                      Record Again
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      id="approve-scribe-btn"
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isApproving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
                      ) : (
                        <><Send className="w-4 h-4" /> Approve & Dispatch</>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
