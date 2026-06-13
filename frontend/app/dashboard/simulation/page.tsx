"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Zap, Users, Activity, ChevronDown, Waves, Wifi, WifiOff } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "../../../lib/api";
import { useSseStats, useSseEvents, useSseConnected } from "../../../lib/SseContext";

const levelColor: Record<string, string> = {
  SYSTEM: "text-slate-400",
  INFO: "text-blue-400",
  WARN: "text-amber-400",
  CRITICAL: "text-rose-400",
  SUCCESS: "text-emerald-400",
};

function eventToLog(ev: { type: string; message?: string; patientId?: string; count?: number }) {
  const level = ev.type.includes("CRITICAL") || ev.type.includes("DISTRESS")
    ? "CRITICAL"
    : ev.type.includes("SURGE") || ev.type.includes("FLOOD")
    ? "WARN"
    : ev.type.includes("COMPLETED") || ev.type.includes("REDIRECT")
    ? "SUCCESS"
    : "INFO";
  return { level, msg: ev.message ?? `${ev.type}${ev.patientId ? ` [${ev.patientId.slice(-6)}]` : ""}${ev.count != null ? ` ×${ev.count}` : ""}` };
}

export default function Simulation() {
  const [surge, setSurge] = useState(3);
  const [dropout, setDropout] = useState(20);
  const [freq, setFreq] = useState<"LOW" | "MED" | "HIGH">("MED");
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const stats = useSseStats();
  const events = useSseEvents();
  const connected = useSseConnected();

  // Build chart data from SSE stats (last 20 ticks)
  const tickRef = useRef(0);
  const [chartData, setChartData] = useState<{ t: number; queue: number; doctors: number }[]>([]);
  useEffect(() => {
    if (!stats) return;
    setChartData((d) => [
      ...d.slice(-19),
      { t: tickRef.current++, queue: stats.totalPatientsWaiting, doctors: stats.totalDoctorsActive },
    ]);
  }, [stats]);

  const logs = events.slice(0, 30).map(eventToLog);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs.length]);

  // ─── Action handlers ───────────────────────────────────────────────────────

  const initCity = useCallback(async () => {
    setLoading("init"); setStatus(null);
    try {
      const msg = await api.initCity(10);
      setStatus(typeof msg === "string" ? msg : "City initialized");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally { setLoading(null); }
  }, []);

  const triggerSurge = useCallback(async () => {
    setLoading("surge"); setStatus(null);
    try {
      const msg = await api.triggerSurge(surge * 20);
      setStatus(typeof msg === "string" ? msg : `Surge ×${surge} triggered`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally { setLoading(null); }
  }, [surge]);

  const applyDropout = useCallback(async () => {
    setLoading("dropout"); setStatus(null);
    try {
      const msg = await api.triggerStaffShortage(1 - dropout / 100);
      setStatus(typeof msg === "string" ? msg : `Staff shortage applied (${dropout}% reduction)`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally { setLoading(null); }
  }, [dropout]);

  const floodHospitals = useCallback(async () => {
    setLoading("flood"); setStatus(null);
    try {
      await api.floodHospitals(200, 3);
      setStatus("Flooded 3 hospitals with 200 patients each");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally { setLoading(null); }
  }, []);

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border mb-2 ${
            connected ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {connected ? "Backend Connected · SSE live" : "Connecting to backend…"}
          </span>
          <h1 className="text-slate-900" style={{ fontSize: "24px", fontWeight: 700 }}>Simulation &amp; Chaos Mode</h1>
          <p className="text-sm text-slate-500">Stress-test policies under surges, dropouts, and distress storms.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={initCity} disabled={!!loading} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm disabled:opacity-50">
            <RotateCcw className={`w-4 h-4 ${loading === "init" ? "animate-spin" : ""}`} /> Init City
          </button>
          <button onClick={floodHospitals} disabled={!!loading} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm shadow-lg shadow-rose-200 disabled:opacity-50">
            <Waves className="w-4 h-4" /> Flood Hospitals
          </button>
        </div>
      </div>

      {/* Status bar */}
      {status && (
        <div className={`px-4 py-2 rounded-xl text-sm ${status.startsWith("Error") ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
          {status}
        </div>
      )}

      {/* Chaos controls */}
      <div className="grid grid-cols-4 gap-4">
        <ChaosCard title="Patient Surge" icon={Waves} color="bg-blue-50 text-blue-600">
          <input type="range" min={1} max={10} value={surge} onChange={(e) => setSurge(+e.target.value)} className="w-full accent-blue-600" />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1"><span>1x</span><span className="text-slate-900" style={{ fontWeight: 600 }}>{surge}x ({surge * 20} patients)</span><span>10x</span></div>
          <button onClick={triggerSurge} disabled={!!loading} className="mt-3 w-full py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
            {loading === "surge" ? "Triggering…" : "Trigger Surge"}
          </button>
        </ChaosCard>

        <ChaosCard title="Staff Dropout" icon={Users} color="bg-rose-50 text-rose-600">
          <input type="range" min={0} max={80} value={dropout} onChange={(e) => setDropout(+e.target.value)} className="w-full accent-rose-600" />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1"><span>0%</span><span className="text-slate-900" style={{ fontWeight: 600 }}>{dropout}% reduction</span><span>80%</span></div>
          <button onClick={applyDropout} disabled={!!loading} className="mt-3 w-full py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-50">
            {loading === "dropout" ? "Applying…" : "Apply Dropout"}
          </button>
        </ChaosCard>

        <ChaosCard title="Distress Frequency" icon={Zap} color="bg-amber-50 text-amber-600">
          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
            {(["LOW", "MED", "HIGH"] as const).map((f) => (
              <button key={f} onClick={() => setFreq(f)} className={`flex-1 py-1.5 rounded-md text-xs ${freq === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>{f}</button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Rate: {freq === "LOW" ? "1/min" : freq === "MED" ? "5/min" : "15/min"}</p>
          <p className="text-xs text-slate-400 mt-1">Managed by backend AI service</p>
        </ChaosCard>

        <ChaosCard title="Live Stats" icon={Activity} color="bg-violet-50 text-violet-600">
          <div className="space-y-2">
            {[
              { l: "Queue", v: stats?.totalPatientsWaiting ?? "—" },
              { l: "Doctors", v: stats?.totalDoctorsActive ?? "—" },
              { l: "Hospitals", v: stats?.totalHospitals ?? "—" },
              { l: "Surge", v: stats?.surgeActive ? "YES ⚡" : (stats ? "No" : "—") },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-slate-500">{l}</span>
                <span className="text-slate-900" style={{ fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
            {connected ? <><Wifi className="w-3 h-3" /> live SSE</> : <><WifiOff className="w-3 h-3" /> reconnecting</>}
          </div>
        </ChaosCard>
      </div>

      {/* Chart + log */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Live Impact Analysis</h3>
            <div className="flex gap-2 text-xs text-slate-500">
              {[
                { l: "Queue", v: stats?.totalPatientsWaiting?.toLocaleString() ?? "—" },
                { l: "Doctors", v: stats?.totalDoctorsActive?.toLocaleString() ?? "—" },
                { l: "Hospitals", v: stats?.totalHospitals?.toLocaleString() ?? "—" },
                { l: "Surge", v: stats?.surgeActive ? "YES" : (stats ? "No" : "—") },
              ].map((m) => (
                <div key={m.l} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">{m.l}: </span>
                  <span className="text-slate-900" style={{ fontWeight: 600 }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Line type="monotone" dataKey="queue" name="Queue Length" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="doctors" name="Active Doctors" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 flex flex-col" style={{ fontFamily: "monospace" }}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${connected ? "text-emerald-400" : "text-amber-400"}`}>
              {connected ? "● SSE Live" : "○ Reconnecting…"}
            </span>
            <span className="text-slate-500 text-xs">{logs.length} entries</span>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto text-xs space-y-1.5 max-h-[260px]">
            {logs.length > 0 ? logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600">[{String(i).padStart(3, "0")}]</span>
                <span className={levelColor[l.level]} style={{ fontWeight: 600 }}>{l.level}</span>
                <span className="text-slate-300">{l.msg}</span>
              </div>
            )) : (
              <div className="text-slate-500 text-center py-4">Waiting for backend events…</div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs">
            <span>$</span>
            <input className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-600" placeholder="run command…" />
          </div>
        </div>
      </div>
    </>
  );
}

function ChaosCard({ title, icon: Icon, color, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
        <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
