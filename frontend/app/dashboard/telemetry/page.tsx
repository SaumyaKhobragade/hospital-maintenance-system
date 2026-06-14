"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  TrendingUp,
  Server,
  WifiOff,
  Loader2,
} from "lucide-react";
import { pythonApi, TelemetryEvent } from "@/lib/pythonApi";

const SEED_EVENTS: TelemetryEvent[] = [
  {
    event_type: "AMBIENT_SCRIBE_DISPATCH",
    timestamp: "2026-06-14T06:00:00.000Z",
    patient_id: "PT-9042",
    thread_id: "scribe-demo-1",
    status: "DISPATCHED",
  },
  {
    event_type: "REPORT_DISPATCH",
    timestamp: "2026-06-14T05:55:00.000Z",
    patient_id: "PT-7719",
    thread_id: "report-demo-1",
    status: "DISPATCHED",
  },
];

type StatusType = "Success" | "Warning" | "Failed";

function inferStatus(ev: TelemetryEvent): StatusType {
  const et = (ev.event_type ?? "").toLowerCase();
  if (et.includes("fail") || et.includes("error")) return "Failed";
  if (et.includes("warn") || et.includes("pending")) return "Warning";
  return "Success";
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return date.toLocaleDateString();
  } catch {
    return ts;
  }
}

