/**
 * Typed API client for the Java Spring Boot backend.
 * All endpoints under /api/simulation and /api/policies.
 */

export const JAVA_API = (process.env.NEXT_PUBLIC_JAVA_API_URL ?? "http://localhost:9090/api").replace(/\/$/, "");

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HospitalStats {
  totalHospitals: number;
  totalPatientsWaiting: number;
  totalDoctorsActive: number;
  surgeActive: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  maxCapacity: number;
  x: number;
  y: number;
  totalQueueSize: number;
  activeDoctorCount: number;
  staffCounts: Record<string, number>;
  activeStaffCounts: Record<string, number>;
  waitingRooms: Record<string, PatientQueue[]>;
}

export interface PatientQueue {
  id: string;
  baseSeverity: number;
  arrivalTime: number;
  targetHospitalId: string;
  treating: boolean;
}

export interface BackendEvent {
  type: string;
  patientId?: string;
  hospitalId?: string;
  sourceHospitalId?: string;
  sourceHospitalName?: string;
  targetHospitalId?: string;
  targetHospitalName?: string;
  severity?: number;
  benefitScore?: number;
  count?: number;
  message?: string;
  timestamp: number;
  status?: string;
  [key: string]: unknown;
}

export type PolicyMap = Record<string, number>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${JAVA_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${JAVA_API}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Simulation endpoints ─────────────────────────────────────────────────────

export const api = {
  /** Initialize city hospitals (fetches from Supabase or uses fallback count) */
  initCity: (count = 10) =>
    post<string>("/simulation/init", { count: String(count) }),

  /** Inject a single patient into a hospital */
  injectPatient: (hospitalId: string, severity: number) =>
    post<{ patientId: string; status: string }>("/simulation/patient", {
      hospitalId,
      severity,
    }),

  /** Trigger a random patient surge */
  triggerSurge: (count: number) =>
    post<string>("/simulation/surge", { count: String(count) }),

  /** Flood N hospitals with many patients */
  floodHospitals: (patientsPerHospital = 200, hospitalsToFlood = 3) =>
    post<Record<string, unknown>>("/simulation/flood", {
      patientsPerHospital,
      hospitalsToFlood,
    }),

  /** Apply global staff shortage (factor: 0–1, e.g. 0.6 = 40% reduction) */
  triggerStaffShortage: (factor: number) =>
    post<string>("/simulation/staffing/shortage", { factor }),

  /** Trigger a distress event for a patient */
  triggerDistress: (hospitalId: string, patientId: string, distressLevel: number) =>
    post<string>("/simulation/distress", { hospitalId, patientId, distressLevel }),

  /** Confirm a distress event (HITL approve) */
  confirmDistress: (patientId: string) =>
    post<string>("/simulation/distress/confirm", { patientId }),

  /** Dismiss a distress event */
  dismissDistress: (patientId: string) =>
    post<string>("/simulation/distress/dismiss", { patientId }),

  /** Get current city stats (REST snapshot) */
  getStats: () => get<HospitalStats>("/simulation/stats"),

  /** Get all hospitals */
  getHospitals: () => get<Hospital[]>("/simulation/hospitals"),

  /** Get single hospital */
  getHospital: (id: string) => get<Hospital>(`/simulation/hospital/${id}`),

  // ─── Policy endpoints ───────────────────────────────────────────────────────

  /** Fetch all triage policies */
  getPolicies: () => get<PolicyMap>("/policies"),

  /** Update a single policy key */
  updatePolicy: (key: string, value: number) =>
    post<string>("/policies/update", { key, value }),
};
