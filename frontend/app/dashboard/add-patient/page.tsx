"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2,
  Loader2, User, Stethoscope, Pill, AlertTriangle, Database,
  ChevronRight, WifiOff,
} from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { pythonApi } from "@/lib/pythonApi";

// Auto-generate a patient ID like PT-XXXX
const genPatientId = () => `PT-${Math.floor(1000 + Math.random() * 9000)}`;

type SubmitState = "idle" | "ingesting" | "success" | "error";

export default function AddPatient() {
  const nav = useRouter();

  // Form state
  const [patientId] = useState(genPatientId);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medHistory, setMedHistory] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [pastSurgeries, setPastSurgeries] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Image preview
  const [preview, setPreview] = useState<string | null>(null);
  const [blur, setBlur] = useState(true);

  // Submission
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMsg, setSubmitMsg] = useState("");
  const [chunksCount, setChunksCount] = useState(0);

  const handleFileSelect = (list: FileList | null) => {
    if (!list) return;
    setFiles((p) => [
      ...p,
      ...Array.from(list).filter((f) => !p.some((e) => e.name === f.name)),
    ]);
  };

  // Build a rich text block from all form fields to ingest
  const buildHistoryText = () => {
    const age = dob
      ? `${new Date().getFullYear() - new Date(dob).getFullYear()} years`
      : "Unknown";
    return [
      `Patient Registration Record`,
      `Patient ID: ${patientId}`,
      `Name: ${firstName} ${lastName}`,
      `Date of Birth: ${dob || "Not provided"} | Age: ${age}`,
      `Phone: ${phone || "Not provided"}`,
      `Address: ${address || "Not provided"}`,
      `Blood Group: ${bloodGroup}`,
      ``,
      `Chief Complaint: ${chiefComplaint || "Not provided"}`,
      ``,
      `Medical History: ${medHistory || "None documented"}`,
      ``,
      `Known Allergies: ${allergies || "None documented"}`,
      ``,
      `Current Medications: ${medications || "None documented"}`,
      ``,
      `Past Surgeries / Procedures: ${pastSurgeries || "None documented"}`,
    ].join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setSubmitState("ingesting");
    setSubmitMsg("");

    try {
      const historyText = buildHistoryText();
      const res = await pythonApi.ingestHistory(
        patientId,
        historyText,
        files.length ? files : undefined,
        {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`.trim(),
          dob,
          phone,
          address,
          blood_group: bloodGroup,
        }
      );
      setChunksCount(res.chunks_count);
      setSubmitState("success");
      setSubmitMsg(`Patient ${patientId} registered and indexed into ChromaDB (${res.chunks_count} chunks).`);
    } catch (err: unknown) {
      setSubmitState("error");
      setSubmitMsg(err instanceof Error ? err.message : "Failed to register patient.");
    }
  };

  if (submitState === "success") {
    return (
      <div className="flex flex-col gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Add New Patient</h1>
          <p className="text-sm text-slate-500">Register and route to the right ward in seconds.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-900">Patient Registered Successfully</h2>
            <p className="text-sm text-slate-500 max-w-md">{submitMsg}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-2 w-full max-w-md">
            {[
              { label: "Patient ID", value: patientId },
              { label: "Name", value: `${firstName} ${lastName}` },
              { label: "Chunks Indexed", value: `${chunksCount} chunks` },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                <span className="text-slate-400 block mb-0.5">{item.label}</span>
                <span className="font-semibold text-slate-800 font-mono">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => nav.push("/dashboard/rag")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <Database className="w-4 h-4" />
              View in RAG History
            </button>
            <button
              onClick={() => nav.push("/dashboard/ai-clinical-summary")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              <Sparkles className="w-4 h-4" />
              AI Clinical Summary
            </button>
            <button
              onClick={() => nav.push("/dashboard/add-patient")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Add Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              AI-Powered Registration
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              ChromaDB Ingestion Active
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Add New Patient</h1>
          <p className="text-sm text-slate-500">
            Register a patient and automatically ingest their medical history into the vector database for AI-powered clinical summaries.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-mono">
          <span className="text-slate-400 block">Auto-assigned ID</span>
          <span className="text-blue-700 font-bold text-base">{patientId}</span>
        </div>
      </div>

      {/* Error banner */}
      {submitState === "error" && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-xs">
          <WifiOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-800 block">Registration Failed</span>
            <span className="text-rose-700">{submitMsg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-slate-900 font-semibold">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="First Name *" placeholder="Aarav" value={firstName} onChange={setFirstName} required />
            <Field label="Last Name *" placeholder="Rahman" value={lastName} onChange={setLastName} required />
            <Field label="Date of Birth" type="date" value={dob} onChange={setDob} />
            <Field label="Phone Number" placeholder="+91 98765 43210" value={phone} onChange={setPhone} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 bg-white text-slate-800 transition"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <Field label="Address" placeholder="123 Lakeshore Dr, Mumbai" value={address} onChange={setAddress} />
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold">Medical Information</h3>
              <p className="text-xs text-slate-400">This data will be chunked and embedded into ChromaDB for RAG queries.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <TextareaField
              label="Chief Complaint *"
              placeholder="Describe the primary reason for visit e.g. chest pain since morning, difficulty breathing..."
              value={chiefComplaint}
              onChange={setChiefComplaint}
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextareaField
                label="Medical History"
                placeholder="Diabetes Type 2, Chronic Hypertension, CKD Stage 2..."
                value={medHistory}
                onChange={setMedHistory}
              />
              <TextareaField
                label="Known Allergies"
                placeholder="Penicillin (rash), Sulfa drugs, Iodine contrast..."
                value={allergies}
                onChange={setAllergies}
              />
              <TextareaField
                label="Current Medications"
                placeholder="Metformin 500mg twice daily, Lisinopril 10mg once daily..."
                value={medications}
                onChange={setMedications}
              />
              <TextareaField
                label="Past Surgeries / Procedures"
                placeholder="Appendectomy (2018), Knee replacement (2021)..."
                value={pastSurgeries}
                onChange={setPastSurgeries}
              />
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold">Medical Documents (Optional)</h3>
              <p className="text-xs text-slate-400">Upload PDFs, text files, or images — they will be parsed and indexed alongside the form data.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dropzone */}
            <label
              className="aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
            >
              <Upload className="w-7 h-7 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Drag & drop or click to upload</span>
              <span className="text-xs text-slate-400">PDF, TXT, PNG, JPG up to 10MB</span>
              <input type="file" multiple className="hidden" accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={(e) => handleFileSelect(e.target.files)} />
            </label>

            {/* Injury Image */}
            <label
              onClick={() => setPreview("https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600")}
              className="aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition relative overflow-hidden"
            >
              {preview ? (
                <>
                  <ImageWithFallback src={preview} alt="" className={`w-full h-full object-cover absolute inset-0 ${blur ? "blur-xl scale-110" : ""}`} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setBlur(!blur); }}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs flex items-center gap-1 z-10">
                    {blur ? <><EyeOff className="w-3 h-3" /> Blurred</> : <><Eye className="w-3 h-3" /> Clear</>}
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded-lg">
                    Injury / Wound Image
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-sm font-semibold text-slate-700">Upload Injury Image</span>
                  <span className="text-xs text-slate-400">Optional · for AI visual analysis</span>
                </>
              )}
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queued for ingestion</span>
              {files.map((f) => (
                <div key={f.name} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-slate-700 font-medium">{f.name}</span>
                    <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button type="button" onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))}
                    className="text-slate-400 hover:text-rose-500 transition text-xs">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingestion Preview */}
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl border border-blue-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-900">What gets indexed into ChromaDB</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Patient Profile", detail: "Name, DOB, Blood Group, Contact", icon: User },
              { label: "Clinical Notes", detail: "Chief complaint, medical history", icon: Stethoscope },
              { label: "Medications & Allergies", detail: "Drugs, dosages, contraindications", icon: Pill },
              { label: "Uploaded Docs", detail: `${files.length} file(s) queued`, icon: Database },
            ].map(({ label, detail, icon: Icon }) => (
              <div key={label} className="bg-white/70 border border-blue-100/60 rounded-xl p-3 flex flex-col gap-1">
                <Icon className="w-4 h-4 text-blue-500 mb-0.5" />
                <span className="font-semibold text-slate-800">{label}</span>
                <span className="text-slate-500">{detail}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            After registration, this patient will be immediately queryable via the <strong>RAG History</strong> and <strong>AI Clinical Summary</strong> pages using their ID: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-blue-800">{patientId}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-end gap-3">
          <button type="button" onClick={() => nav.push("/dashboard")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-600 transition">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitState === "ingesting" || !firstName.trim() || !lastName.trim()}
            id="register-patient-btn"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitState === "ingesting" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering & Indexing…</>
            ) : (
              <><Database className="w-4 h-4" /> Register & Ingest Patient</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, placeholder, type = "text", value, onChange, required }: {
  label: string; placeholder?: string; type?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800 transition"
      />
    </div>
  );
}

function TextareaField({ label, placeholder, value, onChange, rows = 4 }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800 resize-none transition"
      />
    </div>
  );
}