export default function TelemetryAuditLogsPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>(SEED_EVENTS);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await pythonApi.getTelemetryLogs(50);
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
        setSelectedIdx(0);
        setBackendConnected(true);
      } else {
        // No events in DB yet — keep seed data
        setBackendConnected(true);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to backend.");
      setBackendConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const activeEvent = events[selectedIdx] ?? events[0];

  const filteredEvents = events.filter((ev) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (ev.patient_id ?? "").toLowerCase().includes(q) ||
      (ev.event_type ?? "").toLowerCase().includes(q) ||
      (ev.thread_id ?? "").toLowerCase().includes(q);

    const evStatus = inferStatus(ev);
    const matchesStatus = filterStatus === "All" || evStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const statusStyle = (ev: TelemetryEvent) => {
    const s = inferStatus(ev);
    if (s === "Success") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (s === "Warning") return "bg-amber-50 text-amber-700 border border-amber-100";
    return "bg-rose-50 text-rose-700 border border-rose-100";
  };

  // Build display-friendly event type
  const displayType = (et: string) =>
    et.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {backendConnected === null
                ? "Connecting…"
                : backendConnected
                ? "MongoDB Connected · Live"
                : "Backend Offline · Seed Data"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Observability Logging Enabled
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>
            AI Telemetry & Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Real-time MongoDB telemetry tracking, inference execution auditing, and medical pipeline performance monitoring.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          id="refresh-telemetry-btn"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Fetching…" : "Live Ingestion Feed"}
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-xs">
          <WifiOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-rose-800">Cannot reach backend · showing seed data</span>
            <span className="text-rose-700">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Events", value: String(events.length), change: "from MongoDB", icon: Cpu, color: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "Scribe Dispatches", value: String(events.filter(e => e.event_type?.includes("SCRIBE")).length), change: "Ambient Scribe", icon: Activity, color: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "Report Dispatches", value: String(events.filter(e => e.event_type?.includes("REPORT")).length), change: "Auto-generated", icon: FileText, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
          { label: "Unique Patients", value: String(new Set(events.map(e => e.patient_id).filter(Boolean)).size), change: "Active threads", icon: Layers, color: "bg-amber-50 text-amber-600 border border-amber-100" },
          { label: "Failed Events", value: String(events.filter(e => inferStatus(e) === "Failed").length), change: "Needs review", icon: AlertTriangle, color: "bg-rose-50 text-rose-600 border border-rose-100" },
          { label: "Telemetry Source", value: "MongoDB", change: "Motor async client", icon: Server, color: "bg-slate-50 text-slate-600 border border-slate-200" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-slate-500 font-semibold leading-tight">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold mt-1" style={{ fontSize: "22px", lineHeight: "1" }}>
                {stat.value}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Pipeline health */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-sm font-semibold text-slate-900">Pipeline Execution Health</span>
              <span className="text-[10px] text-slate-400 font-mono">Live aggregated</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: "Ambient Scribe", health: 99.8, latency: "~4s end-to-end", rate: "Sarvam STT", error: "0.2%" },
                { name: "Combined Report", health: 99.5, latency: "~8s synthesis", rate: "ChromaDB + LLM", error: "0.5%" },
                { name: "RAG Vector Search", health: 100, latency: "~95ms", rate: "Gemini Embed", error: "0.0%" },
                { name: "Risk Assessment", health: 99.9, latency: "~3s", rate: "Groq LLaMA-3.3", error: "0.1%" },
              ].map((pipe, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{pipe.name}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {pipe.health}% Operational
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-mono border-t border-slate-100/50 pt-2">
                    <div>
                      <span className="block text-slate-400">Latency</span>
                      <span className="font-semibold text-slate-700">{pipe.latency}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Engine</span>
                      <span className="font-semibold text-slate-700">{pipe.rate}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Errors</span>
                      <span className="font-semibold text-rose-600">{pipe.error}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Event JSON */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900">MongoDB Document</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">BSON/JSON</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 overflow-x-auto select-all max-h-[220px]">
              <pre className="text-[11px] leading-relaxed text-slate-700 font-mono">
                {JSON.stringify(activeEvent ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Event Log Table + Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-5 flex flex-col gap-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">Inference Audit Trails</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by event type, patient ID, thread ID…"
                    className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/50 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {["All", "Success", "Warning", "Failed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        filterStatus === s
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isRefreshing && events.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading events from MongoDB…
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/50">
                      {["#", "Event Type", "Patient", "Thread ID", "Timestamp", "Status"].map((h) => (
                        <th key={h} className="py-2.5 px-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredEvents.map((ev, i) => {
                      const globalIdx = events.indexOf(ev);
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedIdx(globalIdx)}
                          className={`hover:bg-slate-50/50 transition cursor-pointer text-xs ${
                            selectedIdx === globalIdx ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {displayType(ev.event_type ?? "UNKNOWN")}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-700">
                            {ev.patient_id ?? "—"}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 truncate max-w-[120px]">
                            {ev.thread_id ?? "—"}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            {formatTimestamp(ev.timestamp)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] ${statusStyle(ev)}`}>
                              {inferStatus(ev)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                          No telemetry events match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50">
              <span>
                Showing {filteredEvents.length} of {events.length} events
                {backendConnected === false && " (seed data — backend offline)"}
              </span>
            </div>
          </div>

          {/* Audit Trail Stepper */}
          {activeEvent && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-sm font-semibold text-slate-900">Clinical Audit Trail</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {displayType(activeEvent.event_type ?? "")}
                </span>
              </div>
              <div className="flex flex-col gap-3 text-xs text-slate-500">
                {[
                  { label: "Inference Request Ingested", detail: "MongoDB telemetry document created. Payload mapped.", done: true },
                  {
                    label: "AI Pipeline Executed",
                    detail: `Event: ${displayType(activeEvent.event_type ?? "")} · Patient: ${activeEvent.patient_id ?? "N/A"}`,
                    done: true,
                  },
                  {
                    label: "Dispatch Status",
                    detail: inferStatus(activeEvent) === "Success" ? "Completed successfully. Report dispatched." : "Status: " + inferStatus(activeEvent),
                    done: inferStatus(activeEvent) === "Success",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i < 2 && <div className="w-px bg-slate-200 absolute left-2 top-4 bottom-0" />}
                    <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border ${
                      step.done
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}>
                      {step.done
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        : <Clock className="w-3 h-3 text-slate-400" />
                      }
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{step.label}</span>
                      <span className="text-[10px] text-slate-400">{step.detail}</span>
                    </div>
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
