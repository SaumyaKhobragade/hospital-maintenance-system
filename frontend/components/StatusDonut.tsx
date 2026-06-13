"use client";

import { ChevronDown } from "lucide-react";
import { useSseStats } from "../lib/SseContext";

export function StatusDonut() {
  const stats = useSseStats();

  const waiting = stats?.totalPatientsWaiting ?? 0;
  const active  = stats?.totalDoctorsActive   ?? 0;
  const total   = waiting + active || 1; // avoid /0

  const waitingPct = waiting / total;
  const radius = 70;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Status</h3>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-700">
          Live <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative w-[180px] h-[180px]">
          <svg width="180" height="180" className="-rotate-90">
            {/* Waiting patients — dark */}
            <circle cx="90" cy="90" r={radius} stroke="#1e293b" strokeWidth="18" fill="none"
              strokeDasharray={`${circ * waitingPct} ${circ}`} strokeLinecap="round" />
            {/* Active doctors — blue */}
            <circle cx="90" cy="90" r={radius} stroke="#3b82f6" strokeWidth="18" fill="none"
              strokeDasharray={`${circ * (1 - waitingPct - 0.02)} ${circ}`}
              strokeDashoffset={`-${circ * waitingPct + circ * 0.01}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-slate-900" style={{ fontSize: "36px", fontWeight: 600, lineHeight: 1 }}>
              {stats ? total : "—"}
            </span>
            <span className="text-xs text-slate-500 mt-2">
              {stats ? `${Math.round(waitingPct * 100)}% waiting` : "connecting…"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <span className="text-sm text-slate-600">Waiting</span>
          <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{waiting}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600">Doctors</span>
          <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{active}</span>
        </div>
      </div>
    </div>
  );
}
