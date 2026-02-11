import { cn } from "@/lib/utils";
import type { Status } from "@/hooks/useDebugger";
import { Play, Square, Loader2 } from "lucide-react";

interface ControlPanelProps {
  status: Status;
  onStart: () => void;
  onStop: () => void;
}

const statusConfig: Record<Status, { label: string; color: string; dotColor: string }> = {
  idle: { label: "空闲", color: "text-muted-foreground", dotColor: "bg-muted-foreground" },
  starting: { label: "启动中...", color: "text-accent", dotColor: "bg-accent" },
  running: { label: "运行中", color: "text-success", dotColor: "bg-success" },
  error: { label: "错误", color: "text-destructive", dotColor: "bg-destructive" },
};

export function ControlPanel({ status, onStart, onStop }: ControlPanelProps) {
  const isRunning = status === "running";
  const isStarting = status === "starting";
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={isRunning ? onStop : onStart}
        disabled={isStarting}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isRunning
            ? "bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30"
            : "bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30"
        )}
      >
        {isStarting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRunning ? (
          <Square className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isStarting ? "启动中..." : isRunning ? "停止" : "启动"}
      </button>

      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full", config.dotColor, status === "running" && "animate-pulse")} />
        <span className={cn("text-sm", config.color)}>{config.label}</span>
      </div>
    </div>
  );
}
