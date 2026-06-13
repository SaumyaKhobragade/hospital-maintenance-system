"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden bg-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient mesh */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-white/5 text-blue-300 border border-white/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Ready to Transform Healthcare
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            Transform Emergency
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Healthcare Operations
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join leading hospitals using AI to reduce wait times, improve outcomes,
            and save lives.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-[15px] hover:bg-slate-100 transition-all shadow-lg shadow-white/10 hover:-translate-y-0.5"
            >
              Launch Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button className="inline-flex items-center gap-2.5 px-8 py-4 bg-white/5 text-white rounded-xl font-semibold text-[15px] border border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              Request Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
