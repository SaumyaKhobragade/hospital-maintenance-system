"use client";

import { motion } from "motion/react";
import {
  ClipboardList,
  Brain,
  ShieldAlert,
  ListOrdered,
  FileText,
  UserCheck,
  ChevronDown,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Patient Intake",
    description: "Multilingual voice + digital check-in captures patient data in real-time.",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "NLP and clinical models process symptoms, history, and vitals instantly.",
    color: "bg-indigo-500",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
  },
  {
    icon: ShieldAlert,
    title: "Risk Detection",
    description: "Early warning system flags deterioration patterns and critical conditions.",
    color: "bg-red-500",
    lightColor: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    icon: ListOrdered,
    title: "Queue Prioritization",
    description: "AI triage assigns dynamic priority based on severity and resource availability.",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    icon: FileText,
    title: "Clinical Summary",
    description: "Auto-generated clinical notes with structured data for physician review.",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    icon: UserCheck,
    title: "Human Verification",
    description: "Clinicians review, approve, and act on AI recommendations with full audit trail.",
    color: "bg-violet-500",
    lightColor: "bg-violet-50",
    textColor: "text-violet-600",
  },
];

export default function WorkflowSection() {
  return (
    <section className="relative py-28 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">
            System Workflow
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            From Intake to Action
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            Six intelligent stages that transform raw patient data into actionable clinical decisions.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-violet-200 -translate-x-1/2 hidden md:block" />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex items-center md:py-6 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Card */}
                <div
                  className={`flex-1 ${
                    i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"
                  }`}
                >
                  <motion.div
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="inline-block"
                  >
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow max-w-md inline-block text-left">
                      <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:flex-row-reverse md:text-right" : ""}`}>
                        <div
                          className={`w-10 h-10 rounded-xl ${step.lightColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <step.icon className={`w-5 h-5 ${step.textColor}`} />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                            Step {i + 1}
                          </span>
                          <h3 className="text-base font-semibold text-slate-900">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Center node */}
                <div className="hidden md:flex flex-shrink-0 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.1 + 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    <span className="text-xs font-bold">{i + 1}</span>
                  </motion.div>
                </div>

                {/* Empty spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
