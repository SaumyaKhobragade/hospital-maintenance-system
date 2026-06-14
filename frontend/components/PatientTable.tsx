"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown, MoreHorizontal, Filter, Phone, ChevronLeft, ChevronRight, Wifi } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSseStats } from "../lib/SseContext";
import { supabase } from "../lib/supabaseClient";

type Patient = {
  no: string;
  id: string;
  name: string;
  age: number;
  contact: string;
  joinDate: string;
  lastVisit: string;
  status: string;
  avatar: string;
};

const statusColor: Record<string, string> = {
  "Returning": "bg-blue-50 text-blue-700 border-blue-100",
  "New": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Critical": "bg-rose-50 text-rose-700 border-rose-100",
  "Waiting": "bg-orange-50 text-orange-700 border-orange-100",
  "Under Review": "bg-purple-50 text-purple-700 border-purple-100",
  "Discharged": "bg-gray-50 text-gray-700 border-gray-100",
  "Intake Completed": "bg-blue-50 text-blue-700 border-blue-100",
};

const tabs = ["All", "Active", "Inactive"];

export function PatientTable() {
  const stats = useSseStats();
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase.from("patients").select("*").limit(20);
      if (!error && data) {
        const mapped = data.map((p, i) => ({
          no: String(i + 1).padStart(2, "0"),
          id: p.id.split("-")[0].toUpperCase(),
          name: p.name || "Unknown",
          age: p.age || 0,
          contact: "+1 555-0000",
          joinDate: new Date(p.created_at).toLocaleDateString(),
          lastVisit: new Date(p.updated_at).toLocaleDateString(),
          status: p.status || "Waiting",
          avatar: p.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
        }));
        setPatients(mapped);
      }
    }
    fetchPatients();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-900" style={{ fontWeight: 600 }}>
              All Patients <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            {/* Live queue badge from SSE */}
            {stats && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" /> {stats.totalPatientsWaiting.toLocaleString()} waiting
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t}
                className={`px-3 py-1 rounded-md text-sm transition ${
                  t === "Active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700">
            All Status <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Sort:
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
            A-Z <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="px-5 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Find by name, email, or ID"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm outline-none focus:bg-white focus:border-blue-200"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700">
          Filter <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-y border-slate-100">
              <th className="px-5 py-3 text-left w-10"><input type="checkbox" className="rounded" /></th>
              <th className="py-3 text-left">No</th>
              <th className="py-3 text-left">ID</th>
              <th className="py-3 text-left">Patient Name</th>
              <th className="py-3 text-left">Age</th>
              <th className="py-3 text-left">Contact</th>
              <th className="py-3 text-left">Join Date</th>
              <th className="py-3 text-left">Last Visit</th>
              <th className="py-3 text-left">Status</th>
              <th className="py-3 text-left pr-5">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.no} className="border-b border-slate-50 hover:bg-slate-50/40 transition">
                <td className="px-5 py-4"><input type="checkbox" className="rounded" /></td>
                <td className="py-4 text-sm text-slate-500">{p.no}</td>
                <td className="py-4 text-sm text-slate-700" style={{ fontFamily: "monospace" }}>{p.id}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-7 h-7"><AvatarImage src={p.avatar} /><AvatarFallback>{p.name[0]}</AvatarFallback></Avatar>
                    <span className="text-sm text-slate-800">{p.name}</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-slate-700">{p.age}</td>
                <td className="py-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{p.contact}</span>
                </td>
                <td className="py-4 text-sm text-slate-500">{p.joinDate}</td>
                <td className="py-4 text-sm text-slate-700">{p.lastVisit}</td>
                <td className="py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${statusColor[p.status]}`}>{p.status}</span>
                </td>
                <td className="py-4 pr-5">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Rows per page
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
            12 <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-slate-500">1 of {stats ? Math.ceil(stats.totalPatientsWaiting / 12) : "—"}</span>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
