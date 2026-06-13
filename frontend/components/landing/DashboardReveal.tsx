"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Users,
  AlertTriangle,
  Clock,
  Brain,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function MiniChart() {
  const data = [35, 45, 30, 55, 40, 65, 50, 70, 60, 75, 55, 80, 70, 85];
  const max = Math.max(...data);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 200},${50 - (v / max) * 45}`)
    .join(" ");

  return (
    <svg viewBox="0 0 200 55" className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(13,148,136)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(13,148,136)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,50 ${points} 200,50`}
        fill="url(#dashGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="rgb(13,148,136)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* header */
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            end: "top 55%",
            scrub: 0.6,
          },
        }
      );

      /* dashboard perspective entrance */
      gsap.fromTo(
        dashRef.current,
        {
          opacity: 0,
          y: 100,
          rotateX: 12,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          scrollTrigger: {
            trigger: dashRef.current,
            start: "top 90%",
            end: "top 40%",
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="dashboard"
      className="relative py-32 bg-gradient-to-b from-[#faf7f4] via-[#f3ede6] to-[#faf7f4] overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/[0.03] blur-[160px] rounded-full" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-teal-700/50 mb-3">
            Live Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
            Operations at a Glance
          </h2>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            A unified command center for emergency healthcare operations.
          </p>
        </div>

        <div
          ref={dashRef}
          className="relative opacity-0"
          style={{ perspective: "1400px", willChange: "transform, opacity" }}
        >
          {/* outer glow */}
          <div className="absolute -inset-6 bg-gradient-to-b from-teal-500/[0.04] to-emerald-500/[0.02] rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl border border-stone-200/60 bg-white/70 backdrop-blur-sm shadow-2xl shadow-stone-200/40 overflow-hidden">
            {/* browser chrome */}
            <div className="flex items-center justify-between px-5 py-3 bg-stone-50/50 border-b border-stone-200/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                </div>
                <span className="text-[11px] text-stone-500 ml-3 font-mono">
                  hms.platform/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* dashboard body */}
            <div className="p-6 bg-[#fcfaf7]">
              {/* stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  {
                    icon: Users,
                    label: "Active Patients",
                    value: "147",
                    change: "+12",
                    iconBg: "bg-teal-500/10",
                    iconColor: "text-teal-600",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Critical Alerts",
                    value: "3",
                    change: "-2",
                    iconBg: "bg-rose-500/10",
                    iconColor: "text-rose-600",
                  },
                  {
                    icon: Clock,
                    label: "Avg Wait Time",
                    value: "8m",
                    change: "-23%",
                    iconBg: "bg-amber-500/10",
                    iconColor: "text-amber-600",
                  },
                  {
                    icon: Brain,
                    label: "AI Decisions",
                    value: "1,284",
                    change: "+156",
                    iconBg: "bg-violet-500/10",
                    iconColor: "text-violet-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white/80 border border-stone-200/50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                        <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600">
                        {s.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800">{s.value}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* main content */}
              <div className="grid lg:grid-cols-3 gap-3">
                {/* chart */}
                <div className="lg:col-span-2 bg-white/80 border border-stone-200/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700">Patient Flow</h4>
                      <p className="text-[10px] text-stone-400">Last 24 hours</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="text-stone-500">Admissions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-stone-500">Discharges</span>
                      </div>
                    </div>
                  </div>
                  <MiniChart />

                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      { ward: "ICU", pct: 82 },
                      { ward: "ER", pct: 94 },
                      { ward: "Ward A", pct: 67 },
                      { ward: "Ward B", pct: 73 },
                    ].map((w) => (
                      <div key={w.ward}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-stone-500">{w.ward}</span>
                          <span className="font-medium text-stone-600">{w.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              w.pct > 90 ? "bg-rose-500/70" : "bg-teal-600/60"
                            }`}
                            style={{ width: `${w.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* alerts */}
                <div className="bg-white/80 border border-stone-200/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-stone-700">Recent Alerts</h4>
                    <span className="text-[10px] font-medium text-teal-600 cursor-pointer">
                      View all
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { msg: "Cardiac event — Bay 3", time: "2m", dot: "bg-rose-500", bg: "bg-rose-50/70" },
                      { msg: "SpO2 drop — Room 204", time: "8m", dot: "bg-amber-500", bg: "bg-amber-50/70" },
                      { msg: "BP trend — ICU-7", time: "15m", dot: "bg-teal-500", bg: "bg-teal-50/70" },
                      { msg: "Lab pending — P-1044", time: "22m", dot: "bg-stone-400", bg: "bg-stone-50/70" },
                    ].map((a) => (
                      <div key={a.msg} className={`flex items-start gap-3 p-3 rounded-lg ${a.bg} border border-stone-100`}>
                        <div className={`w-2 h-2 rounded-full ${a.dot} mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-stone-700 truncate">{a.msg}</p>
                          <p className="text-[10px] text-stone-400">{a.time} ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
