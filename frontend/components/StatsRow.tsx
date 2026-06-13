"use client";

import { Users, UserPlus, Activity, AlertTriangle, TrendingDown, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useSseStats, useSseConnected, useSseReconnecting } from "../lib/SseContext";

export function StatsRow() {
  const stats = useSseStats();
  const connected = useSseConnected();
  const reconnecting = useSseReconnecting();

  const waiting   = stats?.totalPatientsWaiting ?? null;
  const doctors   = stats?.totalDoctorsActive   ?? null;
  const hospitals = stats?.totalHospitals        ?? null;
  const surge     = stats?.surgeActive           ?? false;

  const rows = [
    {
      label: "Patients Waiting",
      value: waiting != null ? waiting.toLocaleString() : "—",
      trend: waiting != null ? (surge ? "+surge" : "live") : "—",
      trendUp: surge,
      icon: Users,
      iconColor: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Hospitals",
      value: hospitals != null ? hospitals.toLocaleString() : "—",
      trend: "online",
      trendUp: true,
      icon: UserPlus,
      iconColor: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active Doctors",
      value: doctors != null ? doctors.toLocaleString() : "—",
      trend: doctors != null ? "live" : "—",
      trendUp: true,
      icon: Activity,
      iconColor: "bg-violet-50 text-violet-600",
    },
    {
      label: "Surge Active",
      value: surge ? "YES" : (stats ? "No" : "—"),
      trend: surge ? "alert" : "normal",
      trendUp: surge,
      icon: AlertTriangle,
      iconColor: surge ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {rows.map((s) => {
        const Icon = s.icon;
        const TrendIcon = s.trendUp ? TrendingUp : TrendingDown;
        return (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-slate-500">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-slate-900 mb-3" style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1 }}>
              {s.value}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                s.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                <TrendIcon className="w-3 h-3" />
                {s.trend}
              </span>
              {/* SSE connection indicator */}
              {reconnecting
                ? <span className="text-xs text-amber-500 flex items-center gap-1"><WifiOff className="w-3 h-3" />reconnecting</span>
                : connected
                ? <span className="text-xs text-emerald-500 flex items-center gap-1"><Wifi className="w-3 h-3" />live</span>
                : <span className="text-xs text-slate-400">connecting…</span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}
