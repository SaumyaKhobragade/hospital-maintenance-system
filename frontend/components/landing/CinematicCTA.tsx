"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CinematicCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            end: "top 35%",
            scrub: 0.8,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-40 overflow-hidden bg-[#faf7f4]"
    >
      {/* gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-teal-500/[0.04] blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
      </div>

      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div ref={contentRef} className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center opacity-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-white/70 text-teal-800 border border-stone-200/60 backdrop-blur-sm mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Ready to Transform Healthcare
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-800 tracking-tight leading-[1.08]">
          Transform Emergency
          <br />
          <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Healthcare Operations
          </span>
        </h2>

        <p className="mt-6 text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
          Join leading hospitals using AI to reduce wait times, improve outcomes,
          and save lives.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-stone-800 text-white rounded-xl font-semibold text-[15px] hover:bg-stone-900 transition-all shadow-lg shadow-stone-800/10 hover:-translate-y-0.5"
          >
            Launch Platform
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button className="inline-flex items-center gap-2.5 px-8 py-4 bg-white/80 text-stone-700 rounded-xl font-semibold text-[15px] border border-stone-200/60 hover:bg-white/90 backdrop-blur-sm transition-all hover:-translate-y-0.5">
            Request Demo
          </button>
        </div>
      </div>
    </section>
  );
}
