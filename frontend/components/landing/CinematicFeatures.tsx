"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Brain,
  Mic,
  Database,
  AlertTriangle,
  Activity,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Brain,
    title: "AI Clinical Summary",
    description:
      "Automated clinical documentation with context-aware summarization. Reduces physician charting time by 60% while maintaining diagnostic accuracy.",
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-100/80",
    iconColor: "text-teal-700",
    stats: [
      { label: "Accuracy", value: "99.2%" },
      { label: "Time Saved", value: "60%" },
    ],
  },
  {
    icon: Mic,
    title: "Voice Check-In",
    description:
      "Multilingual voice intake with real-time transcription and dialect-aware processing. Supports 40+ languages natively.",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-100/80",
    iconColor: "text-violet-600",
    stats: [
      { label: "Languages", value: "40+" },
      { label: "Latency", value: "<2s" },
    ],
  },
  {
    icon: Database,
    title: "RAG Retrieval",
    description:
      "Retrieval-augmented generation for clinical guidelines, drug interactions, and patient history. Evidence-based recommendations in seconds.",
    color: "from-stone-400 to-stone-500",
    bgColor: "bg-stone-100/80",
    iconColor: "text-stone-600",
    stats: [
      { label: "Sources", value: "12M+" },
      { label: "Recall", value: "97%" },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Emergency Alerts",
    description:
      "AI-driven early warning system that detects deterioration patterns. Automated escalation with configurable severity thresholds.",
    color: "from-amber-400 to-amber-500",
    bgColor: "bg-amber-100/80",
    iconColor: "text-amber-700",
    stats: [
      { label: "Detection", value: "98.5%" },
      { label: "Lead Time", value: "6h" },
    ],
  },
  {
    icon: Activity,
    title: "AI Telemetry",
    description:
      "Continuous patient monitoring with anomaly detection. Integrates with bedside devices for real-time vitals analysis.",
    color: "from-emerald-400 to-teal-500",
    bgColor: "bg-emerald-100/80",
    iconColor: "text-emerald-700",
    stats: [
      { label: "Devices", value: "200+" },
      { label: "Uptime", value: "99.99%" },
    ],
  },
];

export default function CinematicFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 50 },
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

      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              end: "top 60%",
              scrub: 0.6,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-32 bg-gradient-to-b from-[#faf7f4] via-[#f3ede6] to-[#faf7f4] overflow-hidden"
    >
      {/* ambient lighting */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-teal-400/[0.02] blur-[150px] rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-amber-300/[0.02] blur-[120px] rounded-full" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-teal-700/50 mb-3">
            AI Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
            Intelligent Healthcare Operations
          </h2>
          <p className="mt-4 text-lg text-stone-500 max-w-2xl mx-auto">
            Five interconnected AI systems that transform emergency department workflows.
          </p>
        </div>

        <div className="grid gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="group opacity-0"
            >
              <div className="relative rounded-2xl border border-stone-200/50 bg-white/70 backdrop-blur-sm p-8 md:p-10 hover:bg-white hover:shadow-lg hover:shadow-stone-200/30 transition-all duration-500 overflow-hidden">
                {/* left edge glow */}
                <div
                  className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-70 transition-opacity duration-500`}
                />
                {/* hover glow */}
                <div
                  className={`absolute -top-20 -left-20 w-[200px] h-[200px] bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.03] blur-[80px] transition-opacity duration-500`}
                />

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${f.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-stone-800">{f.title}</h3>
                    </div>
                    <p className="text-stone-500 leading-relaxed max-w-xl">{f.description}</p>
                  </div>

                  <div className="flex gap-4 flex-shrink-0">
                    {f.stats.map((s) => (
                      <div
                        key={s.label}
                        className="bg-stone-50/80 border border-stone-100 rounded-xl px-5 py-3 text-center min-w-[90px]"
                      >
                        <p className="text-xl font-bold text-stone-800">{s.value}</p>
                        <p className="text-[10px] text-stone-400 font-medium mt-0.5 uppercase tracking-wider">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
