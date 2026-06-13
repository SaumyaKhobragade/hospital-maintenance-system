"use client";

import { Home, Activity, Users, AlertTriangle, FileText, Sliders, GitBranch, UserPlus, HeartPulse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { icon: Home, label: "Dashboard", to: "/dashboard" },
  { icon: Activity, label: "Simulation", to: "/dashboard/simulation" },
  { icon: Users, label: "Queue", to: "/dashboard/queue-details" },
  { icon: GitBranch, label: "Decisions", to: "/dashboard/decision-monitor" },
  { icon: AlertTriangle, label: "Alerts", to: "/dashboard/alerts" },
  { icon: Sliders, label: "Policies", to: "/dashboard/policy-config" },
  { icon: UserPlus, label: "Add Patient", to: "/dashboard/add-patient" },
  { icon: FileText, label: "Reports", to: "/dashboard/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center py-6 gap-1 self-start sticky top-23">
      <Link href="/" className="mb-4 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200">
        <HeartPulse className="w-5 h-5" />
      </Link>
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = it.to === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(it.to);

        return (
          <Link
            key={it.to}
            href={it.to}
            title={it.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
          >
            <Icon className="w-[18px] h-[18px]" />
          </Link>
        );
      })}
    </aside>
  );
}
