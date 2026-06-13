"use client";

import { useState } from "react";
import { Upload, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { useRouter } from "next/navigation";

export default function AddPatient() {
  const [blur, setBlur] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const nav = useRouter();

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Add New Patient</h1>
        <p className="text-sm text-slate-500">Register and route to the right ward in seconds.</p>
      </div>

      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); nav.push("/dashboard"); }}>
        <Card title="Basic Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" placeholder="Aarav" />
            <Field label="Last Name" placeholder="Rahman" />
            <Field label="Date of Birth" type="date" />
            <Field label="Phone" placeholder="+1 555-010-1010" />
            <Field label="Address" placeholder="123 Lakeshore Dr" full />
          </div>
        </Card>

        <Card title="Medical Information">
          <Field label="Chief Complaint" placeholder="Describe the primary issue…" textarea full />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Field label="Medical History" placeholder="Diabetes, hypertension…" textarea />
            <Field label="Allergies" placeholder="Penicillin, peanuts…" textarea />
            <Field label="Current Medications" placeholder="Metformin 500mg…" textarea />
          </div>
        </Card>

        <Card title="Injury Image Analysis">
          <div className="grid grid-cols-2 gap-5">
            <label
              onClick={() => setPreview("https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600")}
              className="aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition relative overflow-hidden"
            >
              {preview ? (
                <>
                  <ImageWithFallback src={preview} alt="" className={`w-full h-full object-cover absolute inset-0 ${blur ? "blur-xl scale-110" : ""}`} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setBlur(!blur); }} className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs flex items-center gap-1">
                    {blur ? <><EyeOff className="w-3 h-3" /> Blurred</> : <><Eye className="w-3 h-3" /> Clear</>}
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-700" style={{ fontWeight: 600 }}>Click or drag to upload</span>
                  <span className="text-xs text-slate-500">JPG, PNG up to 10MB</span>
                </>
              )}
            </label>

            <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm" style={{ fontWeight: 600 }}>AI Analysis</span>
                {preview && <span className="ml-auto text-xs text-emerald-600">● Complete</span>}
              </div>
              {preview ? (
                <div className="space-y-3">
                  <Metric label="Severity Score" value="7.4 / 10" color="bg-amber-500" pct={74} />
                  <Metric label="Confidence" value="92%" color="bg-blue-500" pct={92} />
                  <div className="bg-white rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-slate-500 mb-1">Routing recommendation</p>
                    <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>Trauma · Bay 3 · Central Hospital</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Upload an image to run analysis.
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-end gap-2">
          <button type="button" onClick={() => nav.push("/dashboard")} className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">Cancel</button>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm shadow-lg shadow-blue-200">Add Patient</button>
        </div>
      </form>
    </>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-slate-900 mb-4" style={{ fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, placeholder, type = "text", textarea, full }: any) {
  return (
    <label className={`block ${full ? "col-span-full" : ""}`}>
      <span className="text-xs text-slate-600">{label}</span>
      {textarea ? (
        <textarea placeholder={placeholder} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 min-h-[88px]" />
      ) : (
        <input type={type} placeholder={placeholder} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
      )}
    </label>
  );
}

function Metric({ label, value, color, pct }: any) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900" style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
