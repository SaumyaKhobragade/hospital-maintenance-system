"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Save, RotateCcw, Info, AlertTriangle, Wifi } from "lucide-react";
import { api } from "../../../lib/api";

const POLICY_OPTIONS = [
  { name: "Adaptive v2.4", active: true,  desc: "Dynamic aging + crisis-aware boost" },
  { name: "Strict FIFO",   active: false, desc: "Pure first-come-first-served" },
  { name: "Severity-First",active: false, desc: "Hard-priority by clinical severity" },
  { name: "Crisis Override",active: false, desc: "Emergency mode — all rules suspended" },
];

const DEFAULTS = {
  severityWeight: 1.0,
  agingFactor: 0.5,
  agingEnabled: 1.0, // 1 = enabled, 0 = disabled (use as float for slider)
  distressProvisionalBoost: 50,
  distressConfirmedBoost: 100,
  distressProvisionalTimeoutMs: 120000,
  distressDecay: 0.5,
};

export default function PolicyConfig() {
  const [policies, setPolicy] = useState(DEFAULTS);
  const [saved, setSaved] = useState<typeof DEFAULTS | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Load current policies from backend
  useEffect(() => {
    api.getPolicies().then((p) => {
      setPolicy((prev) => ({
        ...prev,
        severityWeight:               p.severityWeight                ?? prev.severityWeight,
        agingFactor:                  p.agingFactor                   ?? prev.agingFactor,
        agingEnabled:                 p.agingEnabled                  ?? prev.agingEnabled,
        distressProvisionalBoost:     p.distressProvisionalBoost      ?? prev.distressProvisionalBoost,
        distressConfirmedBoost:       p.distressConfirmedBoost        ?? prev.distressConfirmedBoost,
        distressProvisionalTimeoutMs: p.distressProvisionalTimeoutMs  ?? prev.distressProvisionalTimeoutMs,
        distressDecay:                p.distressDecay                 ?? prev.distressDecay,
      }));
      setSaved(null);
    }).catch(() => {/* backend may not be running yet */});
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true); setStatus(null);
    try {
      await Promise.all(
        Object.entries(policies).map(([k, v]) => api.updatePolicy(k, v))
      );
      setSaved(policies);
      setStatus({ ok: true, msg: "Policies saved successfully — active immediately." });
    } catch (e: any) {
      setStatus({ ok: false, msg: `Save failed: ${e.message}` });
    } finally { setLoading(false); }
  }, [policies]);

  const handleReset = () => {
    setPolicy(DEFAULTS);
    setStatus({ ok: true, msg: "Reverted to defaults (unsaved)." });
  };

  const set = (k: keyof typeof DEFAULTS) => (v: number) =>
    setPolicy((p) => ({ ...p, [k]: v }));

  const isDirty = JSON.stringify(policies) !== JSON.stringify(saved ?? DEFAULTS);

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Triage Policy Configuration</h1>
          <p className="text-sm text-slate-500">Live-tune the rules powering city-wide patient routing.</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Wifi className="w-3 h-3" /> Synced to backend
        </span>
      </div>

      {/* Status */}
      {status && (
        <div className={`px-4 py-2.5 rounded-xl text-sm border ${status.ok ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-rose-50 text-rose-800 border-rose-100"}`}>
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Policy selector (UI only — individual params control the actual logic) */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-900 mb-4" style={{ fontWeight: 600 }}>Available Policies</h3>
            <div className="space-y-2">
              {POLICY_OPTIONS.map((p) => (
                <label key={p.name} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${p.active ? "border-blue-200 bg-blue-50/40" : "border-slate-100 hover:bg-slate-50"}`}>
                  <input type="radio" name="policy" defaultChecked={p.active} className="mt-1 accent-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.active && <span className="text-xs text-blue-600">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800">
                <span style={{ fontWeight: 600 }}>Tip:</span> Changes apply immediately to in-flight queue decisions. Audit log retains previous config.
              </div>
            </div>
          </div>
        </div>

        {/* Parameter sliders */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-slate-900 mb-5" style={{ fontWeight: 600 }}>Severity &amp; Priority</h3>
            <Slider label="Severity Weight" min={0} max={2} step={0.05} value={policies.severityWeight} onChange={set("severityWeight")} format={(v: number) => v.toFixed(2)} />
            <Slider label="Aging Rate Factor" min={0} max={2} step={0.05} value={policies.agingFactor} onChange={set("agingFactor")} format={(v: number) => v.toFixed(2)} />
            <Toggle label="Enable Time-based Aging" desc="Promote priority as wait time grows"
              value={policies.agingEnabled > 0.5} onChange={(v: boolean) => set("agingEnabled")(v ? 1 : 0)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-slate-900 mb-5 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <ShieldCheck className="w-4 h-4 text-blue-600" /> HITL &amp; Distress
            </h3>
            <Slider label="Provisional Boost" min={0} max={200} step={5} value={policies.distressProvisionalBoost} onChange={set("distressProvisionalBoost")} format={(v: number) => `+${v}`} />
            <Slider label="Confirmed Boost" min={0} max={300} step={5} value={policies.distressConfirmedBoost} onChange={set("distressConfirmedBoost")} format={(v: number) => `+${v}`} />
            <Slider label="Provisional Timeout (ms)" min={10000} max={300000} step={5000} value={policies.distressProvisionalTimeoutMs} onChange={set("distressProvisionalTimeoutMs")} format={(v: number) => `${Math.round(v / 1000)}s`} />
            <Slider label="Distress Decay Rate" min={0} max={2} step={0.05} value={policies.distressDecay} onChange={set("distressDecay")} format={(v: number) => v.toFixed(2)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 opacity-60">
            <h3 className="text-slate-900 mb-2" style={{ fontWeight: 600 }}>Overload Handling</h3>
            <p className="text-sm text-slate-500">Coming in v2.5 — coordinated cross-hospital overflow.</p>
          </div>

          {/* Save bar */}
          <div className="sticky bottom-6 bg-white border border-slate-100 rounded-2xl shadow-lg p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {isDirty ? "You have unsaved changes." : "All changes saved."}
            </span>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button onClick={handleSave} disabled={loading || !isDirty} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm shadow-lg shadow-blue-200 disabled:opacity-50">
                <Save className="w-4 h-4" /> {loading ? "Saving…" : "Save Policy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>Crisis Override available</p>
          <p className="text-xs text-amber-700">Activate only with director authorization. Suspends all aging and boost rules.</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs">Authorize</button>
      </div>
    </>
  );
}

function Slider({ label, min, max, step, value, onChange, format }: any) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm text-blue-600" style={{ fontWeight: 600 }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-blue-600" />
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full p-0.5 transition ${value ? "bg-blue-600" : "bg-slate-200"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
