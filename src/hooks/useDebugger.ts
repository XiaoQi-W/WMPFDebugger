import { useState, useEffect, useCallback, useRef } from "react";

export type Status = "idle" | "starting" | "running" | "error";

export interface LogEntry {
  level: "info" | "error" | "debug";
  message: string;
  timestamp: number;
}

export function useDebugger() {
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [versions, setVersions] = useState<number[]>([]);
  const maxLogs = 500;
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    window.debuggerAPI.getVersions().then(setVersions);
    window.debuggerAPI.getStatus().then((s: string) => setStatus(s as Status));

    const unsubLog = window.debuggerAPI.onLog((entry: LogEntry) => {
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > maxLogs ? next.slice(-maxLogs) : next;
      });
    });
    const unsubStatus = window.debuggerAPI.onStatusChange((s: string) => {
      setStatus(s as Status);
    });

    cleanupRef.current = [unsubLog, unsubStatus];
    return () => cleanupRef.current.forEach((fn) => fn());
  }, []);

  const start = useCallback(async (debugPort: number, cdpPort: number) => {
    setLogs([]);
    const result = await window.debuggerAPI.start({ debugPort, cdpPort });
    if (!result.success) {
      setLogs((prev) => [...prev, { level: "error", message: result.error || "Unknown error", timestamp: Date.now() }]);
    }
    return result;
  }, []);

  const stop = useCallback(async () => {
    return window.debuggerAPI.stop();
  }, []);

  return { status, logs, versions, start, stop };
}
