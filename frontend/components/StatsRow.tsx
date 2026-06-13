"use client";

import { Users, UserPlus, Activity, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: any;
  iconColor: string;
};

const stats: Stat[] = [
  { label: "Patients Waiting", value: "8,322", trend: "-12%", trendUp: false, icon: Users, iconColor: "bg-blue-50 text-blue-600" },
  { label: "New Arrivals", value: "212", trend: "+05%", trendUp: true, icon: UserPlus, iconColor: "bg-emerald-50 text-emerald-600" },
  { label: "Active Doctors", value: "442", trend: "+32%", trendUp: true, icon: Activity, iconColor: "bg-violet-50 text-violet-600" },
  { label: "Overloaded Sites", value: "6,733", trend: "+62%", trendUp: true, icon: AlertTriangle, iconColor: "bg-amber-50 text-amber-600" },
];

export function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        const TrendIcon = s.trendUp ? TrendingUp : TrendingDown;
        return (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-slate-500">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-slate-900 mb-3" style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1 }}>{s.value}</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                s.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                <TrendIcon className="w-3 h-3" />
                {s.trend}
              </span>
              <span className="text-xs text-slate-400">vs last week</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
