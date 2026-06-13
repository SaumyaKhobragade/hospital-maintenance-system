"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Languages,
  Volume2,
  Play,
  Pause,
  Clock,
  Activity,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User,
  AlertCircle,
  ArrowRight,
  Headphones,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";

interface KioskPreset {
  id: string;
  name: string;
  originalText: string;
  detectedLang: string;
  translatedText: string;
  translationConfidence: number;
  extractedFields: {
    symptoms: string[];
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    duration: string;
    suggestedDept: string;
    emergencyLevel: string;
    riskIndicators: string[];
    queuePriority: string;
  };
  intakeSummary: {
    tempId: string;
    chiefComplaint: string;
    suggestedDoctor: string;
    waitTime: string;
    queueAssignment: string;
    nextAction: string;
  };
  audioResponse: {
    responseText: string;
    duration: string;
    voiceGender: string;
  };
}

const kioskPresets: KioskPreset[] = [
  {
    id: "K1",
    name: "Hinglish: Chest Pain & Dyspnea",
    originalText: "Mujhe subah se chest pain ho raha hai aur saans lene me dikkat ho rahi hai.",
    detectedLang: "Hinglish (Hindi / English Mix)",
    translatedText: "I have been experiencing chest pain since morning and am having difficulty breathing.",
    translationConfidence: 97,
    extractedFields: {
      symptoms: ["Chest Pain", "Dyspnea (Difficulty Breathing)"],
      severity: "CRITICAL",
      duration: "Since morning (~8 hours)",
      suggestedDept: "Cardiology / Emergency Medicine",
      emergencyLevel: "Level 1 (Immediate Resuscitation)",
      riskIndicators: ["Potential cardiac ischaemia", "Vascular compromise risk"],
      queuePriority: "Priority 1 (Red alert)"
    },
    intakeSummary: {
      tempId: "TMP-8492",
      chiefComplaint: "Acute exertional chest pressure and dyspnea",
      suggestedDoctor: "Dr. Hasan (Chief Medical Officer)",
      waitTime: "Immediate (<3 min)",
      queueAssignment: "Rapid Triage Cardiology Queue",
      nextAction: "Escort immediately to Trauma Room 2 for urgent ECG and troponin testing."
    },
    audioResponse: {
      responseText: "Aapko emergency registration me daal diya gaya hai. Kripya sidhe Emergency Room 2 me jayein, nurse aapki madad ke liye aa rahi hai.",
      duration: "0:09",
      voiceGender: "Female (Hinglish Synthesis)"
    }
  },
  {
    id: "K2",
    name: "Spanish: Headache & Fever",
    originalText: "Me duele mucho la cabeza y tengo fiebre alta desde anoche, casi no puedo estar de pie.",
    detectedLang: "Spanish (Español)",
    translatedText: "I have a severe headache and a high fever since last night, I can barely stand up.",
    translationConfidence: 99,
    extractedFields: {
      symptoms: ["Severe Headache", "High Fever", "General Asthenia (Weakness)"],
      severity: "HIGH",
      duration: "Since last night (~14 hours)",
      suggestedDept: "Internal Medicine / Infectious Diseases",
      emergencyLevel: "Level 2 (Emergent)",
      riskIndicators: ["Hyperpyrexia risk", "Potential acute systemic infection"],
      queuePriority: "Priority 2 (Yellow alert)"
    },
    intakeSummary: {
      tempId: "TMP-9018",
      chiefComplaint: "Severe headache and high fever with profound fatigue",
      suggestedDoctor: "Dr. Elena Vance (Internal Medicine Specialist)",
      waitTime: "10-15 minutes",
      queueAssignment: "Acute Medical Care Queue",
      nextAction: "Direct to Triage Room B for temperature check, antipyretics build-up, and blood draw."
    },
    audioResponse: {
      responseText: "Ha sido registrado con éxito. Por favor diríjase a la Sala de Espera B. Un médico lo atenderá en unos minutos.",
      duration: "0:07",
      voiceGender: "Female (Castilian Spanish)"
    }
  },
  {
    id: "K3",
    name: "Bengali: Fever & Body Aches",
    originalText: "Tin din dhore amar khub baje jor ar ga-hat pa betha ache, kichu khete পারছি na.",
    detectedLang: "Bengali / English Mix",
    translatedText: "I have had a very bad fever and body aches for three days, I cannot eat anything.",
    translationConfidence: 94,
    extractedFields: {
      symptoms: ["Fever", "Myalgia (Body Aches)", "Anorexia (Loss of Appetite)"],
      severity: "MEDIUM",
      duration: "3 days",
      suggestedDept: "General Medicine / Pulmonology",
      emergencyLevel: "Level 3 (Urgent)",
      riskIndicators: ["Dehydration risk due to lack of intake", "Viral syndrome monitor"],
      queuePriority: "Priority 3 (Green alert)"
    },
    intakeSummary: {
      tempId: "TMP-7734",
      chiefComplaint: "Prolonged febrile illness with severe generalized myalgia",
      suggestedDoctor: "Dr. Hasan (General Practitioner)",
      waitTime: "25-30 minutes",
      queueAssignment: "General Medicine Ward Queue",
      nextAction: "Direct to seating area 4. Patient should be provided oral hydration while waiting."
    },
    audioResponse: {
      responseText: "Apnar registration hoye geche. Kripya Seating Area 4 e opekka korun. Apnake taratari daka hobe.",
      duration: "0:08",
      voiceGender: "Male (Bengali Speech Synthesis)"
    }
  }
];

