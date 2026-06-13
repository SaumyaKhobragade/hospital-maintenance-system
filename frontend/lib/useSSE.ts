"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { JAVA_API } from "./api";

export interface SseOptions {
  onOpen?: () => void;
  onError?: (err: Event) => void;
}

/**
 * Auto-reconnecting SSE hook.
 * Connects to `JAVA_API/<path>`.
 * Returns { data: T | null, connected: boolean, error: string | null }
 */
export function useSSE<T = unknown>(
  path: string,
  eventName = "message",
  options: SseOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(2000);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const url = `${JAVA_API}/${path.replace(/^\//, "")}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      retryDelay.current = 2000; // reset backoff
      setConnected(true);
      setError(null);
      options.onOpen?.();
    };

    es.addEventListener(eventName, (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        setData(JSON.parse(e.data) as T);
      } catch {
        setData(e.data as unknown as T);
      }
    });

    // Also listen to default "message" events (Spring may send them without a name)
    if (eventName !== "message") {
      es.onmessage = (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          setData(JSON.parse(e.data) as T);
        } catch {
          setData(e.data as unknown as T);
        }
      };
    }

    es.onerror = (e) => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
      setConnected(false);
      setError("SSE disconnected — reconnecting…");
      options.onError?.(e);

      // Exponential backoff, capped at 30s
      const delay = retryDelay.current;
      retryDelay.current = Math.min(delay * 2, 30000);

      retryRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [path, eventName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { data, connected, error };
}
