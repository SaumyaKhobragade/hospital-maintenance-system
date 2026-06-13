"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ClipboardList,
  Brain,
  ShieldAlert,
  ListOrdered,
  FileText,
  UserCheck,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: ClipboardList,
    title: "Patient Intake",
    desc: "Multilingual voice + digital check-in captures data in real-time.",
    color: "bg-teal-600",
    lightBg: "bg-teal-100/80",
    glow: "shadow-teal-500/10",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    desc: "NLP and clinical models process symptoms, history, and vitals.",
    color: "bg-emerald-600",
    lightBg: "bg-emerald-100/80",
    glow: "shadow-emerald-500/10",
  },
  {
    icon: ShieldAlert,
    title: "Risk Detection",
    desc: "Early warning system flags deterioration and critical conditions.",
    color: "bg-rose-500",
    lightBg: "bg-rose-100/80",
    glow: "shadow-rose-500/10",
  },
  {
    icon: ListOrdered,
    title: "Queue Prioritization",
    desc: "Dynamic priority based on severity and resource availability.",
    color: "bg-amber-600",
    lightBg: "bg-amber-100/80",
    glow: "shadow-amber-500/10",
  },
  {
    icon: FileText,
    title: "Clinical Summary",
    desc: "Auto-generated clinical notes with structured physician data.",
    color: "bg-stone-600",
    lightBg: "bg-stone-100/80",
    glow: "shadow-stone-500/10",
  },
  {
    icon: UserCheck,
    title: "Human Verification",
    desc: "Clinicians review and approve AI recommendations with full audit trail.",
    color: "bg-violet-500",
    lightBg: "bg-violet-100/80",
    glow: "shadow-violet-500/10",
  },
];

export default function CinematicWorkflow() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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

      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 60%",
            scrub: 1,
          },
        }
      );

      stepsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, x: i % 2 === 0 ? -50 : 50, scale: 0.92 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
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
      id="workflow"
      className="relative py-32 bg-gradient-to-b from-[#faf7f4] via-white to-[#faf7f4] overflow-hidden"
    >
      <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-20 opacity-0">
          <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-teal-700/50 mb-3">
            System Workflow
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
            From Intake to Action
          </h2>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            Six intelligent stages transforming raw patient data into actionable clinical decisions.
          </p>
        </div>

        <div className="relative">
          {/* grow line */}
          <div
            ref={lineRef}
            className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-teal-300/30 via-stone-300/20 to-violet-300/30 -translate-x-1/2 origin-top hidden md:block"
          />

          <div className="space-y-6 md:space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.title}
                ref={(el) => { stepsRef.current[i] = el; }}
                className={`relative flex items-center md:py-8 opacity-0 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"}`}>
                  <div className="inline-block text-left">
                    <div className={`bg-white/80 border border-stone-200/50 backdrop-blur-sm rounded-2xl p-6 max-w-md hover:bg-white hover:shadow-lg hover:shadow-stone-200/30 transition-all duration-300 shadow-sm ${step.glow}`}>
                      <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                        <div className={`w-10 h-10 rounded-xl ${step.lightBg} flex items-center justify-center flex-shrink-0`}>
                          <step.icon className="w-5 h-5 text-stone-600" />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-stone-300 uppercase tracking-wider">
                            Step {i + 1}
                          </span>
                          <h3 className="text-base font-semibold text-stone-800">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>

                {/* center node */}
                <div className="hidden md:flex flex-shrink-0 relative z-10">
                  <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white shadow-lg ${step.glow}`}>
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                </div>

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
