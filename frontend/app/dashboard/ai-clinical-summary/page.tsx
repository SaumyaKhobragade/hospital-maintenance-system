"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BrainCircuit,
  Sparkles,
  Activity,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User,
  Clock,
  ChevronRight,
  Layers,
  Sparkle
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  patientId: string;
  age: number;
  bloodGroup: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  symptoms: string[];
  allergies: string[];
  conditions: string[];
  confidence: number;
  summary: string;
  ocr: {
    imageName: string;
    extractedMedications: { name: string; dosage: string; confidence: number; status: string }[];
    ocrConfidence: number;
    status: string;
  };
  rag: {
    chunks: { text: string; similarity: number; source: string }[];
    vectorConfidence: number;
    insights: string[];
  };
  alerts: { type: "critical" | "warning" | "info"; msg: string; dept: string; priority: string }[];
  timeline: { step: string; status: "completed" | "processing" | "pending"; time: string }[];
}

const mockPatients: Patient[] = [
  {
    id: "P1",
    name: "Sarah Jenkins",
    patientId: "PT-9042",
    age: 62,
    bloodGroup: "A+",
    riskLevel: "CRITICAL",
    symptoms: ["Severe chest tightness", "Dyspnea on exertion", "Acute blood pressure spike"],
    allergies: ["Penicillin", "Sulfa drugs"],
    conditions: ["Type 2 Diabetes", "Chronic Stage-II Hypertension", "Stage 2 Chronic Kidney Disease"],
    confidence: 96,
    summary: "Patient presents with acute exacerbation of symptoms secondary to uncontrolled Type 2 Diabetes and chronic stage-II hypertension. Recent prescription OCR analysis indicates potential medication non-compliance or adverse drug-drug interactions. Recommended clinical path: Urgent triage to cardiology for ECG/troponin evaluation and nephrology consult due to renal risk factors.",
    ocr: {
      imageName: "rx_jenkins_cardiac_2026.png",
      extractedMedications: [
        { name: "Lisinopril", dosage: "20mg daily", confidence: 98, status: "Verified" },
        { name: "Metformin", dosage: "1000mg twice daily", confidence: 95, status: "Verified" },
        { name: "Atorvastatin", dosage: "40mg daily", confidence: 92, status: "Verified" },
        { name: "Ibuprofen", dosage: "400mg as needed", confidence: 99, status: "Extracted (Warning!)" }
      ],
      ocrConfidence: 96,
      status: "Extracted & Parsed"
    },
    rag: {
      chunks: [
        {
          text: "EHR Excerpt (Jan 2026): Patient admitted with hypertensive crisis. BP reached 180/110 mmHg. Confirmed patient history of chronic renal stress. Prescribed Lisinopril 20mg.",
          similarity: 0.92,
          source: "Central Hospital EMR"
        },
        {
          text: "Outpatient Note (Sep 2025): Metformin dosage adjusted to 1000mg twice daily due to rising HbA1c (8.2%). Mild diabetic peripheral neuropathy noted.",
          similarity: 0.85,
          source: "Metropolitan Clinic"
        },
        {
          text: "Cardiology Consult (Jun 2025): Left ventricular hypertrophy noted. Prescribing physician advised close tracking of exertional chest pain.",
          similarity: 0.79,
          source: "Mercy Heart Center"
        }
      ],
      vectorConfidence: 94,
      insights: [
        "Hypertension history requires dynamic medication dosing adjustments.",
        "Diabetes medication Metformin requires renal filtration monitoring (eGFR).",
        "Recent chest tightness matches Jun 2025 Cardiology consult warning regarding exertional chest pain."
      ]
    },
    alerts: [
      {
        type: "critical",
        msg: "DRUG INTERACTION WARNING: Concomitant use of Metformin and Ibuprofen (NSAID) in a patient with chronic kidney disease increases risks of lactic acidosis and acute renal failure.",
        dept: "Nephrology / Emergency Medicine",
        priority: "Level 1 (Immediate)"
      },
      {
        type: "warning",
        msg: "ACUTE HYPERTENSION SPIKE: Measured BP at admission is 175/105 mmHg. High vascular damage risks.",
        dept: "Cardiology",
        priority: "Level 2 (High)"
      }
    ],
    timeline: [
      { step: "Prescription Uploaded", status: "completed", time: "10:14:02 AM" },
      { step: "OCR Processing & Medication Extraction", status: "completed", time: "10:14:15 AM" },
      { step: "EMR Vector Semantic Retrieval (RAG)", status: "completed", time: "10:14:38 AM" },
      { step: "AI Clinical Summary Generation", status: "completed", time: "10:15:01 AM" },
      { step: "Clinician Verification Audit", status: "processing", time: "In Progress" }
    ]
  },
  {
    id: "P2",
    name: "Robert Chen",
    patientId: "PT-7719",
    age: 45,
    bloodGroup: "O-",
    riskLevel: "HIGH",
    symptoms: ["Wheezing", "Productive cough", "Oxygen saturation 91% on room air"],
    allergies: ["Aspirin"],
    conditions: ["Severe Persistent Asthma", "Allergic Rhinitis"],
    confidence: 89,
    summary: "Patient shows signs of acute asthmatic bronchospasm exacerbated by environmental factors. OCR medication scans indicate recent fill of beta-blockers, which are contraindicated in asthmatic patients. Retrieval history reveals previous intubation event in 2024. Prompt respiratory therapy and bronchodilator adjustments recommended.",
    ocr: {
      imageName: "rx_chen_respiratory_2026.png",
      extractedMedications: [
        { name: "Propranolol", dosage: "40mg daily", confidence: 97, status: "Verified" },
        { name: "Albuterol HFA", dosage: "2 puffs q4h prn", confidence: 96, status: "Verified" },
        { name: "Fluticasone/Salmeterol", dosage: "250/50 mcg twice daily", confidence: 91, status: "Verified" }
      ],
      ocrConfidence: 94,
      status: "Extracted & Parsed"
    },
    rag: {
      chunks: [
        {
          text: "Intensive Care Summary (Aug 2024): Patient admitted for status asthmaticus. Required mechanical ventilation for 24 hours. Sensitivities to non-selective beta-blockers noted.",
          similarity: 0.95,
          source: "Riverside ICU"
        },
        {
          text: "Pulmonology Follow-up (Nov 2025): Spirometry shows FEV1 68% predicted. Recommended strict adherence to daily inhaled corticosteroids.",
          similarity: 0.81,
          source: "Riverside Clinic"
        }
      ],
      vectorConfidence: 90,
      insights: [
        "Patient has a life-threatening history of acute asthma attacks (ventilation event 2024).",
        "Beta-blocker (Propranolol) was recently prescribed. Non-selective beta-blockade triggers severe bronchospasm in asthmatic patients."
      ]
    },
    alerts: [
      {
        type: "critical",
        msg: "CONTRAINDICATED DRUG: Propranolol is a non-selective beta-blocker and can cause fatal bronchoconstriction in patients with severe persistent asthma.",
        dept: "Pulmonology / Emergency Medicine",
        priority: "Level 1 (Immediate)"
      },
      {
        type: "warning",
        msg: "RESPIRATORY DEPRESSION RISK: Oxygen saturation is 91%. Risk of respiratory failure based on 2024 history.",
        dept: "Respiratory Therapy",
        priority: "Level 2 (High)"
      }
    ],
    timeline: [
      { step: "Prescription Uploaded", status: "completed", time: "11:22:10 AM" },
      { step: "OCR Processing & Medication Extraction", status: "completed", time: "11:22:24 AM" },
      { step: "EMR Vector Semantic Retrieval (RAG)", status: "completed", time: "11:22:45 AM" },
      { step: "AI Clinical Summary Generation", status: "completed", time: "11:23:02 AM" },
      { step: "Clinician Verification Audit", status: "pending", time: "Awaiting review" }
    ]
  },
  {
    id: "P3",
    name: "Elena Rostova",
    patientId: "PT-5521",
    age: 58,
    bloodGroup: "B-",
    riskLevel: "MEDIUM",
    symptoms: ["Bilateral peripheral edema", "Fatigue", "Decreased urine output"],
    allergies: ["Contrast Agents (lodine)"],
    conditions: ["Diabetic Nephropathy", "Hypertension", "Anemia of Chronic Disease"],
    confidence: 84,
    summary: "Patient shows signs of fluid overload likely secondary to worsening nephrotic-range proteinuria and diabetic nephropathy. Vector matches index multiple outpatient visits detailing gradual eGFR decline. Action required: loop diuretics adjustment, urgent serum creatinine/potassium check, and dietary sodium restriction monitoring.",
    ocr: {
      imageName: "rx_rostova_renal_2026.png",
      extractedMedications: [
        { name: "Furosemide", dosage: "40mg daily", confidence: 99, status: "Verified" },
        { name: "Losartan Potassium", dosage: "50mg daily", confidence: 94, status: "Verified" },
        { name: "Spironolactone", dosage: "25mg daily", confidence: 88, status: "Verified" }
      ],
      ocrConfidence: 93,
      status: "Extracted & Parsed"
    },
    rag: {
      chunks: [
        {
          text: "Nephrology Clinic Note (Feb 2026): eGFR calculated at 34 mL/min/1.73m2. Protein-to-creatinine ratio 3.1g/g. Losartan dose maintained for kidney protection.",
          similarity: 0.91,
          source: "State Renal Institute"
        },
        {
          text: "Emergency Admission (Oct 2025): Dehydration and acute kidney injury (AKI) super-imposed on CKD. Avoid high-dose diuretics without daily weights.",
          similarity: 0.82,
          source: "General Metropolitan"
        }
      ],
      vectorConfidence: 87,
      insights: [
        "Stage 3b CKD (eGFR 34) demands cautious diuretic balancing.",
        "Ensure no active prescription or usage of NSAIDs or iodinated contrasts due to anaphylaxis and severe AKI risks."
      ]
    },
    alerts: [
      {
        type: "warning",
        msg: "RENAL FILTRATION ALERT: eGFR is hovering near Stage 4 CKD threshold. Monitor potassium levels carefully while on Losartan and Spironolactone.",
        dept: "Nephrology",
        priority: "Level 3 (Medium)"
      },
      {
        type: "info",
        msg: "CONTRAST SENSITIVITY: Iodine anaphylaxis history noted in EMR. Flag all diagnostic imaging requiring contrast.",
        dept: "Radiology",
        priority: "Level 4 (Info)"
      }
    ],
    timeline: [
      { step: "Prescription Uploaded", status: "completed", time: "02:05:40 PM" },
      { step: "OCR Processing & Medication Extraction", status: "completed", time: "02:05:58 PM" },
      { step: "EMR Vector Semantic Retrieval (RAG)", status: "completed", time: "02:06:12 PM" },
      { step: "AI Clinical Summary Generation", status: "completed", time: "02:06:35 PM" },
      { step: "Clinician Verification Audit", status: "pending", time: "Awaiting review" }
    ]
  }
];

