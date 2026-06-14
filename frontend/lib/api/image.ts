/**
 * API Client utilities for Image-Based Injury Severity Assist (ISA).
 */

export const PYTHON_API = (process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8003").replace(/\/$/, "");

export interface VisualFeatures {
  woundAreaRatio: number;
  bleedingIntensity: number;
  edgeIrregularity: number;
  colorContrast: number;
}

export interface InjuryAnalysisResult {
  analysisId: string;
  severityScore: number;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  routingRecommendation: string;
  features: VisualFeatures;
  confidence: number;
  requiresConfirmation: boolean;
  explanation: string;
  timestamp: string;
}

/**
 * Analyzes a local injury image path using the unified backend.
 * @param imagePath relative/absolute path of image file
 */
export async function analyzeLocalImage(imagePath: string): Promise<InjuryAnalysisResult> {
  const response = await fetch(`${PYTHON_API}/api/image/analyze-local?image_path=${encodeURIComponent(imagePath)}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to analyze image: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retrieves the recent injury analysis results.
 */
export async function getRecentImageResults(limit: number = 10): Promise<InjuryAnalysisResult[]> {
  const response = await fetch(`${PYTHON_API}/api/image/results?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent image results: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Clears all image results.
 */
export async function clearImageResults(): Promise<{ message: string; count: number }> {
  const response = await fetch(`${PYTHON_API}/api/image/results`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to clear image results: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Uploads and analyzes an injury image file using the unified backend.
 * @param file The image file selected by the user
 */
export async function analyzeUploadedImage(file: File): Promise<InjuryAnalysisResult> {
  const formData = new FormData();
  formData.append("image", file);
  
  const response = await fetch(`${PYTHON_API}/api/image/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to analyze uploaded image: ${response.statusText}`);
  }
  return response.json();
}

