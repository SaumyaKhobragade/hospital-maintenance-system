"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, MapPin, Clock, ShieldCheck, ChevronRight, Play, Camera } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";

import { supabase } from "../../../lib/supabaseClient";

interface AlertData {
  id: string;
  hospital: string;
  type: string;
  confidence: number;
  wait: string;
  severity: string;
}

const sevColor: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-100",
  high: "bg-amber-50 text-amber-700 border-amber-100",
  medium: "bg-blue-50 text-blue-700 border-blue-100",
};

const clips = [
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400",
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
];

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [selected, setSelected] = useState<AlertData | null>(null);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("distress_events")
      .select("id, type, confidence, event_timestamp, patients ( target_hospital_id, base_severity )");

    if (data) {
      const mapped = data.map((d: any) => ({
        id: "AL-" + d.id.substring(0, 4),
        hospital: "Hospital " + (d.patients?.target_hospital_id?.substring(0,4) || "Unknown"),
        type: d.type || "Distress",
        confidence: Math.round(d.confidence || 0),
        wait: d.event_timestamp ? new Date(d.event_timestamp).toLocaleTimeString() : "Just now",
        severity: (d.patients?.base_severity > 7) ? "critical" : (d.patients?.base_severity > 4) ? "high" : "medium"
      }));
      setAlerts(mapped);
      if (mapped.length > 0) setSelected(mapped[0]);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Distress & Video Alerts</h1>
          <p className="text-sm text-slate-500">Real-time AI vision pipeline · clinician verification required.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> 5 active alerts
          </span>
          <button onClick={fetchAlerts} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Video Analysis</h3>
              <button className="text-xs text-blue-600">Analyze All</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {clips.map((c, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer">
                  <ImageWithFallback src={c} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">{Math.floor(Math.random() * 80 + 20)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-4 border-b border-slate-100"><h3 className="text-slate-900" style={{ fontWeight: 600 }}>DB Alerts</h3></div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition ${selected?.id === a.id ? "bg-blue-50/40" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.severity === "critical" ? "bg-rose-50 text-rose-600" : a.severity === "high" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{a.hospital}</span>
                      <span className="text-xs text-slate-400">{a.id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${sevColor[a.severity]}`}>{a.type}</span>
                      <span className="text-xs text-slate-500">{a.confidence}% · {a.wait}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-5">
          {selected ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="aspect-video bg-slate-900 relative">
              <ImageWithFallback src={clips[0]} alt="" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play className="w-7 h-7 text-slate-900 ml-1" /></button>
              </div>
              <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE · CCTV-04
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white text-xs">
                <Camera className="w-3.5 h-3.5" /> {selected.hospital} · Lobby
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs border ${sevColor[selected.severity]}`} style={{ fontWeight: 600 }}>{selected.type}</span>
                  <h3 className="text-slate-900 mt-2" style={{ fontSize: "18px", fontWeight: 700 }}>Alert {selected.id}</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <Stat icon={ShieldCheck} label="Confidence" value={`${selected.confidence}%`} />
                <Stat icon={MapPin} label="Location" value={selected.hospital} />
                <Stat icon={Clock} label="Detected" value={selected.wait} />
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-500 mb-2">Queue Context</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: "78%" }} />
                  </div>
                  <span className="text-sm">78% severity</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Was: 62% · Now: 78% (+16)</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-blue-700 mb-1" style={{ fontWeight: 600 }}>Recommended Action</p>
                <p className="text-sm text-slate-800">Dispatch nurse to lobby and activate fast-track for patient. ETA 90s.</p>
              </div>
              <textarea placeholder="Triage notes (optional)…" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 mb-3 min-h-[80px]" />
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">Dismiss</button>
                <button className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm shadow-lg shadow-blue-200">Confirm & Dispatch</button>
              </div>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center min-h-[400px] text-slate-400">
              No alert selected
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Icon className="w-3 h-3" />{label}</div>
      <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