export default function VoiceCheckInKioskPage() {
  const [activePresetId, setActivePresetId] = useState<string>("K1");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(15));
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState<number>(0);

  const activePreset = kioskPresets.find((p) => p.id === activePresetId) || kioskPresets[0];

  // Simulated Voice Waveform Animation
  useEffect(() => {
    if (!isListening) {
      setWaveformBars(Array(24).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setWaveformBars(Array.from({ length: 24 }, () => Math.floor(Math.random() * 45) + 8));
    }, 120);

    return () => clearInterval(interval);
  }, [isListening]);

  // Timer Tick
  useEffect(() => {
    if (!isListening) {
      setTimerSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isListening]);

  // Simulated Intake Process Trigger
  const triggerSimulation = () => {
    setIsListening(true);
    setIsProcessing(false);
    setIsPlayingAudio(false);
    setAudioPlaybackProgress(0);

    // Stop listening after 4 seconds and enter AI processing phase
    setTimeout(() => {
      setIsListening(false);
      setIsProcessing(true);

      // Finish processing after 2.5 seconds
      setTimeout(() => {
        setIsProcessing(false);
      }, 2500);
    }, 4000);
  };

  // Audio Playback Simulation
  const toggleAudioPlayback = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    setAudioPlaybackProgress(0);
  };

  useEffect(() => {
    if (!isPlayingAudio) return;

    const interval = setInterval(() => {
      setAudioPlaybackProgress((prev) => {
        if (prev >= 100) {
          setIsPlayingAudio(false);
          return 100;
        }
        return prev + 5;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const formatTimer = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainSecs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Multilingual Speech Engine v2.0
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Kiosk Active
            </span>
          </div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Voice Check-In Kiosk</h1>
          <p className="text-sm text-slate-500">
            Simulate AI-powered patient check-in via speech translation, NLP EMR structuring, and automated triage.
          </p>
        </div>

        {/* Simulation preset switches */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold sm:text-right">Select Speech Preset:</span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
            {kioskPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePresetId(preset.id);
                  setIsListening(false);
                  setIsProcessing(false);
                  setIsPlayingAudio(false);
                  setAudioPlaybackProgress(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activePresetId === preset.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {preset.name.split(":")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Voice Sessions", value: "12", change: "Live now", icon: Mic, iconBg: "bg-blue-50 text-blue-600 border border-blue-100" },
          { label: "Languages Handled Today", value: "6", change: "Hindi, Eng, Span, Beng, +2", icon: Languages, iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
          { label: "Avg Processing Latency", value: "1.42s", change: "Speech-to-EMR", icon: Clock, iconBg: "bg-violet-50 text-violet-600 border border-violet-100" },
          { label: "Model Transcription Acc.", value: "98.4%", change: "vs 97.9% last month", icon: Award, iconBg: "bg-amber-50 text-amber-600 border border-amber-100" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-slate-900 font-bold" style={{ fontSize: "28px", lineHeight: "1" }}>
                {stat.value}
              </div>
              <span className="text-xs text-slate-400 mt-1">{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Recording Controls & Transcription Display */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* 2. Live Voice Input Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between w-full border-b border-slate-50 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice Capture Terminal</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
                STT-ENG-V2
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 py-4">
              {/* Pulse circle button */}
              <button
                onClick={triggerSimulation}
                disabled={isListening || isProcessing}
                className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-95"
                    : isProcessing
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 hover:scale-[1.03] cursor-pointer"
                }`}
              >
                {isListening ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
                    <MicOff className="w-8 h-8" />
                  </>
                ) : isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">
                  {isListening ? "Listening to patient speech..." : isProcessing ? "AI pipeline running..." : "Click microphone to start check-in"}
                </span>
                <span className="text-xs text-slate-400">
                  {isListening ? `Timer: ${formatTimer(timerSeconds)}` : "Supported: Hinglish, English, Spanish, Bengali"}
                </span>
              </div>
            </div>

            {/* 9. Waveform Visualization */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Decibel Waveform Analysis</span>
                <span className={isListening ? "text-red-500 font-bold" : "text-slate-400"}>
                  {isListening ? "ACTIVE FEED" : "MUTED"}
                </span>
              </div>
              <div className="h-14 flex items-center justify-center gap-1">
                {waveformBars.map((barHeight, idx) => (
                  <motion.div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      isListening ? "bg-red-500/80" : "bg-slate-300"
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-xs text-slate-400 border-t border-slate-50 pt-3">
              <span>Auto-Detected Language:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {isListening || isProcessing ? "Scanning..." : activePreset.detectedLang}
              </span>
            </div>
          </div>

          {/* 3. Real-Time Transcription Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Transcription output</span>
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                Translation Score: {activePreset.translationConfidence}%
              </span>
            </div>

            {isProcessing ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Original Speech Input ({activePreset.detectedLang.split(" ")[0]})</span>
                  <p className="text-sm italic text-slate-700 font-medium">
                    "{activePreset.originalText}"
                  </p>
                </div>

                <div className="bg-blue-50/20 border border-blue-100/50 rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-blue-600 font-mono">English Translation Output</span>
                  <p className="text-sm text-slate-800 font-semibold">
                    {activePreset.translatedText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Column combined layout */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* AI Structured Extraction & Patient Intake */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 4. AI Structured Extraction Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-900">NLP Clinical Extractions</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Intake Fields</span>
              </div>

              {isProcessing ? (
                <div className="flex flex-col gap-4 py-2">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="h-2.5 bg-slate-100 rounded w-1/4 animate-pulse" />
                      <div className="h-6 bg-slate-100 rounded w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">Symptoms Extracted</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {activePreset.extractedFields.symptoms.map((symp, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          {symp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-b border-slate-50 pb-2">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Severity</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
                        activePreset.extractedFields.severity === "CRITICAL"
                          ? "bg-rose-50 border-rose-150 text-rose-700"
                          : activePreset.extractedFields.severity === "HIGH"
                          ? "bg-amber-50 border-amber-150 text-amber-700"
                          : "bg-blue-50 border-blue-150 text-blue-700"
                      }`}>
                        {activePreset.extractedFields.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Duration</span>
                      <span className="font-semibold text-slate-700">{activePreset.extractedFields.duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">Suggested Department</span>
                    <span className="font-semibold text-slate-800 text-sm">{activePreset.extractedFields.suggestedDept}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-b border-slate-50 pb-2">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Emergency Triage</span>
                      <span className="font-medium text-slate-700">{activePreset.extractedFields.emergencyLevel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Queue Priority</span>
                      <span className="font-semibold text-slate-800 font-mono">{activePreset.extractedFields.queuePriority}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Risk Factors Detected</span>
                    <div className="flex flex-wrap gap-1">
                      {activePreset.extractedFields.riskIndicators.map((risk, idx) => (
                        <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-100/60 px-2 py-0.5 rounded-md font-semibold">
                          {risk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Patient Intake Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-900">Intake Document Preview</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                  {isProcessing ? "Ingesting..." : activePreset.intakeSummary.tempId}
                </span>
              </div>

              {isProcessing ? (
                <div className="flex flex-col gap-4 py-2">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="h-2.5 bg-slate-100 rounded w-1/3 animate-pulse" />
                      <div className="h-5 bg-slate-100 rounded w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Chief Complaint Summary</span>
                      <p className="text-slate-800 font-semibold text-sm">
                        "{activePreset.intakeSummary.chiefComplaint}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Suggested Doctor</span>
                      <span className="font-semibold text-slate-800">{activePreset.intakeSummary.suggestedDoctor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Estimated Wait Time</span>
                      <span className="font-semibold text-blue-600 font-mono text-sm">{activePreset.intakeSummary.waitTime}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-2.5">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Queue Assignment</span>
                      <span className="font-medium text-slate-700">{activePreset.intakeSummary.queueAssignment}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Assigned Facility</span>
                      <span className="font-medium text-slate-700">Triage Room ER-2</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100/50 rounded-xl p-3 flex flex-col gap-1 mt-1">
                    <span className="text-blue-700 font-bold block">Recommended Action</span>
                    <p className="text-slate-700 leading-normal">
                      {activePreset.intakeSummary.nextAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Voice Response Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900">TTS Audio Response Player</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Synthesis Language: {activePreset.detectedLang.split(" ")[0]}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              {/* Play button */}
              <button
                onClick={toggleAudioPlayback}
                disabled={isProcessing}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-sm ${
                  isProcessing
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                    : isPlayingAudio
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 w-full flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">AI Voice: {activePreset.audioResponse.voiceGender}</span>
                  <span className="text-slate-400 font-mono">
                    {isPlayingAudio ? "Playing back..." : `Duration: ${activePreset.audioResponse.duration}`}
                  </span>
                </div>
                
                {/* Simulated playback bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-350">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${audioPlaybackProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Generated Synthesized Message Transcript</span>
              <p className="text-slate-800 leading-normal italic font-medium">
                "{activePreset.audioResponse.responseText}"
              </p>
            </div>
          </div>

          {/* 7. Conversation Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-semibold text-slate-900">Conversation Timeline Log</span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Log Ingestion Active
              </span>
            </div>

            <div className="flex flex-col gap-4 pl-1.5 text-xs text-slate-600">
              <div className="flex gap-3 relative">
                <div className="w-px bg-slate-200 absolute left-2.5 top-5 bottom-0" />
                <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Mic className="w-3 h-3 text-blue-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">19:24:05 - Patient Speech Capture Triggered</span>
                  <span className="text-slate-400">Captured original audio stream. Waveform analysis detected peak db.</span>
                </div>
              </div>

              <div className="flex gap-3 relative">
                <div className="w-px bg-slate-200 absolute left-2.5 top-5 bottom-0" />
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Languages className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">19:24:12 - Translation & STT Compilation Complete</span>
                  <span className="text-slate-400">Detected language type ({activePreset.detectedLang}). English string compiled.</span>
                </div>
              </div>

              <div className="flex gap-3 relative">
                <div className="w-px bg-slate-200 absolute left-2.5 top-5 bottom-0" />
                <div className="w-5 h-5 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                  <Database className="w-3 h-3 text-violet-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">19:24:14 - NLP Structuring & Triage Recommendation Generated</span>
                  <span className="text-slate-400">Extracted severity index ({activePreset.extractedFields.severity}) and parsed clinical symptoms.</span>
                </div>
              </div>

              <div className="flex gap-3 relative">
                <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">19:24:15 - TTS Output & Intake Complete</span>
                  <span className="text-slate-400">Audio playback triggered on kiosk output speaker. Triage ticket sent to triage coordinator dashboard.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
