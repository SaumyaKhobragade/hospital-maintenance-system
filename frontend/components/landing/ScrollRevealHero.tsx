"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollRevealHero({ sectionRef: externalSectionRef }: { sectionRef?: React.RefObject<HTMLDivElement | null> }) {
  const localSectionRef = useRef<HTMLDivElement>(null);
  const sectionRef = externalSectionRef || localSectionRef;
  const badgeRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const btnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      )
        .fromTo(
          h1Ref.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          "<0.15"
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "<0.15"
        )
        .fromTo(
          btnsRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "<0.15"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#faf7f4] via-[#f5f0eb] to-[#faf7f4] overflow-hidden"
    >
      {/* warm ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-amber-400/[0.03] blur-[120px] rounded-full" />
      </div>

      {/* subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,113,108,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
        {/* badge */}
        <div 
          ref={badgeRef} 
          className="mb-8 opacity-0"
          style={{ transform: "translateY(40px) scale(0.9)", transformOrigin: "center" }}
        >
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[13px] font-medium bg-teal-50/60 text-teal-700 border border-teal-200/40 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
            </span>
            Next-Generation Healthcare AI Platform
          </span>
        </div>

        {/* headline */}
        <h1
          ref={h1Ref}
          className="text-[clamp(2.4rem,5.5vw,5rem)] font-bold leading-[1.06] tracking-[-0.04em] text-stone-800 opacity-0"
          style={{ transform: "translateY(60px)" }}
        >
          AI-Powered Emergency
          <br />
          <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Healthcare Intelligence
          </span>
        </h1>

        {/* subheadline */}
        <p
          ref={subRef}
          className="mt-7 text-lg md:text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-light opacity-0"
          style={{ transform: "translateY(40px)" }}
        >
          Next-generation hospital operations, multilingual AI triage,
          intelligent emergency monitoring, and real-time clinical insights.
        </p>

        {/* buttons */}
        <div
          ref={btnsRef}
          className="mt-10 flex items-center justify-center gap-4 flex-wrap opacity-0"
          style={{ transform: "translateY(30px)" }}
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-stone-800 text-white rounded-xl font-semibold text-[15px] hover:bg-stone-700 transition-all shadow-lg shadow-stone-800/10 hover:-translate-y-0.5"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-white/80 text-stone-700 rounded-xl font-medium text-[15px] border border-stone-200/60 hover:bg-white hover:border-stone-300 backdrop-blur-sm transition-all hover:-translate-y-0.5 shadow-sm">
            <Play className="w-4 h-4 text-teal-600" />
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}
