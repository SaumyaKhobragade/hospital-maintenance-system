/**
 * API Client utilities for Video-Based Behavioral Distress Detection (VBDD).
 */

export const PYTHON_API = (process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8003").replace(/\/$/, "");

export interface DistressEvent {
  eventId: string;
  signalType: "PROLONGED_IMMOBILITY" | "SUDDEN_COLLAPSE" | "REPEATED_BENDING" | "ERRATIC_PACING" | "CROWD_FORMATION";
  confidence: number;
  zone: string;
  timestamp: string;
  blobId?: number;
}

export interface VideoAnalysisResponse {
  events: DistressEvent[];
  videoProcessed: boolean;
  framesAnalyzed: number;
  totalDurationSec: number;
  message: string;
}

/**
 * Analyzes a local video path using the unified backend.
 * @param videoPath relative/absolute path of video file
 */
export async function analyzeLocalVideo(videoPath: string): Promise<VideoAnalysisResponse> {
  const response = await fetch(`${PYTHON_API}/api/video/analyze-local?video_path=${encodeURIComponent(videoPath)}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to analyze video: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retrieves all detected distress events.
 */
export async function getDistressEvents(): Promise<DistressEvent[]> {
  const response = await fetch(`${PYTHON_API}/api/video/events`);
  if (!response.ok) {
    throw new Error(`Failed to fetch distress events: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Clears all distress events.
 */
export async function clearDistressEvents(): Promise<{ message: string; count: number }> {
  const response = await fetch(`${PYTHON_API}/api/video/events`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to clear distress events: ${response.statusText}`);
  }
  return response.json();
}
