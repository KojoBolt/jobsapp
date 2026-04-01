import { useEffect, useRef } from "react";

interface DeployTerminalProps {
  logs?: string[];
}

const DeployTerminal = ({ logs = [] }: DeployTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new logs come in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const displayLines = logs.length > 0 ? logs : ["Waiting to initialize..."];

  return (
    <div className="w-full rounded-lg border border-border/30 bg-background/80 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/20 bg-muted/30 px-3 py-1.5">
        <div className="h-2 w-2 rounded-full bg-destructive/60" />
        <div className="h-2 w-2 rounded-full bg-status-reviewing/60" />
        <div className="h-2 w-2 rounded-full bg-status-interview/60" />
        <span className="ml-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
          system terminal
        </span>
      </div>
      <div
        ref={containerRef}
        className="h-28 overflow-y-auto px-3 py-2 font-mono text-[10px] leading-relaxed"
      >
        {displayLines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-status-interview">›</span>
            <span className="text-primary/80">[{String(i).padStart(3, "0")}]</span>
            <span className="text-foreground/70">{line}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-status-interview">›</span>
          <span className="animate-pulse text-primary">_</span>
        </div>
      </div>
    </div>
  );
};

export default DeployTerminal;