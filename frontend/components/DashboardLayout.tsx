"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="flex flex-col gap-5">
        <TopBar />
        <div className="flex gap-5 pl-6 pr-6 pb-6">
          <Sidebar />
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
