"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, MapPin, Clock, ShieldCheck, ChevronRight, Play, Camera, Loader2, Info } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { supabase } from "../../../lib/supabaseClient";
import { analyzeLocalVideo, getDistressEvents, DistressEvent } from "../../../lib/api/video";

interface UnifiedAlert {
  id: string;
  source: "db" | "cctv";
  hospital: string;
  type: string;
  confidence: number;
  wait: string;
  severity: "critical" | "high" | "medium";
  description: string;
  recommendation: string;
}

const sevColor: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-100",
  high: "bg-amber-50 text-amber-700 border-amber-100",
  medium: "bg-blue-50 text-blue-700 border-blue-100",
};

const SAMPLE_VIDEOS = [
  {
    path: "../imageVideoBackend/SampleVideo/clip_01_baseline.mp4",
    previewUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    name: "Baseline (CCTV-01)"
  },
  {
    path: "../imageVideoBackend/SampleVideo/clip_02_immobility.mp4",
    previewUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    name: "Immobility (CCTV-02)"
  },
  {
    path: "../imageVideoBackend/SampleVideo/clip_03_bending.mp4",
    previewUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400",
    name: "Repeated Bending (CCTV-03)"
  },
  {
    path: "../imageVideoBackend/SampleVideo/clip_04_collapse.mp4",
    previewUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400",
    name: "Sudden Collapse (CCTV-04)"
  },
  {
    path: "../imageVideoBackend/SampleVideo/clip_05_crowd.mp4",
    previewUrl: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400",
    name: "Crowd Formation (CCTV-05)"
  },
  {
    path: "../imageVideoBackend/SampleVideo/clip_06_stable.mp4",
    previewUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
    name: "Stable CCTV-06"
  }
];

function getRecommendation(signalType: string): string {
  switch (signalType) {
    case "SUDDEN_COLLAPSE":
      return "Immediate dispatch: Patient collapsed. Send emergency response team and stretcher immediately. ETA 30s.";
    case "PROLONGED_IMMOBILITY":
      return "Check-in required: Patient has been immobile for an extended period. Send nurse to verify wellness.";
    case "CROWD_FORMATION":
      return "Security review: Unreasonable density/converging detected in Waiting Area. Staff monitor congestion.";
    case "ERRATIC_PACING":
      return "Triage assistance: Patient exhibits pacing behavior indicating distress. Staff check-in recommended.";
    case "REPEATED_BENDING":
      return "Triage check-in: Repeated bending detected. Staff check if patient requires pain management or physical help.";
    default:
      return "Verify status: Dispatch triage assistant to WAITING_AREA to check on patient.";
  }
}

function getSeverity(signalType: string): "critical" | "high" | "medium" {
  if (signalType === "SUDDEN_COLLAPSE") return "critical";
  if (signalType === "PROLONGED_IMMOBILITY" || signalType === "CROWD_FORMATION") return "high";
  return "medium";
}

