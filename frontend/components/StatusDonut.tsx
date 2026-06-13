"use client";

import { ChevronDown } from "lucide-react";

export function StatusDonut() {
  const total = 654;
  const newCount = 212;
  const returning = 442;
  const newPct = newCount / total;
  const radius = 70;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Status</h3>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-700">
          This week <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative w-[180px] h-[180px]">
          <svg width="180" height="180" className="-rotate-90">
            <circle cx="90" cy="90" r={radius} stroke="#1e293b" strokeWidth="18" fill="none" strokeDasharray={`${circ * newPct} ${circ}`} strokeLinecap="round" />
            <circle cx="90" cy="90" r={radius} stroke="#3b82f6" strokeWidth="18" fill="none" strokeDasharray={`${circ * (1 - newPct - 0.02)} ${circ}`} strokeDashoffset={`-${circ * newPct + circ * 0.01}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-slate-900" style={{ fontSize: "36px", fontWeight: 600, lineHeight: 1 }}>{total}</span>
            <span className="text-xs text-slate-500 mt-2">82%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <span className="text-sm text-slate-600">New</span>
          <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{newCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600">Returning</span>
          <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{returning}</span>
        </div>
      </div>
    </div>
  );
}
