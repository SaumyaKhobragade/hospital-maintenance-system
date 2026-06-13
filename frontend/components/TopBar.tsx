"use client";

import { Search, Bell, Settings, Plus, HeartPulse } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const actions = ["Appointment", "Patient", "Invoice", "Prescription"];

export function TopBar() {
  return (
    <div className="flex items-center justify-between gap-4 bg-white px-6 py-3.5 shadow-sm border border-slate-100/80 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      {/* Left section: Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200">
          <HeartPulse className="w-5 h-5" />
        </div>
        <span className="text-lg tracking-wider text-slate-900" style={{ fontWeight: 700 }}>HMS</span>
      </div>

      {/* Middle section: Search Bar */}
      <div className="flex-1 max-w-lg relative mx-8 hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search patients, hospitals, alerts..."
          className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/50 text-sm outline-none focus:bg-white focus:border-blue-500/35 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800"
        />
      </div>

      {/* Quick Actions */}
      <div className="hidden lg:flex items-center gap-2">
        {actions.map((label) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            {label}
          </button>
        ))}
      </div>

      {/* Right section: Notifications, Settings, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>
        <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
        <div className="flex items-center gap-3 cursor-pointer group">
          <Avatar className="w-10 h-10 ring-2 ring-blue-50 transition-all group-hover:ring-blue-100 shadow-sm">
            <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-none mb-1">Dr. Hasan</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Chief Doctor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
