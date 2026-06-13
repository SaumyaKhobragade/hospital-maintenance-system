"use client";

import { motion } from "motion/react";
import {
  Brain,
  Mic,
  Database,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Clinical Summary",
    description:
      "Automated clinical documentation with context-aware summarization. Reduces physician charting time by 60% while maintaining accuracy.",
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/8",
    iconColor: "text-blue-600",
    stats: [
      { label: "Accuracy", value: "99.2%" },
      { label: "Time Saved", value: "60%" },
    ],
  },
  {
    icon: Mic,
    title: "Voice Check-In",
    description:
      "Multilingual voice intake with real-time transcription and translation. Supports 40+ languages with dialect-aware processing.",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/8",
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
    color: "from-sky-500 to-cyan-500",
    bgColor: "bg-sky-500/8",
    iconColor: "text-sky-600",
    stats: [
      { label: "Sources", value: "12M+" },
      { label: "Recall", value: "97%" },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Emergency Alerts",
    description:
      "AI-driven early warning system that detects patient deterioration patterns. Automated escalation with configurable severity thresholds.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/8",
    iconColor: "text-amber-600",
    stats: [
      { label: "Detection", value: "98.5%" },
      { label: "Lead Time", value: "6h" },
    ],
  },
  {
    icon: Activity,
    title: "AI Telemetry",
    description:
      "Continuous patient monitoring with anomaly detection. Integrates with bedside devices for real-time vitals analysis and trend prediction.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/8",
    iconColor: "text-emerald-600",
    stats: [
      { label: "Devices", value: "200+" },
      { label: "Uptime", value: "99.99%" },
    ],
  },
];

export default function AIFeatures() {
  return (
    <section className="relative py-28 bg-slate-50/50">
      {/* Subtle gradient background */}
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
            AI Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Intelligent Healthcare Operations
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Five interconnected AI systems that transform how emergency departments operate.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group"
            >
              <div
                className={`relative rounded-2xl border border-slate-100 bg-white p-8 md:p-10 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  i % 2 === 0 ? "" : ""
                }`}
              >
                {/* Gradient edge glow */}
                <div
                  className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Icon + Title */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-slate-500 leading-relaxed max-w-xl">
                      {feature.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 md:gap-6 flex-shrink-0">
                    {feature.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-slate-50/80 rounded-xl px-5 py-3 text-center min-w-[90px]"
                      >
                        <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
