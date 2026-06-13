"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Zap, Users, Activity, ChevronDown, Waves } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const seedData = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  queue: 40 + Math.round(Math.sin(i / 2) * 15) + i,
  doctors: 80 - Math.round(Math.cos(i / 3) * 10),
}));

const seedLogs = [
  { level: "SYSTEM", msg: "Simulation engine initialized — 10 hospitals online" },
  { level: "INFO", msg: "Patient PT-2841 routed to General Metropolitan" },
  { level: "WARN", msg: "Hospital Riverside approaching 85% capacity" },
  { level: "SUCCESS", msg: "Redirection applied: 4 patients moved to Eastern" },
  { level: "CRITICAL", msg: "Distress event detected at Central · awaiting verification" },
  { level: "INFO", msg: "Policy v2.4 active — adaptive aging engaged" },
];

const levelColor: Record<string, string> = {
  SYSTEM: "text-slate-400",
  INFO: "text-blue-400",
  WARN: "text-amber-400",
  CRITICAL: "text-rose-400",
  SUCCESS: "text-emerald-400",
};

export default function Simulation() {
  const [running, setRunning] = useState(true);
  const [data, setData] = useState(seedData);
  const [logs, setLogs] = useState(seedLogs);
  const [surge, setSurge] = useState(3);
  const [dropout, setDropout] = useState(20);
  const [freq, setFreq] = useState<"LOW" | "MED" | "HIGH">("MED");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setData((d) => [...d.slice(1), { t: d[d.length - 1].t + 1, queue: 30 + Math.round(Math.random() * 40), doctors: 70 + Math.round(Math.random() * 20) }]);
      setLogs((l) => [...l, { level: ["INFO", "SUCCESS", "WARN"][Math.floor(Math.random() * 3)], msg: `Tick ${Date.now() % 10000} — patient flow normal` }].slice(-30));
    }, 1500);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [logs]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Active · v2.4
          </span>
          <h1 className="text-slate-900" style={{ fontSize: "24px", fontWeight: 700 }}>Simulation & Chaos Mode</h1>
          <p className="text-sm text-slate-500">Stress-test policies under surges, dropouts, and distress storms.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setData(seedData)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={() => setRunning(!running)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white shadow-lg ${running ? "bg-amber-500 shadow-amber-200" : "bg-blue-600 shadow-blue-200"}`}>
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Run</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ChaosCard title="Patient Surge" icon={Waves} color="bg-blue-50 text-blue-600">
          <input type="range" min={1} max={10} value={surge} onChange={(e) => setSurge(+e.target.value)} className="w-full accent-blue-600" />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1"><span>1x</span><span className="text-slate-900" style={{ fontWeight: 600 }}>{surge}x</span><span>10x</span></div>
          <button className="mt-3 w-full py-2 rounded-lg bg-blue-600 text-white text-sm">Trigger Surge</button>
        </ChaosCard>

        <ChaosCard title="Staff Dropout" icon={Users} color="bg-rose-50 text-rose-600">
          <input type="range" min={0} max={100} value={dropout} onChange={(e) => setDropout(+e.target.value)} className="w-full accent-rose-600" />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1"><span>0%</span><span className="text-slate-900" style={{ fontWeight: 600 }}>{dropout}%</span><span>100%</span></div>
          <button className="mt-3 w-full py-2 rounded-lg bg-rose-600 text-white text-sm">Apply Dropout</button>
        </ChaosCard>

        <ChaosCard title="Distress Frequency" icon={Zap} color="bg-amber-50 text-amber-600">
          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
            {(["LOW", "MED", "HIGH"] as const).map((f) => (
              <button key={f} onClick={() => setFreq(f)} className={`flex-1 py-1.5 rounded-md text-xs ${freq === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>{f}</button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Rate: {freq === "LOW" ? "1/min" : freq === "MED" ? "5/min" : "15/min"}</p>
        </ChaosCard>

        <ChaosCard title="Policy Logic" icon={Activity} color="bg-violet-50 text-violet-600">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 text-sm">Adaptive v2.4 <ChevronDown className="w-4 h-4 text-slate-400" /></button>
          <button className="mt-3 w-full py-2 rounded-lg bg-violet-600 text-white text-sm">Apply Policy</button>
        </ChaosCard>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Live Impact Analysis</h3>
            <div className="flex gap-2 text-xs text-slate-500">
              {[
                { l: "Avg Wait", v: "12.4m" },
                { l: "Queue", v: "284" },
                { l: "Processed", v: "1,832" },
                { l: "Doctors", v: "92" },
              ].map((m) => (
                <div key={m.l} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">{m.l}: </span>
                  <span className="text-slate-900" style={{ fontWeight: 600 }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
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
            <span className="text-emerald-400 text-xs">● Event Stream</span>
            <span className="text-slate-500 text-xs">{logs.length} entries</span>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto text-xs space-y-1.5 max-h-[260px]">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600">[{String(i).padStart(3, "0")}]</span>
                <span className={levelColor[l.level]} style={{ fontWeight: 600 }}>{l.level}</span>
                <span className="text-slate-300">{l.msg}</span>
              </div>
            ))}
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
