"use client";

import { HeartPulse, Activity, Brain, GitBranch, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-white">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="tracking-wider" style={{ fontWeight: 700 }}>HMS</span>
          </div>
          <nav className="flex items-center gap-8 text-sm text-slate-600">
            <a href="#product">Product</a>
            <a href="#science">Science</a>
            <a href="#trust">Trust</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">Login</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Request Demo</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ImageWithFallback src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1600" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
        </div>
        <div className="max-w-7xl mx-auto px-8 py-28 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            City-Scale Deployment Ready
          </span>
          <h1 className="text-slate-900 max-w-3xl mx-auto" style={{ fontSize: "60px", fontWeight: 700, lineHeight: 1.1 }}>
            Next-Generation Hospital Coordination
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">
            Triage smarter. Redirect faster. HMS coordinates patient flow across an entire metropolis with explainable AI and human-in-the-loop guardrails.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
              Open Live Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#product" className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50">See How It Works</a>
          </div>
        </div>
      </section>

      <section id="product" className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Explainable Triage", desc: "Every priority decision shows the rules, weights, and constraints behind it." },
            { icon: GitBranch, title: "Real-time Redirection", desc: "Patients are rerouted across hospitals in milliseconds when capacity tips." },
            { icon: Activity, title: "Distress AI", desc: "Vision-based detection of crisis events with human verification before action." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-slate-900 mb-2" style={{ fontWeight: 600 }}>{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="science" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-slate-900 text-center mb-12" style={{ fontSize: "32px", fontWeight: 700 }}>How It Works</h2>
          <div className="grid grid-cols-3 gap-6">
            {["Observe", "Analyze", "Coordinate"].map((step, i) => (
              <div key={step} className="bg-white rounded-2xl p-8 border border-slate-100 relative">
                <span className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center" style={{ fontWeight: 600 }}>{i + 1}</span>
                <h3 className="text-slate-900 mb-2" style={{ fontWeight: 600 }}>{step}</h3>
                <p className="text-sm text-slate-500">Streaming sensor + EMR data flows into the engine, gets evaluated by policy, and drives action.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-300 mb-4"><ShieldCheck className="w-4 h-4" /> HUMAN-IN-THE-LOOP GOVERNANCE</span>
            <h2 className="mb-4" style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.15 }}>AI proposes. Clinicians decide.</h2>
            <p className="text-slate-300">Every routing, redirection, and escalation is auditable, reversible, and bounded by clinical policy.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
            {[
              "100% audit trail on every decision",
              "0 black-box recommendations",
              "Explainable confidence scores per route",
              "Rollback for any redirection in <1s",
            ].map((line) => (
              <div key={line} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-200">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span style={{ fontWeight: 700 }}>HMS</span>
            </div>
            <p className="text-slate-500">City-scale hospital coordination.</p>
          </div>
          {[
            { h: "Platform", l: ["Triage", "Redirection", "Distress AI", "Policies"] },
            { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
            { h: "Contact", l: ["support@hms.io", "+1 555 010-1010"] },
          ].map(({ h, l }) => (
            <div key={h}>
              <h4 className="text-slate-900 mb-3" style={{ fontWeight: 600 }}>{h}</h4>
              <ul className="space-y-2 text-slate-500">{l.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
