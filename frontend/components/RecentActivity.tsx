"use client";

import { MoreVertical, Zap, Users, Activity, AlertTriangle, ArrowRight, Wifi } from "lucide-react";
import { useSseEvents } from "../lib/SseContext";
import { BackendEvent } from "../lib/api";

const EVENT_ICON: Record<string, { icon: typeof Zap; color: string }> = {
  PATIENT_ADMITTED:    { icon: Users,         color: "text-blue-600 bg-blue-50" },
  PATIENT_REDIRECTED:  { icon: ArrowRight,    color: "text-emerald-600 bg-emerald-50" },
  SURGE_TRIGGERED:     { icon: Zap,           color: "text-amber-600 bg-amber-50" },
  SURGE_DETECTED:      { icon: Zap,           color: "text-amber-600 bg-amber-50" },
  SURGE_ENDED:         { icon: Activity,      color: "text-emerald-600 bg-emerald-50" },
  HOSPITALS_FLOODED:   { icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
  DISTRESS_EVENT:      { icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
  TREATMENT_STARTED:   { icon: Activity,      color: "text-violet-600 bg-violet-50" },
  TREATMENT_COMPLETED: { icon: Activity,      color: "text-emerald-600 bg-emerald-50" },
  CITY_INITIALIZED:    { icon: Zap,           color: "text-blue-600 bg-blue-50" },
};

function eventLabel(ev: BackendEvent): string {
  switch (ev.type) {
    case "PATIENT_ADMITTED":    return `Patient ${ev.patientId?.slice(-6) ?? "?"} admitted to ${ev.hospitalId ?? "hospital"}`;
    case "PATIENT_REDIRECTED":  return `Redirect: ${ev.sourceHospitalName ?? ev.sourceHospitalId ?? "?"} → ${ev.targetHospitalName ?? ev.targetHospitalId ?? "?"}`;
    case "SURGE_TRIGGERED":     return `Surge: ${ev.count ?? "?"} patients injected`;
    case "SURGE_DETECTED":      return `⚡ Surge detected — hospitals scaling`;
    case "SURGE_ENDED":         return `Surge ended — back to baseline`;
    case "HOSPITALS_FLOODED":   return `Flood: ${ev.totalPatients ?? "?"} patients across hospitals`;
    case "DISTRESS_EVENT":      return `Distress [${ev.status ?? "?"}] — ${ev.patientId?.slice(-6) ?? "?"}`;
    case "TREATMENT_STARTED":   return `Treating ${ev.patientId?.slice(-6) ?? "?"} [${ev.department ?? "dept"}]`;
    case "TREATMENT_COMPLETED": return `✓ Done: ${ev.patientId?.slice(-6) ?? "?"}`;
    case "CITY_INITIALIZED":    return `City init: ${ev.hospitalCount ?? "?"} hospitals`;
    default:                    return ev.message ?? ev.type;
  }
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 5000)  return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// Seed items shown before backend connects
const SEED = [
  { time: "waiting", who: "System", action: "Connecting to backend…", target: "", avatar: "" },
];

export function RecentActivity() {
  const events = useSseEvents();

  const items = events.length > 0
    ? events.slice(0, 8).map((ev) => ({
        ev,
        label: eventLabel(ev),
        time: relTime(ev.timestamp),
        cfg: EVENT_ICON[ev.type] ?? { icon: Activity, color: "text-slate-600 bg-slate-50" },
      }))
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Live Events</h3>
          {events.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" /> live
            </span>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-700"><MoreVertical className="w-4 h-4" /></button>
      </div>

      <div className="space-y-3">
        {items
          ? items.map(({ ev, label, time, cfg }) => {
              const Icon = cfg.icon;
              return (
                <div key={`${ev.type}-${ev.timestamp}`} className="flex items-start gap-3">
                  <span className="text-xs text-slate-400 mt-1 w-14 shrink-0">{time}</span>
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-700 leading-snug">{label}</p>
                </div>
              );
            })
          : (
            <div className="text-sm text-slate-400 text-center py-4">
              Waiting for backend events…
            </div>
          )
        }
      </div>
    </div>
  );
}
