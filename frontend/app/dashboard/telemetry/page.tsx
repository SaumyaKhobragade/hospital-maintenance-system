"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Server
} from "lucide-react";

interface TelemetryEvent {
  id: string;
  type: string;
  patientId: string;
  module: string;
  latency: number;
  confidence: number;
  status: "Success" | "Warning" | "Failed";
  timestamp: string;
  rawJson: object;
}

const seedEvents: TelemetryEvent[] = [
  {
    id: "EV-9912",
    type: "OCR Medication Scan",
    patientId: "PT-9042",
    module: "MedOCR-v3",
    latency: 184,
    confidence: 98,
    status: "Success",
    timestamp: "Just now",
    rawJson: {
      event_id: "EV-9912",
      event_type: "OCR_EXTRACTION",
      patient_id: "PT-9042",
      latency_ms: 184,
      confidence: 0.98,
      execution_metrics: { model_name: "MedOCR-v3", gpu_util_pct: 72, threads: 8 },
      payload_snapshot: { extracted: ["Lisinopril 20mg", "Metformin 1000mg"] },
      timestamp: "2026-06-13T19:33:45.012Z"
    }
  },
  {
    id: "EV-9911",
    type: "Voice Translation",
    patientId: "PT-7719",
    module: "Whisper-Hinglish",
    latency: 412,
    confidence: 96,
    status: "Success",
    timestamp: "2m ago",
    rawJson: {
      event_id: "EV-9911",
      event_type: "SPEECH_TRANSLATION",
      patient_id: "PT-7719",
      latency_ms: 412,
      confidence: 0.96,
      execution_metrics: { model_name: "Whisper-Hinglish-v2", language_pair: "hi-en" },
      payload_snapshot: { original: "chest pain ho raha hai", translated: "experiencing chest pain" },
      timestamp: "2026-06-13T19:31:45.000Z"
    }
  },
  {
    id: "EV-9910",
    type: "Summary Synthesis",
    patientId: "PT-5521",
    module: "MedLLM-v4",
    latency: 682,
    confidence: 94,
    status: "Success",
    timestamp: "5m ago",
    rawJson: {
      event_id: "EV-9910",
      event_type: "LLM_SUMMARY",
      patient_id: "PT-5521",
      latency_ms: 682,
      confidence: 0.94,
      execution_metrics: { model_name: "MedLLM-v4-Pro", tokens_out: 142 },
      payload_snapshot: { triage: "Urgent Referral", suggested_dept: "Nephrology" },
      timestamp: "2026-06-13T19:28:12.445Z"
    }
  },
  {
    id: "EV-9909",
    type: "Drug Interaction Check",
    patientId: "PT-9042",
    module: "InteractionChecker",
    latency: 124,
    confidence: 99,
    status: "Warning",
    timestamp: "8m ago",
    rawJson: {
      event_id: "EV-9909",
      event_type: "CONTRAINDICATION_ALERT",
      patient_id: "PT-9042",
      latency_ms: 124,
      confidence: 0.99,
      execution_metrics: { ruleset_version: "2026.4" },
      payload_snapshot: { flag: "Metformin + Ibuprofen", severity: "CRITICAL" },
      timestamp: "2026-06-13T19:25:01.120Z"
    }
  },
  {
    id: "EV-9908",
    type: "EMR RAG Search",
    patientId: "PT-7719",
    module: "VectorRetriever",
    latency: 95,
    confidence: 90,
    status: "Success",
    timestamp: "12m ago",
    rawJson: {
      event_id: "EV-9908",
      event_type: "VECTOR_SEARCH",
      patient_id: "PT-7719",
      latency_ms: 95,
      confidence: 0.90,
      execution_metrics: { db: "MongoDB-Atlas-Vector", similarity_metric: "cosine" },
      payload_snapshot: { search_query: "severe persistent asthma history", matches: 3 },
      timestamp: "2026-06-13T19:21:04.982Z"
    }
  },
  {
    id: "EV-9907",
    type: "OCR Threshold Scan",
    patientId: "PT-3312",
    module: "MedOCR-v3",
    latency: 198,
    confidence: 72,
    status: "Failed",
    timestamp: "20m ago",
    rawJson: {
      event_id: "EV-9907",
      event_type: "OCR_EXTRACTION_FAILURE",
      patient_id: "PT-3312",
      latency_ms: 198,
      confidence: 0.72,
      execution_metrics: { model_name: "MedOCR-v3", confidence_threshold: 0.85 },
      payload_snapshot: { error: "Confidence threshold failure (0.72 < 0.85)", fallback: "Manual Review Triggered" },
      timestamp: "2026-06-13T19:13:20.100Z"
    }
  }
];

