import { useState, useCallback } from "react";
import { useDebugger } from "@/hooks/useDebugger";
import { ControlPanel } from "@/components/ControlPanel";
import { PortConfig } from "@/components/PortConfig";
import { VersionSelector } from "@/components/VersionSelector";
import { LogViewer } from "@/components/LogViewer";
import { Copy, Check } from "lucide-react";

export default function App() {
  const { status, logs, versions, start, stop } = useDebugger();
  const [debugPort, setDebugPort] = useState(9421);
  const [cdpPort, setCdpPort] = useState(62000);

  const isActive = status === "running" || status === "starting";

  const devtoolsUrl = `devtools://devtools/bundled/inspector.html?ws=127.0.0.1:${cdpPort}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(devtoolsUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [devtoolsUrl]);

  const handleStart = () => start(debugPort, cdpPort);
  const handleStop = () => stop();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">WMPF Debugger</h1>
        <ControlPanel status={status} onStart={handleStart} onStop={handleStop} />
      </div>

      {/* Config bar */}
      <div className="flex items-end gap-6 px-5 py-3 border-b border-border">
        <PortConfig
          debugPort={debugPort}
          cdpPort={cdpPort}
          onDebugPortChange={setDebugPort}
          onCdpPortChange={setCdpPort}
          disabled={isActive}
        />
        <VersionSelector versions={versions} />
        {status === "running" && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground select-text">{devtoolsUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="复制地址"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Log viewer */}
      <LogViewer logs={logs} />
    </div>
  );
}