export default function AIClinicalSummaryPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("P1");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [pipelineStep, setPipelineStep] = useState<string>("Ready");
  const [ocrBoundingBoxActive, setOcrBoundingBoxActive] = useState<number | null>(null);

  const activePatient = mockPatients.find((p) => p.id === selectedPatientId) || mockPatients[0];

  const handleRunPipeline = () => {
    setIsProcessing(true);
    setPipelineProgress(0);
    setPipelineStep("Ingesting Prescription...");

    const steps = [
      { progress: 20, label: "Running OCR & Bounding Line Extraction..." },
      { progress: 50, label: "Vectorizing Context & Querying EMR Embeddings..." },
      { progress: 75, label: "Evaluating Drug Interactions & Risk Vectors..." },
      { progress: 90, label: "Synthesizing AI Medical Summary..." },
      { progress: 100, label: "Ready" }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPipelineProgress(step.progress);
        setPipelineStep(step.label);
        if (step.progress === 100) {
          setIsProcessing(false);
        }
      }, (index + 1) * 600);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOcrBoundingBoxActive((prev) => {
        if (prev === null) return 0;
        if (prev >= activePatient.ocr.extractedMedications.length - 1) return null;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activePatient]);

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Engine Online · v4.2
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>AI Clinical Summary</h1>
          <p className="text-sm text-slate-500">
            AI-generated contextual summaries from prescriptions, patient history, and retrieval-augmented analysis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
            {mockPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3 py-1 rounded-md text-sm transition ${
                  selectedPatientId === p.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p.name.split(" ")[0]} ({p.patientId})
              </button>
            ))}
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Loader Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/90 border border-slate-200/60 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center min-h-[300px] shadow-sm"
          >
            <div className="relative flex items-center justify-center">
              <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
              <BrainCircuit className="w-5 h-5 text-blue-600 absolute animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <p className="text-sm font-semibold text-slate-900">Executing Medical AI Pipeline</p>
              <p className="text-xs text-slate-500 font-mono">{pipelineStep}</p>
            </div>
            <div className="w-64 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
              <motion.div
                className="bg-blue-600 h-full shadow-sm"
                initial={{ width: "0%" }}
                animate={{ width: `${pipelineProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isProcessing && (
          <motion.div
            key={activePatient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* Left Column: Patient Summary & General Details */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {/* 2. Featured Patient Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-slate-900" style={{ fontWeight: 600 }}>{activePatient.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{activePatient.patientId}</p>
                    </div>
                  </div>
                  
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                      activePatient.riskLevel === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : activePatient.riskLevel === "HIGH"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}
                  >
                    {activePatient.riskLevel} RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Age / Gender</span>
                    <span className="font-semibold text-slate-800">{activePatient.age} Yrs · Female</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Blood Group</span>
                    <span className="font-semibold text-blue-600">{activePatient.bloodGroup}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Symptoms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.symptoms.map((s, idx) => (
                        <span key={idx} className="text-xs bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Allergies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.allergies.map((a, idx) => (
                        <span key={idx} className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-lg border border-rose-100">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Existing Conditions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.conditions.map((c, idx) => (
                        <span key={idx} className="text-xs bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-100">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 mt-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      AI Confidence Score
                    </span>
                    <span className="text-blue-600 font-bold">{activePatient.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${activePatient.confidence}%` }} />
                  </div>
                </div>
              </div>

              {/* 6. Alert & Recommendation Cards */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Alerts & Recommendations</span>
                {activePatient.alerts.map((a, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border flex gap-3.5 transition-all ${
                      a.type === "critical"
                        ? "bg-rose-50 border-rose-100 text-rose-800"
                        : a.type === "warning"
                        ? "bg-amber-50 border-amber-100 text-amber-800"
                        : "bg-blue-50 border-blue-100 text-blue-800"
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      a.type === "critical" ? "text-rose-600" : a.type === "warning" ? "text-amber-600" : "text-blue-600"
                    }`} />
                    
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {a.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.dept}</span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{a.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Column: Summary, OCR, RAG */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* 3. AI Generated Clinical Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-900 font-semibold" style={{ fontSize: "15px" }}>AI Generated Clinical Summary</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Match Index
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 font-medium bg-blue-50/20 border border-blue-100/40 rounded-xl p-4">
                  {activePatient.summary.split(/(hypertension|diabetes|cardiac concerns|cardiology|nephrology|asthma|beta-blockers|proteinuria|nephrotic)/i).map((part, index) => {
                    const lowercasePart = part.toLowerCase();
                    const isKeyword = [
                      "hypertension",
                      "diabetes",
                      "cardiac concerns",
                      "cardiology",
                      "nephrology",
                      "asthma",
                      "beta-blockers",
                      "proteinuria",
                      "nephrotic"
                    ].includes(lowercasePart);
                    return isKeyword ? (
                      <span key={index} className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                        {part}
                      </span>
                    ) : (
                      part
                    );
                  })}
                </p>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Suggested Triage: Immediate Referral
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Engine: MedLLM-v4
                  </span>
                </div>
              </div>

              {/* 4. Prescription OCR Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Prescription OCR Section</h3>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-semibold">
                    {activePatient.ocr.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Scanned Document Box Mock Preview */}
                  <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {activePatient.ocr.imageName}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                        {activePatient.ocr.ocrConfidence}% OCR Accuracy
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 my-3">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                      <div className="h-2 w-40 bg-slate-100 rounded" />
                      
                      {activePatient.ocr.extractedMedications.map((med, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setOcrBoundingBoxActive(idx)}
                          onMouseLeave={() => setOcrBoundingBoxActive(null)}
                          className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between transition ${
                            ocrBoundingBoxActive === idx
                              ? "bg-blue-50 border-blue-300 text-blue-800"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <span>Rx: {med.name} {med.dosage}</span>
                          <span className="text-[10px] text-slate-400">Scan Area #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-[10px] text-slate-400 text-right">Preview Image Placeholder</div>
                  </div>

                  {/* Right: Table layout matching RecentPatients */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Medications</span>
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                      {activePatient.ocr.extractedMedications.map((med, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setOcrBoundingBoxActive(idx)}
                          onMouseLeave={() => setOcrBoundingBoxActive(null)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                            ocrBoundingBoxActive === idx
                              ? "bg-blue-50/50 border-blue-200 shadow-sm"
                              : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-800">{med.name}</span>
                            <span className="text-xs text-slate-500">{med.dosage}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-semibold block ${
                              med.status.includes("Warning") ? "text-rose-600" : "text-emerald-600"
                            }`}>
                              {med.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{med.confidence}% confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. RAG Retrieval Context Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <h3 className="text-slate-900" style={{ fontWeight: 600 }}>RAG Retrieval Context Section</h3>
                  </div>
                  <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full font-semibold">
                    Vector confidence: {activePatient.rag.vectorConfidence}%
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Retrieved Patient History Chunks</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activePatient.rag.chunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 hover:border-slate-200 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-semibold truncate max-w-[100px]">{chunk.source}</span>
                          <span className="text-blue-600 font-bold">Similarity: {(chunk.similarity * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 line-clamp-4 font-normal">
                          {chunk.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Previous Visit Insights & Matches
                  </span>
                  <ul className="text-xs flex flex-col gap-1.5 pl-1.5 text-slate-600">
                    {activePatient.rag.insights.map((ins, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-500 font-bold shrink-0">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 7. Activity Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <h3 className="text-slate-900" style={{ fontWeight: 600 }}>Activity Timeline</h3>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pl-1.5 text-xs text-slate-650">
                  {activePatient.timeline.map((t, idx) => (
                    <div key={idx} className="flex gap-3.5 relative">
                      {idx < activePatient.timeline.length - 1 && (
                        <div className="w-px bg-slate-200 absolute left-3 top-5 bottom-0" />
                      )}
                      <div className="shrink-0 mt-0.5">
                        {t.status === "completed" ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : t.status === "processing" ? (
                          <div className="h-6 w-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 leading-none">{t.step}</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            t.status === "completed"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : t.status === "processing"
                              ? "bg-blue-50 border-blue-100 text-blue-700"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{t.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-end gap-3">
                  <button className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
                    Flag Incident
                  </button>
                  <button
                    onClick={() => alert(`Clinical summary verified for ${activePatient.name}. Dispatching recommendations...`)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    Confirm & Verify Summary
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
