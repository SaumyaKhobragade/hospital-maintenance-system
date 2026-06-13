"use client";

import { useState } from "react";
import { HeartPulse, Eye, EyeOff, Lock, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [showPw, setShowPw] = useState(false);
  const nav = useRouter();

  return (
    <div className="min-h-screen w-full grid grid-cols-2 bg-slate-50">
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="tracking-wider" style={{ fontWeight: 700 }}>HMS</span>
          </Link>

          <h1 className="text-slate-900 mb-2" style={{ fontSize: "28px", fontWeight: 700 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-500 mb-6">Continue to the Metropolis triage console.</p>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm transition ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {m === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 mb-5 text-sm">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400 mb-5">
            <span className="flex-1 h-px bg-slate-200" />OR<span className="flex-1 h-px bg-slate-200" />
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav.push("/dashboard"); }}>
            <label className="block">
              <span className="text-xs text-slate-600">Email</span>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="you@hospital.org" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Password</span>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPw ? "text" : "password"} required placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" /> Remember me</label>
              <a className="text-blue-600 hover:underline" href="#">Forgot password?</a>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Protected by <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SSL/TLS</span> &nbsp;·&nbsp; HIPAA-aligned
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden hidden md:block">
        <ImageWithFallback src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-blue-700/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md">
            <h2 className="mb-3" style={{ fontSize: "26px", fontWeight: 700 }}>Intelligent City-Scale Triage</h2>
            <p className="text-blue-50/90 text-sm mb-5">A unified command surface for emergency departments, ambulances, and the policies that keep them in sync.</p>
            <div className="space-y-2.5">
              {["Real-time queue visibility", "Audit-ready decision logs", "Crisis-aware redirection"].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-300" />{b}</div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-white/20 flex items-center gap-2 text-xs text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> System Operational · 12 hospitals online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
