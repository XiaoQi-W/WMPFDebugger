interface VersionSelectorProps {
  versions: number[];
}

export function VersionSelector({ versions }: VersionSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">支持的 WMPF 版本</label>
      <div className="flex flex-wrap gap-1.5">
        {versions.length === 0 ? (
          <span className="text-xs text-muted-foreground">未检测到版本配置</span>
        ) : (
          versions.map((v) => (
            <span
              key={v}
              className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border"
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