export default function Alerts() {
  const [dbAlerts, setDbAlerts] = useState<UnifiedAlert[]>([]);
  const [cctvAlerts, setCctvAlerts] = useState<UnifiedAlert[]>([]);
  const [selected, setSelected] = useState<UnifiedAlert | null>(null);
  
  const [activeTab, setActiveTab] = useState<"db" | "cctv">("db");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<typeof SAMPLE_VIDEOS[0] | null>(null);

  const fetchDbAlerts = async () => {
    try {
      const { data } = await supabase
        .from("distress_events")
        .select("id, type, confidence, event_timestamp, patients ( target_hospital_id, base_severity )");

      if (data) {
        const mapped: UnifiedAlert[] = data.map((d: any) => ({
          id: "AL-" + d.id.substring(0, 4),
          source: "db",
          hospital: "Hospital " + (d.patients?.target_hospital_id?.substring(0, 4) || "Unknown"),
          type: d.type || "Distress",
          confidence: Math.round(d.confidence || 0),
          wait: d.event_timestamp ? new Date(d.event_timestamp).toLocaleTimeString() : "Just now",
          severity: (d.patients?.base_severity > 7) ? "critical" : (d.patients?.base_severity > 4) ? "high" : "medium",
          description: "Distress event logged in patients database.",
          recommendation: "Review medical history and dispatch triage nurse."
        }));
        setDbAlerts(mapped);
        if (mapped.length > 0 && activeTab === "db") setSelected(mapped[0]);
      }
    } catch (err) {
      console.error("Supabase load failed, using local fallback DB alerts:", err);
    }
  };

  const handleAnalyzeVideo = async (video: typeof SAMPLE_VIDEOS[0]) => {
    setSelectedVideo(video);
    setLoading(true);
    setError(null);
    setActiveTab("cctv");

    try {
      const result = await analyzeLocalVideo(video.path);
      const mappedEvents: UnifiedAlert[] = result.events.map((e, idx) => ({
        id: `AL-${e.eventId.substring(0, 4)}`,
        source: "cctv",
        hospital: `CCTV (${e.zone})`,
        type: e.signalType,
        confidence: Math.round(e.confidence * 100),
        wait: new Date(e.timestamp).toLocaleTimeString(),
        severity: getSeverity(e.signalType),
        description: `Visual distress signal (${e.signalType}) detected by CCTV analytics in the ${e.zone.toLowerCase()}.`,
        recommendation: getRecommendation(e.signalType)
      }));

      setCctvAlerts(mappedEvents);
      if (mappedEvents.length > 0) {
        setSelected(mappedEvents[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      console.error(err);
      setError("Backend connection failed. Displaying simulated video events.");
      
      // Fallback mock data matching this specific clip if possible
      const mockResult: UnifiedAlert[] = [
        {
          id: "AL-mock1",
          source: "cctv",
          hospital: "CCTV (WAITING_AREA)",
          type: video.name.includes("Collapse") ? "SUDDEN_COLLAPSE" : video.name.includes("Immobility") ? "PROLONGED_IMMOBILITY" : video.name.includes("Bending") ? "REPEATED_BENDING" : video.name.includes("Crowd") ? "CROWD_FORMATION" : "ERRATIC_PACING",
          confidence: 89,
          wait: new Date().toLocaleTimeString(),
          severity: video.name.includes("Collapse") ? "critical" : "high",
          description: `Visual distress signal detected by mock backup fallback for ${video.name}.`,
          recommendation: getRecommendation(video.name.includes("Collapse") ? "SUDDEN_COLLAPSE" : "PROLONGED_IMMOBILITY")
        }
      ];
      setCctvAlerts(mockResult);
      setSelected(mockResult[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbAlerts();
  }, []);

  const alertsToShow = activeTab === "db" ? dbAlerts : cctvAlerts;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900" style={{ fontSize: "22px", fontWeight: 700 }}>Distress & Video Alerts</h1>
          <p className="text-sm text-slate-500">Real-time AI vision pipeline · clinician verification required.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {alertsToShow.length} active alerts
          </span>
          <button onClick={fetchDbAlerts} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"><RefreshCw className="w-4 h-4" /> Refresh DB</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900" style={{ fontWeight: 600 }}>CCTV Feed Analysis</h3>
              {loading && <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_VIDEOS.map((v, i) => (
                <div 
                  key={i} 
                  onClick={() => handleAnalyzeVideo(v)}
                  className={`relative aspect-video rounded-lg overflow-hidden group cursor-pointer border-2 transition ${selectedVideo?.path === v.path ? "border-blue-500" : "border-transparent"}`}
                >
                  <ImageWithFallback src={v.previewUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center">
                    <Play className="w-5 h-5 text-white mb-1" />
                    <span className="text-[9px] text-white text-center px-1 font-semibold leading-tight">{v.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 flex">
              <button 
                onClick={() => { setActiveTab("db"); if (dbAlerts.length > 0) setSelected(dbAlerts[0]); }}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition ${activeTab === "db" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
              >
                DB Patient Alerts
              </button>
              <button 
                onClick={() => { setActiveTab("cctv"); if (cctvAlerts.length > 0) setSelected(cctvAlerts[0]); }}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition ${activeTab === "cctv" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
              >
                CCTV AI Events ({cctvAlerts.length})
              </button>
            </div>

            {error && (
              <div className="m-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-[10px] text-amber-800">
                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs">Analyzing CCTV frames...</span>
                </div>
              ) : alertsToShow.length > 0 ? (
                alertsToShow.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition ${selected?.id === a.id ? "bg-blue-50/40" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.severity === "critical" ? "bg-rose-50 text-rose-600" : a.severity === "high" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-900 font-semibold truncate">{a.hospital}</span>
                        <span className="text-xs text-slate-400">{a.id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${sevColor[a.severity]}`}>{a.type}</span>
                        <span className="text-xs text-slate-500">{a.confidence}% · {a.wait}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active alerts in this category. Click a CCTV Feed to run AI analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-5">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="aspect-video bg-slate-900 relative">
                <ImageWithFallback src={selectedVideo?.previewUrl || SAMPLE_VIDEOS[3].previewUrl} alt="" className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play className="w-7 h-7 text-slate-900 ml-1" /></button>
                </div>
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE · WAITING_AREA_CCTV
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white text-xs">
                  <Camera className="w-3.5 h-3.5" /> {selected.hospital}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs border ${sevColor[selected.severity]}`} style={{ fontWeight: 600 }}>{selected.type}</span>
                    <h3 className="text-slate-900 mt-2" style={{ fontSize: "18px", fontWeight: 700 }}>Alert {selected.id}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <Stat icon={ShieldCheck} label="Confidence" value={`${selected.confidence}%`} />
                  <Stat icon={MapPin} label="Location" value={selected.hospital} />
                  <Stat icon={Clock} label="Detected" value={selected.wait} />
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-2">Event Description</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{selected.description}</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-xs text-blue-700 mb-1" style={{ fontWeight: 600 }}>Recommended Action</p>
                  <p className="text-sm text-slate-800">{selected.recommendation}</p>
                </div>

                <textarea placeholder="Triage notes (optional)…" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 mb-3 min-h-[80px]" />
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm">Dismiss</button>
                  <button className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm shadow-lg shadow-blue-200">Confirm & Dispatch</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center min-h-[400px] text-slate-400">
              No alert selected. Select an alert from the list on the left to view action recommendations.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Icon className="w-3 h-3" />{label}</div>
      <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
