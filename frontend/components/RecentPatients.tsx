"use client";

import { useState, useEffect } from "react";
import { MoreVertical, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "../lib/supabaseClient";

interface PatientRow {
  name: string;
  time: string;
  status: string;
  avatar: string;
}

const statusColor: Record<string, string> = {
  New: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Returning: "bg-blue-50 text-blue-700 border-blue-100",
};

export function RecentPatients() {
  const [rows, setRows] = useState<PatientRow[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(4);
      if (data) {
        const mapped = data.map((d: any) => ({
          name: d.name || "Patient " + d.id.substring(0, 4),
          time: d.created_at ? new Date(d.created_at).toLocaleTimeString() : "Just now",
          status: d.status === "Waiting" ? "New" : "Returning",
          avatar: d.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80"
        }));
        setRows(mapped);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Recent Patients</h3>
        <button className="text-slate-400 hover:text-slate-700"><MoreVertical className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pb-3 border-b border-slate-100">
        <span className="flex items-center gap-1">Patient Name <ChevronDown className="w-3 h-3" /></span>
        <span>Registered</span>
        <span className="flex items-center gap-1">Status <ChevronDown className="w-3 h-3" /></span>
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2.5 flex-1">
              <Avatar className="w-8 h-8"><AvatarImage src={r.avatar} /><AvatarFallback>{r.name[0]}</AvatarFallback></Avatar>
              <span className="text-sm text-slate-800">{r.name}</span>
            </div>
            <span className="text-sm text-slate-500 flex-1">{r.time}</span>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${statusColor[r.status]}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
