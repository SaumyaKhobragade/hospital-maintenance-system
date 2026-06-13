"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { JAVA_API, HospitalStats, Hospital, BackendEvent } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SseContextValue {
  stats: HospitalStats | null;
  lastHospital: Hospital | null;
  events: BackendEvent[];
  connected: boolean;
  reconnecting: boolean;
}

const defaultCtx: SseContextValue = {
  stats: null,
  lastHospital: null,
  events: [],
  connected: false,
  reconnecting: false,
};

const SseContext = createContext<SseContextValue>(defaultCtx);

// ─── Helper: single reconnecting EventSource ─────────────────────────────────

function openStream(
  path: string,
  eventName: string,
  onData: (d: unknown) => void,
  onStatus: (s: "open" | "error") => void
): () => void {
  let es: EventSource | null = null;
  let retryDelay = 2000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let alive = true;

  function connect() {
    if (!alive) return;
    const url = `${JAVA_API}/${path.replace(/^\//, "")}`;
    es = new EventSource(url);

    es.onopen = () => { retryDelay = 2000; onStatus("open"); };

    es.addEventListener(eventName, (e: MessageEvent) => {
      try { onData(JSON.parse(e.data)); } catch { onData(e.data); }
    });

    // Spring also sends unnamed "message" events on some SSE paths
    if (eventName !== "message") {
      es.onmessage = (e: MessageEvent) => {
        try { onData(JSON.parse(e.data)); } catch { onData(e.data); }
      };
    }

    es.onerror = () => {
      es?.close();
      onStatus("error");
      if (!alive) return;
      timer = setTimeout(() => { retryDelay = Math.min(retryDelay * 2, 30000); connect(); }, retryDelay);
    };
  }

  connect();

  return () => {
    alive = false;
    if (timer) clearTimeout(timer);
    es?.close();
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SseProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [lastHospital, setLastHospital] = useState<Hospital | null>(null);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [errCount, setErrCount] = useState(0);

  const connected = openCount > 0 && errCount < 3;
  const reconnecting = errCount > 0;

  const onStatus = useCallback((s: "open" | "error") => {
    if (s === "open") setOpenCount(c => c + 1);
    else setErrCount(c => c + 1);
  }, []);

  useEffect(() => {
    const cleanupStats = openStream(
      "sse/stats", "stats",
      (d) => setStats(d as HospitalStats),
      onStatus
    );
    const cleanupHospital = openStream(
      "sse/hospital", "hospital",
      (d) => setLastHospital(d as Hospital),
      onStatus
    );
    const cleanupEvents = openStream(
      "sse/events", "event",
      (d) => setEvents(prev => [d as BackendEvent, ...prev].slice(0, 100)),
      onStatus
    );

    return () => { cleanupStats(); cleanupHospital(); cleanupEvents(); };
  }, [onStatus]);

  return (
    <SseContext.Provider value={{ stats, lastHospital, events, connected, reconnecting }}>
      {children}
    </SseContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSseStats()      { return useContext(SseContext).stats; }
export function useSseHospital()   { return useContext(SseContext).lastHospital; }
export function useSseEvents()     { return useContext(SseContext).events; }
export function useSseConnected()  { return useContext(SseContext).connected; }
export function useSseReconnecting() { return useContext(SseContext).reconnecting; }
