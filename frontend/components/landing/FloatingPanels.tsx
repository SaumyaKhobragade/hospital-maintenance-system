"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AlertTriangle,
  Brain,
  Users,
  Mic,
  Monitor,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  {
    icon: AlertTriangle,
    title: "Emergency Alert",
    subtitle: "Critical Priority",
    iconBg: "bg-rose-100/80",
    iconColor: "text-rose-600",
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-500">Risk Score</span>
          <span className="font-bold text-rose-600">92%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full w-[92%] bg-gradient-to-r from-rose-400 to-rose-500 rounded-full" />
        </div>
        <p className="text-[10px] text-stone-400">Cardiac event — Bay 3</p>
      </div>
    ),
    offsetX: -380,
    offsetY: -100,
  },
  {
    icon: Brain,
    title: "AI Summary",
    subtitle: "Auto-Generated",
    iconBg: "bg-teal-100/80",
    iconColor: "text-teal-700",
    content: (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-teal-50/60 rounded-lg p-2.5">
            <p className="text-[10px] text-stone-500">Active</p>
            <p className="text-sm font-bold text-stone-800">147</p>
          </div>
          <div className="flex-1 bg-emerald-50/60 rounded-lg p-2.5">
            <p className="text-[10px] text-stone-500">Stable</p>
            <p className="text-sm font-bold text-stone-800">89</p>
          </div>
        </div>
      </div>
    ),
    offsetX: 320,
    offsetY: -120,
  },
  {
    icon: Users,
    title: "Patient Queue",
    subtitle: "Live Feed",
    iconBg: "bg-amber-100/80",
    iconColor: "text-amber-700",
    content: (
      <div className="space-y-1.5">
        {[
          { id: "P-1042", sev: "Critical", dot: "bg-rose-500" },
          { id: "P-1043", sev: "High", dot: "bg-amber-500" },
          { id: "P-1044", sev: "Medium", dot: "bg-teal-500" },
        ].map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-stone-50/60 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              <span className="text-[10px] font-medium text-stone-700">{p.id}</span>
            </div>
            <span className="text-[10px] text-stone-400">{p.sev}</span>
          </div>
        ))}
      </div>
    ),
    offsetX: -320,
    offsetY: 120,
  },
  {
    icon: Mic,
    title: "Voice Intake",
    subtitle: "Multilingual",
    iconBg: "bg-violet-100/80",
    iconColor: "text-violet-600",
    content: (
      <div className="flex items-end gap-[3px] h-8 px-1">
        {[40, 70, 30, 85, 50, 65, 35, 75, 45, 80, 55, 40, 60, 35, 70].map(
          (h, i) => (
            <div
              key={i}
              className="flex-1 bg-violet-300/40 rounded-full transition-all"
              style={{ height: `${h}%` }}
            />
          )
        )}
      </div>
    ),
    offsetX: 350,
    offsetY: 100,
  },
  {
    icon: Monitor,
    title: "Telemetry",
    subtitle: "Real-time Vitals",
    iconBg: "bg-emerald-100/80",
    iconColor: "text-emerald-700",
    content: (
      <div className="space-y-1.5">
        {[
          { label: "HR", value: "72 bpm", dot: "bg-emerald-500" },
          { label: "SpO2", value: "98%", dot: "bg-teal-500" },
          { label: "BP", value: "120/80", dot: "bg-amber-500" },
        ].map((v) => (
          <div key={v.label} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              <span className="text-stone-500">{v.label}</span>
            </div>
            <span className="font-medium text-stone-700">{v.value}</span>
          </div>
        ))}
      </div>
    ),
    offsetX: 0,
    offsetY: 160,
  },
];

export default function FloatingPanels() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        /* scroll-driven entrance */
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            scale: 0.85,
            rotateX: 15,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "top 20%",
              scrub: 0.8,
            },
            delay: i * 0.06,
          }
        );

        /* continuous floating */
        gsap.to(card, {
          y: `+=${8 + i * 3}`,
          duration: 3 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 bg-gradient-to-b from-[#faf7f4] via-[#f3ede6] to-[#faf7f4] overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* warm ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-400/[0.03] blur-[150px]" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        {/* section header */}
        <div className="text-center mb-20">
          <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-teal-700/50 mb-3">
            AI Operations Layer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
            Intelligent Healthcare Panels
          </h2>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            Live AI-driven interfaces monitoring every aspect of emergency operations.
          </p>
        </div>

        {/* panel grid */}
        <div className="relative min-h-[500px] hidden md:block">
          {panels.map((panel, i) => (
            <div
              key={panel.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="absolute opacity-0"
              style={{
                left: `calc(50% + ${panel.offsetX}px)`,
                top: `calc(50% + ${panel.offsetY}px)`,
                transform: "translate(-50%, -50%) translateY(80px) scale(0.85) rotateX(15deg)",
                willChange: "transform, opacity",
              }}
            >
              <div className="w-[230px] rounded-2xl border border-stone-200/50 bg-white/70 backdrop-blur-xl p-4 shadow-[0_8px_40px_rgba(120,113,108,0.06)]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${panel.iconBg} flex items-center justify-center`}>
                    <panel.icon className={`w-4 h-4 ${panel.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-700">{panel.title}</p>
                    <p className="text-[10px] text-stone-400">{panel.subtitle}</p>
                  </div>
                </div>
                {panel.content}
              </div>
            </div>
          ))}
        </div>

        {/* mobile fallback */}
        <div className="md:hidden grid gap-4">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className="rounded-2xl border border-stone-200/50 bg-white/70 backdrop-blur-xl p-4 shadow-[0_8px_40px_rgba(120,113,108,0.06)]"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg ${panel.iconBg} flex items-center justify-center`}>
                  <panel.icon className={`w-4 h-4 ${panel.iconColor}`} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-stone-700">{panel.title}</p>
                  <p className="text-[10px] text-stone-400">{panel.subtitle}</p>
                </div>
              </div>
              {panel.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
