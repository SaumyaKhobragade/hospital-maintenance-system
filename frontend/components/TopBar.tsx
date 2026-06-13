"use client";

import { Search, Bell, Settings, Plus, HeartPulse } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const actions = ["Appointment", "Patient", "Invoice", "Prescription"];

export function TopBar() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 sticky top-0">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
          <HeartPulse className="w-4 h-4" />
        </div>
        <span className="tracking-wider text-slate-900" style={{ fontWeight: 700 }}>HMS</span>
      </div>

      <div className="flex-1 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search patients, hospitals, alerts..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm outline-none focus:bg-white focus:border-blue-200 transition"
        />
      </div>

      <div className="flex items-center gap-2">
        {actions.map((label) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-2">
        <button className="relative w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>
        <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        <Avatar className="w-10 h-10 ring-2 ring-white shadow-md">
          <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120" />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
