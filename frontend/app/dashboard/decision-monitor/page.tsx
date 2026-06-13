"use client";

import { Fragment, useState } from "react";
const FragmentRow = Fragment;
import { Download, RefreshCw, Search, ChevronDown, ChevronRight, Route, Flag } from "lucide-react";

const decisions = [
  { id: "D-9821", patient: "PT-8421", from: "Central", to: "Eastern", type: "Safe", reason: "Capacity overflow", time: "2m ago", status: "Applied", confidence: 92, policy: "Adaptive v2.4" },
  { id: "D-9820", patient: "PT-8420", from: "Riverside", to: "Northgate", type: "Conditional", reason: "Specialty match", time: "4m ago", status: "Applied", confidence: 78, policy: "Adaptive v2.4" },
  { id: "D-9819", patient: "PT-8418", from: "Central", to: "Westside", type: "Standard", reason: "Wait optimization", time: "6m ago", status: "Pending", confidence: 64, policy: "Adaptive v2.4" },
  { id: "D-9818", patient: "PT-8415", from: "Northgate", to: "Central", type: "Safe", reason: "ICU capacity", time: "11m ago", status: "Applied", confidence: 88, policy: "Adaptive v2.4" },
  { id: "D-9817", patient: "PT-8412", from: "Eastern", to: "Riverside", type: "Standard", reason: "Distance", time: "18m ago", status: "Rejected", confidence: 41, policy: "Strict FIFO" },
];

const typeColor: Record<string, string> = {
  Safe: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Conditional: "bg-amber-50 text-amber-700 border-amber-100",
  Standard: "bg-blue-50 text-blue-700 border-blue-100",
};

const statusColor: Record<string, string> = {
  Applied: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-rose-50 text-rose-700",
};

export default function DecisionMonitor() {
  const [expanded, setExpanded] = useState<string | null>("D-9821");

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Redirection Decision Monitor</h1>
          <p className="text-sm text-slate-500">Audit log of every routing decision made by the engine.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"><Download className="w-4 h-4" /> Export Log</button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm"><RefreshCw className="w-4 h-4" /> Live Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { l: "Total Redirects", v: "1,284", sub: "+12% today", c: "blue" },
          { l: "Avg Wait Saved", v: "8.4m", sub: "per patient", c: "emerald" },
          { l: "Failed Redirects", v: "21", sub: "1.6% of total", c: "rose" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500 mb-2">{s.l}</p>
            <div className="text-slate-900" style={{ fontSize: "32px", fontWeight: 700 }}>{s.v}</div>
            <p className={`text-xs mt-2 text-${s.c}-600`}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-slate-900 mb-4" style={{ fontWeight: 600 }}>Live Redirection Events</h3>
        <div className="space-y-2">
          {decisions.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Route className="w-4 h-4" /></div>
              <span className="text-sm" style={{ fontFamily: "monospace" }}>{d.patient}</span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>{d.from}</span><ChevronRight className="w-3 h-3" /><span className="text-slate-900" style={{ fontWeight: 600 }}>{d.to}</span>
              </div>
              <span className="ml-auto text-xs text-emerald-600">+{Math.round(d.confidence / 10)}m saved</span>
              <span className="text-xs text-slate-400">{d.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search by patient, hospital, decision ID…" className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm outline-none" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm">All Types <ChevronDown className="w-4 h-4 text-slate-400" /></button>
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm">All Status <ChevronDown className="w-4 h-4 text-slate-400" /></button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              {["Patient", "Route", "Type", "Reason", "Time", "Status", ""].map((h) => (
                <th key={h} className="py-3 px-5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => (
              <FragmentRow key={d.id}>
                <tr className="border-b border-slate-50 hover:bg-slate-50/40 cursor-pointer" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <td className="py-4 px-5 text-sm" style={{ fontFamily: "monospace" }}>{d.patient}</td>
                  <td className="py-4 px-5 text-sm text-slate-700">
                    <span>{d.from}</span> <ChevronRight className="w-3 h-3 inline text-slate-400" /> <span style={{ fontWeight: 600 }}>{d.to}</span>
                  </td>
                  <td className="py-4 px-5"><span className={`px-2.5 py-1 rounded-full text-xs border ${typeColor[d.type]}`}>{d.type}</span></td>
                  <td className="py-4 px-5 text-sm text-slate-600">{d.reason}</td>
                  <td className="py-4 px-5 text-sm text-slate-500">{d.time}</td>
                  <td className="py-4 px-5"><span className={`px-2.5 py-1 rounded-full text-xs ${statusColor[d.status]}`}>{d.status}</span></td>
                  <td className="py-4 px-5">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expanded === d.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {expanded === d.id && (
                  <tr className="bg-slate-50/40">
                    <td colSpan={7} className="px-5 py-5" data-row="expanded">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Confidence Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${d.confidence}%` }} />
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{d.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Policy</p>
                          <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{d.policy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Constraints checked</p>
                          <p className="text-sm text-slate-700">capacity ✓ · specialty ✓ · distance ✓</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs"><Flag className="w-3 h-3" /> Flag for review</button>
                      </div>
                    </td>
                  </tr>
                )}
              </FragmentRow>
            ))}
          </tbody>
        </table>
        <div className="p-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Showing 5 of 1,284</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200">Prev</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200">Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
