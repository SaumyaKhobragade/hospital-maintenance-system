"use client";

import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const items = [
  { time: "04:02 PM", who: "Dr. Rahman", action: "new prescription added for", target: "Ab Rahman", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80" },
  { time: "03:52 PM", who: "Dr. Hasan Mahmud", action: "Completed a follow-up visit with", target: "Fahad Ahmod", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80" },
  { time: "03:40 PM", who: "Dr. Sakil Mahmud", action: "Registered a new patient", target: "", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80" },
  { time: "03:16 PM", who: "Dr. Rakibul Haque", action: "Appointment rescheduled for", target: "Rahabi Khan • New Time: Dec 31 2026, 04:02 PM", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" },
  { time: "03:02 PM", who: "Dr. Siam Ahmod", action: "Completed a check-up visit with", target: "Sarwar Hossain", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80" },
];

export function RecentActivity() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Recent Activity</h3>
        <button className="text-slate-400 hover:text-slate-700"><MoreVertical className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-xs text-slate-400 mt-1 w-14 shrink-0">{it.time}</span>
            <Avatar className="w-8 h-8 shrink-0"><AvatarImage src={it.avatar} /><AvatarFallback>{it.who[0]}</AvatarFallback></Avatar>
            <p className="text-sm text-slate-600 leading-snug">
              <span className="text-slate-900" style={{ fontWeight: 600 }}>{it.who}</span>
              <span> - {it.action} </span>
              {it.target && <span className="text-slate-900" style={{ fontWeight: 600 }}>{it.target}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
