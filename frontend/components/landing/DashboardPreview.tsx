"use client";

import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  Users,
  Clock,
  Brain,
  TrendingUp,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";

function MiniChart() {
  const data = [35, 45, 30, 55, 40, 65, 50, 70, 60, 75, 55, 80, 70, 85];
  const max = Math.max(...data);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 200},${50 - (v / max) * 45}`)
    .join(" ");

  return (
    <svg viewBox="0 0 200 55" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        points={points}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,50 ${points} 200,50`}
        fill="url(#chartGrad)"
        opacity="0.5"
      />
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <section className="relative py-28 bg-slate-50/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">
            Live Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Operations at a Glance
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            A unified command center for emergency healthcare operations.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
          style={{ perspective: "1200px" }}
        >
          {/* Outer glow */}
          <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/5 to-indigo-500/5 rounded-3xl blur-xl" />

          <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-slate-400 ml-3 font-mono">
                  hms.platform/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            {/* Dashboard body */}
            <div className="p-6 bg-slate-50/50">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    icon: Users,
                    label: "Active Patients",
                    value: "147",
                    change: "+12",
                    changeColor: "text-emerald-600",
                    bgColor: "bg-blue-50",
                    iconColor: "text-blue-600",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Critical Alerts",
                    value: "3",
                    change: "-2",
                    changeColor: "text-emerald-600",
                    bgColor: "bg-red-50",
                    iconColor: "text-red-500",
                  },
                  {
                    icon: Clock,
                    label: "Avg Wait Time",
                    value: "8m",
                    change: "-23%",
                    changeColor: "text-emerald-600",
                    bgColor: "bg-amber-50",
                    iconColor: "text-amber-600",
                  },
                  {
                    icon: Brain,
                    label: "AI Decisions",
                    value: "1,284",
                    change: "+156",
                    changeColor: "text-emerald-600",
                    bgColor: "bg-violet-50",
                    iconColor: "text-violet-600",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="bg-white rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <span className={`text-xs font-medium ${stat.changeColor}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Main content area */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Chart area */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        Patient Flow
                      </h4>
                      <p className="text-[11px] text-slate-400">Last 24 hours</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-slate-500">Admissions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Discharges</span>
                      </div>
                    </div>
                  </div>
                  <MiniChart />

                  {/* Mini bars */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {["ICU", "ER", "Ward A", "Ward B"].map((ward, i) => (
                      <div key={ward}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-500">{ward}</span>
                          <span className="font-medium text-slate-700">
                            {[82, 94, 67, 73][i]}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              [94][0] > 90
                                ? i === 1
                                  ? "bg-red-400"
                                  : "bg-blue-400"
                                : "bg-blue-400"
                            }`}
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${[82, 94, 67, 73][i]}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel - Recent alerts */}
                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Recent Alerts
                    </h4>
                    <span className="text-[10px] font-medium text-blue-600 cursor-pointer hover:underline">
                      View all
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        severity: "Critical",
                        msg: "Cardiac event — Bay 3",
                        time: "2m ago",
                        dot: "bg-red-500",
                        bg: "bg-red-50",
                      },
                      {
                        severity: "High",
                        msg: "SpO2 drop — Room 204",
                        time: "8m ago",
                        dot: "bg-amber-500",
                        bg: "bg-amber-50",
                      },
                      {
                        severity: "Medium",
                        msg: "BP trend abnormal — ICU-7",
                        time: "15m ago",
                        dot: "bg-blue-500",
                        bg: "bg-blue-50",
                      },
                      {
                        severity: "Low",
                        msg: "Lab results pending — P-1044",
                        time: "22m ago",
                        dot: "bg-slate-400",
                        bg: "bg-slate-50",
                      },
                    ].map((alert, i) => (
                      <motion.div
                        key={alert.msg}
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-lg ${alert.bg} border border-slate-100/50`}
                      >
                        <div className={`w-2 h-2 rounded-full ${alert.dot} mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-700 truncate">
                            {alert.msg}
                          </p>
                          <p className="text-[10px] text-slate-400">{alert.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
