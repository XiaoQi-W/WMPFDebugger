import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/hooks/useDebugger";

interface LogViewerProps {
  logs: LogEntry[];
}

const levelColors: Record<string, string> = {
  info: "text-foreground",
  error: "text-destructive",
  debug: "text-muted-foreground",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function LogViewer({ logs }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (el && autoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      autoScrollRef.current = atBottom;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-xs text-muted-foreground">日志输出</span>
        <span className="text-xs text-muted-foreground">{logs.length} 条</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 min-h-0"
      >
        {logs.length === 0 ? (
          <span className="text-muted-foreground">等待日志...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{formatTime(log.timestamp)}</span>
              <span className={cn(levelColors[log.level] || "text-foreground")}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
