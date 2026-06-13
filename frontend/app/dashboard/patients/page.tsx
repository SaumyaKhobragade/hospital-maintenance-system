"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  CheckCircle2,
  Phone,
  MoreVertical,
  X,
  Plus,
  Stethoscope,
  Heart,
  TrendingUp,
  Sliders,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  bloodGroup: string;
  dept: string;
  triagePriority: "Critical" | "High" | "Medium" | "Stable";
  aiRiskScore: number;
  status: "Waiting" | "Intake Completed" | "Under Review" | "Discharged";
  queuePos: string;
  assignedDoc: string;
  lastUpdated: string;
  avatar: string;
  symptoms: string[];
  allergies: string[];
  conditions: string[];
  aiSummary: string;
  alerts: string[];
  timeline: { step: string; status: "completed" | "processing" | "pending"; time: string }[];
}

const mockPatients: PatientRecord[] = [
  {
    id: "PT-9042",
    name: "Sarah Jenkins",
    age: 62,
    gender: "Female",
    bloodGroup: "A+",
    dept: "Cardiology",
    triagePriority: "Critical",
    aiRiskScore: 96,
    status: "Waiting",
    queuePos: "1",
    assignedDoc: "Dr. Hasan",
    lastUpdated: "Just now",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
    symptoms: ["Severe chest tightness", "Dyspnea on exertion", "Acute blood pressure spike"],
    allergies: ["Penicillin", "Sulfa drugs"],
    conditions: ["Type 2 Diabetes", "Chronic Stage-II Hypertension", "Stage 2 Chronic Kidney Disease"],
    aiSummary: "Patient presents with acute exacerbation of symptoms secondary to uncontrolled Type 2 Diabetes and chronic stage-II hypertension. Recent prescription OCR analysis indicates potential medication non-compliance or adverse drug-drug interactions. Recommended clinical path: Urgent triage to cardiology for ECG/troponin evaluation and nephrology consult due to renal risk factors.",
    alerts: [
      "DRUG INTERACTION: Concomitant use of Metformin and Ibuprofen in renal stress increases lactic acidosis risk.",
      "VASCULAR WARNING: Measured BP is 175/105 mmHg. High damage risk."
    ],
    timeline: [
      { step: "Prescription Uploaded", status: "completed", time: "10:14 AM" },
      { step: "OCR Processing Completed", status: "completed", time: "10:15 AM" },
      { step: "EMR Vector Semantic Retrieval (RAG)", status: "completed", time: "10:15 AM" },
      { step: "AI Clinical Summary Generated", status: "completed", time: "10:15 AM" },
      { step: "Clinician Verification Audit", status: "processing", time: "In Progress" }
    ]
  },
  {
    id: "PT-7719",
    name: "Robert Chen",
    age: 45,
    gender: "Male",
    bloodGroup: "O-",
    dept: "Pulmonology",
    triagePriority: "High",
    aiRiskScore: 89,
    status: "Intake Completed",
    queuePos: "4",
    assignedDoc: "Dr. Hasan",
    lastUpdated: "2m ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
    symptoms: ["Wheezing", "Productive cough", "Oxygen saturation 91% on room air"],
    allergies: ["Aspirin"],
    conditions: ["Severe Persistent Asthma", "Allergic Rhinitis"],
    aiSummary: "Patient shows signs of acute asthmatic bronchospasm exacerbated by environmental factors. OCR medication scans indicate recent fill of beta-blockers, which are contraindicated in asthmatic patients. Retrieval history reveals previous intubation event in 2024. Prompt respiratory therapy and bronchodilator adjustments recommended.",
    alerts: [
      "CONTRAINDICATION: Propranolol is a non-selective beta-blocker and can cause fatal bronchoconstriction in patients with severe persistent asthma.",
      "RESPIRATORY RATIO: Oxygen saturation is 91% on room air."
    ],
    timeline: [
      { step: "Voice Intake Initiated", status: "completed", time: "11:22 AM" },
      { step: "Speech Translation Completed", status: "completed", time: "11:22 AM" },
      { step: "EMR History Semantic Mapping", status: "completed", time: "11:22 AM" },
      { step: "AI Summary Generation Complete", status: "completed", time: "11:23 AM" },
      { step: "Triage Queue Assignment", status: "completed", time: "11:23 AM" }
    ]
  },
  {
    id: "PT-5521",
    name: "Elena Rostova",
    age: 58,
    gender: "Female",
    bloodGroup: "B-",
    dept: "Nephrology",
    triagePriority: "Medium",
    aiRiskScore: 84,
    status: "Under Review",
    queuePos: "8",
    assignedDoc: "Dr. Vance",
    lastUpdated: "5m ago",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80",
    symptoms: ["Bilateral peripheral edema", "Fatigue", "Decreased urine output"],
    allergies: ["Contrast Agents (lodine)"],
    conditions: ["Diabetic Nephropathy", "Hypertension", "Anemia of Chronic Disease"],
    aiSummary: "Patient shows signs of fluid overload likely secondary to worsening nephrotic-range proteinuria and diabetic nephropathy. Vector matches index multiple outpatient visits detailing gradual eGFR decline. Action required: loop diuretics adjustment, urgent serum creatinine/potassium check, and dietary sodium restriction monitoring.",
    alerts: [
      "RENAL FILTRATION ALERT: eGFR is hovering near Stage 4 CKD threshold. Monitor potassium levels carefully while on Losartan and Spironolactone."
    ],
    timeline: [
      { step: "Prescription Uploaded", status: "completed", time: "02:05 PM" },
      { step: "OCR Processing & Medication Extraction", status: "completed", time: "02:05 PM" },
      { step: "EMR Vector Semantic Retrieval (RAG)", status: "completed", time: "02:06 PM" },
      { step: "AI Clinical Summary Generation", status: "completed", time: "02:06 PM" },
      { step: "Clinician Verification Audit", status: "pending", time: "Awaiting review" }
    ]
  },
  {
    id: "PT-3312",
    name: "Marcus Vance",
    age: 34,
    gender: "Male",
    bloodGroup: "O+",
    dept: "Pediatrics",
    triagePriority: "Stable",
    aiRiskScore: 32,
    status: "Discharged",
    queuePos: "-",
    assignedDoc: "Dr. Hasan",
    lastUpdated: "1h ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80",
    symptoms: ["Mild fever", "Sore throat", "Dry cough"],
    allergies: ["None"],
    conditions: ["None"],
    aiSummary: "Patient exhibits symptoms of mild upper respiratory tract infection. Stable baseline. Rest and hydration recommended. No critical risks or contraindications detected.",
    alerts: [],
    timeline: [
      { step: "Check-in Complete", status: "completed", time: "05:10 PM" },
      { step: "Symptoms Logged", status: "completed", time: "05:11 PM" },
      { step: "AI Summary Generation Complete", status: "completed", time: "05:12 PM" },
      { step: "Discharge Audit Complete", status: "completed", time: "06:12 PM" }
    ]
  }
];

