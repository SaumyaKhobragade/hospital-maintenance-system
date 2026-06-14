"use client";

import { ArrowLeft, FileText, AlertCircle, Users, Stethoscope, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useEffect, useState } from "react";
import { useSseStats } from "../../../lib/SseContext";

interface Treatment {
  id: string;
  type: string;
  doctor: string;
  loc: string;
  progress: number;
  color: string;
}

const sevColor: Record<string, string> = {
  Critical: "bg-rose-50 text-rose-700 border-rose-100",
  Urgent: "bg-amber-50 text-amber-700 border-amber-100",
  Standard: "bg-blue-50 text-blue-700 border-blue-100",
  Stable: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function QueueDetails() {
  const [patients, setPatients] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const stats = useSseStats();

  useEffect(() => {
    const fetchData = async () => {
      const { data: pData } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (pData) {
        const mapped = pData.map((d: any) => ({
          id: d.id.substring(0, 8),
          severity: d.base_severity,
          sev: d.base_severity > 7 ? "Critical" : d.base_severity > 4 ? "Urgent" : d.base_severity > 2 ? "Standard" : "Stable",
          wait: "0m",
          status: d.treating ? "ICU" : "General",
          priority: Math.min(100, (d.base_severity || 0) * 10)
        }));
        setPatients(mapped);
      }

      const { data: tData } = await supabase
        .from("active_treatments")
        .select("*")
        .order("created_at", { ascending: false });
      if (tData) {
        const mappedT = tData.map((t: any) => ({
          id: t.patient_id ? "PT-" + t.patient_id.substring(0,4) : "PT-0000",
          type: t.type || "General",
          doctor: t.doctor || "Unassigned",
          loc: t.location || "Unknown",
          progress: t.progress || 0,
          color: t.color || "bg-blue-500"
        }));
        setTreatments(mappedT);
      }
    };
    fetchData();
  }, [stats]);
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Central Metropolitan Hospital</h1>
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-100" style={{ fontWeight: 600 }}>SURGE</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">Adaptive</span>
            </div>
            <p className="text-sm text-slate-500">Live queue · ID HSP-001 · 4 wards</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">
          <FileText className="w-4 h-4" /> View Reports
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Queue Capacity</h3>
            <span className="text-xs text-rose-600 inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Above safe</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-slate-900" style={{ fontSize: "44px", fontWeight: 700, lineHeight: 1 }}>{patients.length}</span>
            <span className="text-slate-500">/ 320 capacity</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500" style={{ width: `${Math.min(100, (patients.length / 320) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2"><span>0</span><span>safe</span><span>caution</span><span>full</span></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-slate-900 mb-3" style={{ fontWeight: 600 }}>Staff Availability</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1"><Stethoscope className="w-4 h-4" /> Active</div>
              <div className="text-slate-900" style={{ fontSize: "32px", fontWeight: 700 }}>{treatments.length || 1}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Users className="w-4 h-4" /> Idle</div>
              <div className="text-slate-900" style={{ fontSize: "32px", fontWeight: 700 }}>{Math.max(0, 10 - treatments.length)}</div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" /> Fatigue Warning · {Math.max(1, Math.floor(treatments.length / 3))} doctors above 10h shift
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Waiting Patients</h3>
          <span className="text-sm text-slate-500">{patients.length} in queue</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              {["Patient ID", "Severity", "Wait Time", "Department", "Priority Score", "Actions"].map((h) => (
                <th key={h} className="py-3 px-5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                <td className="py-4 px-5 text-sm" style={{ fontFamily: "monospace" }}>{p.id}</td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${sevColor[p.sev]}`}>
                    <span className="w-2 h-2 rounded-full bg-current" /> {p.sev} ({p.severity})
                  </span>
                </td>
                <td className="py-4 px-5 text-sm text-slate-700">{p.wait}</td>
                <td className="py-4 px-5 text-sm text-slate-700">{p.status}</td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${p.priority}%` }} />
                    </div>
                    <span className="text-sm text-slate-700">{p.priority}</span>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"><MoreHorizontal className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-slate-900 mb-4" style={{ fontWeight: 600 }}>Active Treatments</h3>
        <div className="space-y-3">
          {treatments.map((t) => (
            <div key={t.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ fontFamily: "monospace" }}>{t.id}</span>
                  <span className="text-sm text-slate-700">{t.type}</span>
                  <span className="text-xs text-slate-500">· {t.doctor} · {t.loc}</span>
                </div>
                <span className="text-sm text-slate-700">{t.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${t.color} transition-all`} style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
