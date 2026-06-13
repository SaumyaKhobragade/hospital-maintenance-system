"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  Brain,
  AlertTriangle,
  Mic,
  Monitor,
  Users,
  Zap,
  ArrowRight,
  Play,
  Shield,
} from "lucide-react";

function FloatingCard({
  children,
  className = "",
  delay = 0,
  duration = 6,
  offsetX = 0,
  offsetY = 0,
  mouseX,
  mouseY,
  depth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  offsetX?: number;
  offsetY?: number;
  mouseX: ReturnType<typeof useMotionValue>;
  mouseY: ReturnType<typeof useMotionValue>;
  depth?: number;
}) {
  const x = useTransform(mouseX, [-0.5, 0.5], [-15 * depth, 15 * depth]);
  const y = useTransform(mouseY, [-0.5, 0.5], [-10 * depth, 10 * depth]);
  const springX = useSpring(x, { stiffness: 80, damping: 30 });
  const springY = useSpring(y, { stiffness: 80, damping: 30 });

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        x: springX,
        y: springY,
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        scale: { duration: 0.8, delay },
        y: {
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Animated gradient lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#475569" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80"
    >
      <AnimatedGridBackground />

      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[120px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-[100px]"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-300/8 blur-[140px]"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-40">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-medium bg-blue-50/80 text-blue-700 border border-blue-100/60 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              Next-Generation Healthcare AI Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.035em] text-slate-900"
          >
            AI-Powered Emergency
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 bg-clip-text text-transparent">
              Healthcare Intelligence
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-7 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Next-generation hospital operations, triage automation, multilingual
            voice intake, and AI-assisted clinical intelligence.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-medium text-[15px] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 hover:-translate-y-0.5"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-slate-700 rounded-xl font-medium text-[15px] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all hover:-translate-y-0.5 shadow-sm">
              <Play className="w-4 h-4 text-blue-600" />
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Floating Cards */}
        <div className="relative h-[300px] md:h-[350px] mt-8 hidden md:block">
          {/* AI Alert Card - Top Left */}
          <FloatingCard
            mouseX={mouseX}
            mouseY={mouseY}
            depth={2.2}
            offsetX={-420}
            offsetY={-120}
            delay={0.6}
            duration={7}
            className="z-20"
          >
            <GlassPanel className="p-4 w-[220px]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">AI Alert</p>
                  <p className="text-[10px] text-slate-400">Critical Priority</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Risk Score</span>
                  <span className="text-[11px] font-bold text-red-500">92%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Cardiac event detected — Bay 3
                </p>
              </div>
            </GlassPanel>
          </FloatingCard>

          {/* Patient Summary - Top Right */}
          <FloatingCard
            mouseX={mouseX}
            mouseY={mouseY}
            depth={1.8}
            offsetX={300}
            offsetY={-140}
            delay={0.8}
            duration={8}
            className="z-20"
          >
            <GlassPanel className="p-4 w-[230px]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">Patient Summary</p>
                  <p className="text-[10px] text-slate-400">AI-Generated</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 bg-blue-50/60 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400">Active</p>
                    <p className="text-sm font-bold text-slate-800">147</p>
                  </div>
                  <div className="flex-1 bg-emerald-50/60 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400">Discharged</p>
                    <p className="text-sm font-bold text-slate-800">89</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400">3 new admissions</span>
                </div>
              </div>
            </GlassPanel>
          </FloatingCard>

          {/* Voice Intake - Left Middle */}
          <FloatingCard
            mouseX={mouseX}
            mouseY={mouseY}
            depth={1.5}
            offsetX={-380}
            offsetY={80}
            delay={1}
            duration={6.5}
            className="z-10"
          >
            <GlassPanel className="p-4 w-[200px]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">Voice Intake</p>
                  <p className="text-[10px] text-slate-400">Multilingual</p>
                </div>
              </div>
              {/* Waveform */}
              <div className="flex items-end gap-[3px] h-8 px-1">
                {[40, 65, 35, 80, 50, 70, 30, 60, 45, 75, 55, 40, 68, 35, 58].map(
                  (h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-violet-400/40 rounded-full"
                      animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.3}%`] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: "easeInOut",
                      }}
                    />
                  )
                )}
              </div>
            </GlassPanel>
          </FloatingCard>

          {/* Telemetry - Right Bottom */}
          <FloatingCard
            mouseX={mouseX}
            mouseY={mouseY}
            depth={2}
            offsetX={350}
            offsetY={60}
            delay={1.1}
            duration={7.5}
            className="z-10"
          >
            <GlassPanel className="p-4 w-[210px]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">Telemetry</p>
                  <p className="text-[10px] text-slate-400">Real-time</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Heart Rate", value: "72 bpm", color: "bg-emerald-500" },
                  { label: "SpO2", value: "98%", color: "bg-blue-500" },
                  { label: "BP", value: "120/80", color: "bg-amber-500" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                      <span className="text-slate-400">{item.label}</span>
                    </div>
                    <span className="font-medium text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </FloatingCard>

          {/* Emergency Queue - Center Bottom */}
          <FloatingCard
            mouseX={mouseX}
            mouseY={mouseY}
            depth={1.2}
            offsetX={-30}
            offsetY={100}
            delay={1.3}
            duration={9}
            className="z-10"
          >
            <GlassPanel className="p-4 w-[250px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">Emergency Queue</p>
                </div>
                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: "P-1042", severity: "Critical", time: "2m", dot: "bg-red-500" },
                  { id: "P-1043", severity: "High", time: "8m", dot: "bg-amber-500" },
                  { id: "P-1044", severity: "Medium", time: "14m", dot: "bg-blue-500" },
                ].map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white/40 rounded-lg px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      <span className="text-[10px] font-medium text-slate-700">
                        {p.id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{p.severity}</span>
                    <span className="text-[10px] text-slate-400">{p.time} ago</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </FloatingCard>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />
    </section>
  );
}