export default function TelemetryAuditLogsPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>(seedEvents);
  const [selectedEventId, setSelectedEventId] = useState<string>("EV-9912");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleLiveRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate adding a new event at the beginning of the list
      const newEventId = `EV-${Math.floor(Math.random() * 1000) + 10000}`;
      const randomPatientId = `PT-${Math.floor(Math.random() * 8000) + 1000}`;
      const newEvent: TelemetryEvent = {
        id: newEventId,
        type: "EMR Triage Classification",
        patientId: randomPatientId,
        module: "MedLLM-v4",
        latency: Math.floor(Math.random() * 200) + 80,
        confidence: Math.floor(Math.random() * 15) + 84,
        status: Math.random() > 0.85 ? "Warning" : "Success",
        timestamp: "Just now",
        rawJson: {
          event_id: newEventId,
          event_type: "TRIAGE_ROUTING",
          patient_id: randomPatientId,
          latency_ms: Math.floor(Math.random() * 200) + 80,
          confidence: (Math.floor(Math.random() * 15) + 84) / 100,
          execution_metrics: { gpu: "NVIDIA-A10G", uptime_status: "Healthy" },
          payload_snapshot: { routing: "Emergency Cardiology Dept", estimated_queue_pos: 2 },
          timestamp: new Date().toISOString()
        }
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 8)]);
      setSelectedEventId(newEventId);
      setIsRefreshing(false);
    }, 1000);
  };

  // Filter Logic
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.module.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "All" || e.type.toLowerCase().includes(filterType.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || e.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational · 100% Health
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Observability Logging Enabled
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>AI Telemetry & Audit Logs</h1>
          <p className="text-sm text-slate-500">
            Real-time MongoDB telemetry tracking, inference execution auditing, and medical pipeline performance monitoring.
          </p>
        </div>

        {/* Audit Refresh Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Live Ingestion Feed
          </button>
        </div>
      </div>

      {/* 2. Telemetry Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total AI Requests Today", value: "48,312", change: "+12.4% vs yesterday", icon: Cpu, color: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "Average Latency Response", value: "248 ms", change: "-12ms optimization", icon: Clock, color: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "OCR Scan Accuracy", value: "99.2%", change: "stable threshold", icon: FileText, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
          { label: "Active Voice Channels", value: "12 / 12", change: "Speech-to-EMR", icon: Activity, color: "bg-amber-50 text-amber-600 border border-amber-100" },
          { label: "Active EMR RAG Threads", value: "84", change: "Atlas Vector Search", icon: Database, color: "bg-teal-50 text-teal-600 border border-teal-100" },
          { label: "Observability Latency", value: "0.2ms", change: "Telemetry overhead", icon: Server, color: "bg-slate-50 text-slate-600 border border-slate-200" }
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

      {/* Main observability panels split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Pipeline States, Activity stream */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* 5. AI Pipeline Monitoring Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-sm font-semibold text-slate-900">Pipeline Execution Health</span>
              <span className="text-[10px] text-slate-400 font-mono">Real-time status</span>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { name: "MedOCR Transcription Scan", health: 99.9, latency: "180ms", rate: "42/min", error: "0.1%" },
                { name: "Whisper Speech Translation", health: 99.7, latency: "320ms", rate: "28/min", error: "0.4%" },
                { name: "EMR Atlas Vector Index (RAG)", health: 100, latency: "95ms", rate: "84/min", error: "0.0%" },
                { name: "Alert Contraindication Rule Engine", health: 99.9, latency: "110ms", rate: "55/min", error: "0.1%" }
              ].map((pipe, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{pipe.name}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {pipe.health}% Operational
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-mono border-t border-slate-100/50 pt-2">
                    <div>
                      <span className="block text-slate-400">Avg Latency</span>
                      <span className="font-semibold text-slate-700">{pipe.latency}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Throughput</span>
                      <span className="font-semibold text-slate-700">{pipe.rate}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Error rate</span>
                      <span className="font-semibold text-rose-600">{pipe.error}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Error Observability Monitor */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
            <span className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2">Error Observability & Fallbacks</span>
            
            <div className="flex flex-col gap-2.5">
              {[
                { type: "Threshold Bypass Warning", msg: "Patient PT-3312 scan confidence triggered below threshold limits (0.72). Fallback routing manual verification sent.", code: "ERR-OCR-403" },
                { type: "Database Latency Spike", msg: "EMR Semantic vector pipeline reported Atlas query delay threshold warning (214ms). Dynamic cached fallback deployed.", code: "WARN-RAG-201" }
              ].map((err, idx) => (
                <div key={idx} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center justify-between font-bold text-rose-800">
                      <span>{err.type}</span>
                      <span className="font-mono text-[9px] bg-rose-100/60 px-1 py-0.5 rounded">{err.code}</span>
                    </div>
                    <p className="text-slate-600 leading-normal">{err.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right Column combined layout */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* 4. AI Event Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-5 flex flex-col gap-3.5 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">Inference Audit Trails</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by event, patient, module, or status"
                    className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/50 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Module
                  </button>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {["All", "Success", "Warning", "Failed"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                          filterStatus === st
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/50">
                    {["Event ID", "Type", "Patient", "AI Module", "Latency", "Confidence", "Status", "Age"].map((h) => (
                      <th key={h} className="py-2.5 px-5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`hover:bg-slate-50/50 transition cursor-pointer text-xs ${
                        selectedEventId === ev.id ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-5 font-mono text-slate-600 font-semibold">{ev.id}</td>
                      <td className="py-3 px-5 text-slate-800 font-semibold">{ev.type}</td>
                      <td className="py-3 px-5 font-mono text-slate-700">{ev.patientId}</td>
                      <td className="py-3 px-5 text-slate-500">{ev.module}</td>
                      <td className="py-3 px-5 font-mono text-slate-700">{ev.latency}ms</td>
                      <td className="py-3 px-5 font-mono text-slate-700">{ev.confidence}%</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${
                          ev.status === "Success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : ev.status === "Warning"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-400 font-medium">{ev.timestamp}</td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        No telemetry event records found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50">
              <span>Showing {filteredEvents.length} of {events.length} logs</span>
              <div className="flex gap-2">
                <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 cursor-not-allowed">Prev</button>
                <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 6. MongoDB Audit Snapshot Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-900">MongoDB EMR Telemetry Log Document</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">BSON / JSON representation</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 overflow-x-auto select-all max-h-[220px]">
                <pre className="text-[11px] leading-relaxed text-slate-700 font-mono">
                  {JSON.stringify(activeEvent.rawJson, null, 2)}
                </pre>
              </div>
            </div>

            {/* 8. Timeline / Audit Trail */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-sm font-semibold text-slate-900">Clinical Audit Trail Stepper</span>
                <span className="text-[10px] text-slate-400 font-mono">Active Event: {activeEvent.id}</span>
              </div>

              <div className="flex flex-col gap-3 text-xs text-slate-500">
                <div className="flex gap-3 relative">
                  <div className="w-px bg-slate-200 absolute left-2 top-4 bottom-0" />
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">Inference Request Ingested</span>
                    <span className="text-[10px] text-slate-400">MongoDB logs created. Raw payload mapped.</span>
                  </div>
                </div>

                <div className="flex gap-3 relative">
                  <div className="w-px bg-slate-200 absolute left-2 top-4 bottom-0" />
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">EMR Semantic Context Vector Search Completed</span>
                    <span className="text-[10px] text-slate-400">Fetched relevant outpatient history index coordinates.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-4.5 h-4.5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">Model Response Generated & Awaiting Doctor Verification</span>
                    <span className="text-[10px] text-slate-400">Summary generated successfully with {activeEvent.confidence}% score.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
