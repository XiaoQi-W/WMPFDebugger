interface PortConfigProps {
  debugPort: number;
  cdpPort: number;
  onDebugPortChange: (port: number) => void;
  onCdpPortChange: (port: number) => void;
  disabled: boolean;
}

export function PortConfig({ debugPort, cdpPort, onDebugPortChange, onCdpPortChange, disabled }: PortConfigProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Debug Port</label>
        <input
          type="number"
          value={debugPort}
          onChange={(e) => onDebugPortChange(Number(e.target.value))}
          disabled={disabled}
          className="w-28 px-3 py-1.5 rounded-md bg-input border border-border text-sm text-foreground
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">CDP Port</label>
        <input
          type="number"
          value={cdpPort}
          onChange={(e) => onCdpPortChange(Number(e.target.value))}
          disabled={disabled}
          className="w-28 px-3 py-1.5 rounded-md bg-input border border-border text-sm text-foreground
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  );
}