export default function PatientsDirectoryPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>("PT-9042");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const selectedPatient = mockPatients.find((p) => p.id === selectedPatientId);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 400);
  };

  // Filtering Logic
  const filteredPatients = mockPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignedDoc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = filterDept === "All" || p.dept === filterDept;
    const matchesPriority = filterPriority === "All" || p.triagePriority === filterPriority;
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;

    return matchesSearch && matchesDept && matchesPriority && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Centralized Patient Directory
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
              2 Emergency Admissions
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Patients</h1>
          <p className="text-sm text-slate-500">
            Centralized patient management and AI monitoring
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm cursor-pointer self-start md:self-auto">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      {/* 2. Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Patients", value: "8,322", change: "+14 this week", icon: Users, color: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "Critical Patients", value: "142", change: "Immediate attention", icon: AlertTriangle, color: "bg-rose-50 text-rose-600 border border-rose-100" },
          { label: "Patients Waiting", value: "212", change: "In queues", icon: Clock, color: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "AI Flagged Cases", value: "45", change: "Drug-drug warnings", icon: Sparkles, color: "bg-amber-50 text-amber-600 border border-amber-100" },
          { label: "Active Voice Intakes", value: "12", change: "Kiosk processing", icon: Activity, color: "bg-teal-50 text-teal-600 border border-teal-100" },
          { label: "Emergency Admissions", value: "38", change: "Today total", icon: Heart, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4.5 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-slate-500 font-semibold leading-tight">{stat.label}</span>
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold mt-1" style={{ fontSize: "24px", lineHeight: "1" }}>
                {stat.value}
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Main Grid Layout split with detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Table + Filter Column (3 cols wide) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* 3. Patient Search & Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
            <span className="text-sm font-semibold text-slate-900">Search Directory & Filters</span>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, ID, or doctor..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/50 text-sm outline-none focus:bg-white focus:border-blue-500/35 transition text-slate-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Department filter */}
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-semibold outline-none hover:bg-slate-50"
                >
                  <option value="All">All Departments</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>

                {/* Priority filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-semibold outline-none hover:bg-slate-50"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Stable">Stable</option>
                </select>

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-semibold outline-none hover:bg-slate-50"
                >
                  <option value="All">All Statuses</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Intake Completed">Intake Completed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Main Patients Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              {isSearching ? (
                <div className="flex flex-col gap-3.5 p-6">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                      <div className="h-8 bg-slate-100 rounded w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/50">
                      <th className="py-2.5 px-5 font-semibold">Patient Name</th>
                      <th className="py-2.5 px-5 font-semibold">Age / Gender</th>
                      <th className="py-2.5 px-5 font-semibold">Department</th>
                      <th className="py-2.5 px-5 font-semibold">Priority</th>
                      <th className="py-2.5 px-5 font-semibold">AI Risk Score</th>
                      <th className="py-2.5 px-5 font-semibold">Status</th>
                      <th className="py-2.5 px-5 font-semibold">Queue Pos</th>
                      <th className="py-2.5 px-5 font-semibold">Assigned Doctor</th>
                      <th className="py-2.5 px-5 font-semibold">Last Updated</th>
                      <th className="py-2.5 px-5 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPatients.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`hover:bg-slate-50/40 transition cursor-pointer text-xs ${selectedPatientId === p.id ? "bg-blue-50/30" : ""
                          }`}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7 border border-slate-100">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback>{p.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-700 font-medium">
                          {p.age} / {p.gender.charAt(0)}
                        </td>
                        <td className="py-3 px-5 text-slate-600 font-medium">{p.dept}</td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border ${p.triagePriority === "Critical"
                            ? "bg-rose-50 border-rose-100 text-rose-700"
                            : p.triagePriority === "High"
                              ? "bg-amber-50 border-amber-100 text-amber-700"
                              : p.triagePriority === "Medium"
                                ? "bg-blue-50 border-blue-100 text-blue-700"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}>
                            {p.triagePriority}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full ${p.aiRiskScore >= 85
                                  ? "bg-rose-500"
                                  : p.aiRiskScore >= 70
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                  }`}
                                style={{ width: `${p.aiRiskScore}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">{p.aiRiskScore}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${p.status === "Waiting"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : p.status === "Intake Completed"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : p.status === "Under Review"
                                ? "bg-violet-50 text-violet-700 border border-violet-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-mono text-slate-700 font-semibold">{p.queuePos}</td>
                        <td className="py-3 px-5 text-slate-700 font-medium">{p.assignedDoc}</td>
                        <td className="py-3 px-5 text-slate-400 font-medium">{p.lastUpdated}</td>
                        <td className="py-3 px-5 text-right">
                          <button className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                          No patient records found matching search queries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 bg-slate-50/20">
              <span>Showing {filteredPatients.length} of {mockPatients.length} records</span>
              <div className="flex gap-2">
                <button className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-650 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-650 cursor-not-allowed">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Slide-out detailed summary panel (1 col wide) */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* 6. Patient Quick View Panel */}
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div
                key={selectedPatient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-blue-500" />
                    <span className="text-sm font-semibold text-slate-900">Clinical Patient Profile</span>
                  </div>
                  <button
                    onClick={() => setSelectedPatientId(null)}
                    className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-slate-100 shadow-sm shrink-0">
                    <AvatarImage src={selectedPatient.avatar} />
                    <AvatarFallback>{selectedPatient.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-slate-900 font-bold" style={{ fontSize: "14px" }}>{selectedPatient.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedPatient.id} · {selectedPatient.gender} ({selectedPatient.age} yrs)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Blood Group</span>
                    <span className="font-semibold text-slate-700">{selectedPatient.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Doctor Assigned</span>
                    <span className="font-semibold text-slate-700">{selectedPatient.assignedDoc}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Active Allergies</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.allergies.map((al, idx) => (
                        <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded">
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Intake Symptoms</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.symptoms.map((s, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Summary Preview
                  </span>
                  <p className="text-xs text-slate-650 leading-relaxed font-medium line-clamp-4">
                    {selectedPatient.aiSummary}
                  </p>
                </div>

                {selectedPatient.alerts.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5">Latest Warnings</span>
                    {selectedPatient.alerts.map((al, idx) => (
                      <div key={idx} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-tight font-medium">{al}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. Patient Activity Timeline */}
                <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5">Intake Milestones</span>
                  <div className="flex flex-col gap-3 pl-1 text-xs">
                    {selectedPatient.timeline.map((t, idx) => (
                      <div key={idx} className="flex gap-2 relative">
                        {idx < selectedPatient.timeline.length - 1 && (
                          <div className="w-px bg-slate-200 absolute left-1.5 top-4.5 bottom-0" />
                        )}
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${t.status === "completed"
                          ? "bg-emerald-50 border-emerald-350 text-emerald-600"
                          : t.status === "processing"
                            ? "bg-blue-50 border-blue-350 text-blue-600 animate-pulse"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${t.status === "completed" ? "bg-emerald-500" : t.status === "processing" ? "bg-blue-500" : "bg-slate-300"
                            }`} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-700">{t.step}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center text-slate-400 gap-3 min-h-[250px]">
                <User className="w-8 h-8 text-slate-350" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-700">No Patient Profile Loaded</span>
                  <span className="text-xs text-slate-450">Select patient row in table list to inspect EMR triage history.</span>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* 8. Emergency Monitoring Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-450 border-b border-slate-50 pb-2 block">
              Emergency Escalation Box
            </span>
            <div className="flex flex-col gap-3">
              {mockPatients
                .filter((p) => p.triagePriority === "Critical" || p.triagePriority === "High")
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between hover:bg-rose-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <div className="flex flex-col text-xs text-rose-950 font-semibold">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">Risk: {p.aiRiskScore}% · {p.dept}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
