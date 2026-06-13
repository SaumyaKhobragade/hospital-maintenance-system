"use client";

import { Search, ChevronDown, MoreHorizontal, Filter, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Patient = {
  no: string;
  id: string;
  name: string;
  age: number;
  contact: string;
  joinDate: string;
  lastVisit: string;
  status: "Returning" | "New" | "Critical";
  avatar: string;
};

const patients: Patient[] = [
  { no: "01", id: "#JK75HT938476", name: "Aarav Rahman", age: 22, contact: "+1 618-856-3032", joinDate: "23 Dec 2026", lastVisit: "23 Dec 2026, 07:32 PM", status: "Returning", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80" },
  { no: "02", id: "#FD09763IU872", name: "Hasan Mahmud", age: 42, contact: "+1 618-856-3032", joinDate: "23 Dec 2026", lastVisit: "23 Dec 2026, 06:12 PM", status: "New", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80" },
  { no: "03", id: "#JT8765FK9876", name: "Sakil Mahmud", age: 32, contact: "+1 618-856-3032", joinDate: "23 Dec 2026", lastVisit: "23 Dec 2026, 05:24 PM", status: "Returning", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80" },
  { no: "04", id: "#FR8765J87654", name: "Rakibul Haque", age: 23, contact: "+1 618-856-3032", joinDate: "23 Dec 2026", lastVisit: "23 Dec 2026, 04:02 PM", status: "Critical", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" },
];

const statusColor: Record<Patient["status"], string> = {
  Returning: "bg-blue-50 text-blue-700 border-blue-100",
  New: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Critical: "bg-rose-50 text-rose-700 border-rose-100",
};

const tabs = ["All", "Active", "Inactive"];

export function PatientTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-900" style={{ fontWeight: 600 }}>
            All Patients <ChevronDown className="w-4 h-4 text-slate-400" />
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
                    <span className="text-sm text-slate-800">Dr. {p.name}</span>
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
          <span className="text-slate-500">1 of 246</span>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
