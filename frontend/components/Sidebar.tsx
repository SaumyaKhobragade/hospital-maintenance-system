"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Home,
  Activity,
  Users,
  AlertTriangle,
  Sliders,
  GitBranch,
  UserPlus,
  HeartPulse,
  BrainCircuit,
  Mic,
  Terminal,
  UsersRound,
  ScanSearch,
  FileText,
  LogOut,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  to: string;
}
  
interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const navigationGroups: SidebarGroup[] = [
  {
    title: "MAIN",
    items: [
      { icon: Home, label: "Overview", to: "/dashboard" },
      { icon: UsersRound, label: "Patients", to: "/dashboard/patients" },
      { icon: Users, label: "Triage Queue", to: "/dashboard/queue-details" },
      { icon: AlertTriangle, label: "Alerts", to: "/dashboard/alerts" },
      { icon: UserPlus, label: "Add Patient", to: "/dashboard/add-patient" }
    ]
  },
  {
    title: "AI SYSTEMS",
    items: [
      { icon: BrainCircuit, label: "AI Clinical Summary", to: "/dashboard/ai-clinical-summary" },
      { icon: Mic, label: "Voice Check-In", to: "/dashboard/voice-checkin" },
      { icon: ScanSearch, label: "RAG History", to: "/dashboard/rag" },
      { icon: FileText, label: "Combined Report", to: "/dashboard/combined-report" },
      { icon: Terminal, label: "AI Telemetry", to: "/dashboard/telemetry" }
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { icon: GitBranch, label: "Decision Monitor", to: "/dashboard/decision-monitor" },
      { icon: Sliders, label: "Policy Config", to: "/dashboard/policy-config" },
      { icon: Activity, label: "Simulation", to: "/dashboard/simulation" }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Auto-collapse on smaller screen sizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col py-6 self-start sticky top-24 shrink-0 overflow-hidden select-none"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {/* Header Logotype & Collapse trigger */}
        <div className={`flex items-center w-full px-4 mb-5 shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2.5 pl-1 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-200">
                <HeartPulse className="w-4.5 h-4.5" />
              </div>
              <span className="text-base tracking-wider text-slate-900 font-bold">HMS Admin</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-200 shrink-0">
              <HeartPulse className="w-4.5 h-4.5" />
            </Link>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mb-4 p-1 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer w-8 h-8 mx-auto flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        )}

        {/* Main navigation list container */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 py-1 ${isCollapsed ? "px-3 items-center" : "px-3 pr-1"}`}>
          {navigationGroups.map((group, idx) => (
            <div key={idx} className={`flex flex-col gap-1 shrink-0 ${isCollapsed ? "items-center w-full" : "w-full"}`}>
              {!isCollapsed ? (
                <span className="text-[10px] uppercase font-bold text-slate-455 tracking-wider px-3 mb-1 block">
                  {group.title}
                </span>
              ) : (
                <div className="border-t border-slate-100 my-1 w-full" />
              )}

              {group.items.map((it) => {
                const Icon = it.icon;
                const isActive = it.to === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(it.to);

                return (
                  <div key={it.to} className="relative group flex items-center justify-center w-full">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={it.to}
                          className={`flex items-center transition-all ${
                            isCollapsed
                              ? `w-10 h-10 rounded-xl justify-center ${
                                  isActive ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-455 hover:bg-slate-50 hover:text-slate-700"
                                }`
                              : `gap-3 w-full h-10 px-3 rounded-xl ${
                                  isActive ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-455 hover:bg-slate-50 hover:text-slate-700"
                                }`
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          {!isCollapsed && (
                            <span className="text-sm font-semibold truncate leading-none mt-0.5">
                              {it.label}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" sideOffset={12}>
                          {it.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom section divider */}
        <div className="border-t border-slate-100 my-3 w-full shrink-0" />

        {/* Bottom profile info */}
        <div className={`flex flex-col gap-1 shrink-0 ${isCollapsed ? "px-3 items-center" : "px-3"}`}>
          {/* Profile Card and Sign out */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 mt-2 text-left">
              <div className="flex items-center gap-2 truncate">
                <Avatar className="w-7 h-7 border border-slate-200 shadow-sm shrink-0">
                  <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate leading-tight">
                  <span className="text-xs font-bold text-slate-800 truncate">Dr. Hasan</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Chief</span>
                </div>
              </div>
              <button
                onClick={() => alert("Signing out...")}
                className="text-slate-400 hover:text-rose-600 transition p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative group flex items-center justify-center py-2 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar
                    onClick={() => alert("Signing out...")}
                    className="w-8 h-8 border border-slate-200 shadow-sm cursor-pointer"
                  >
                    <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80" />
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Dr. Hasan (Sign Out)
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
