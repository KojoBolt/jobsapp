import { useState, useEffect, useRef } from "react";

const terminalLines = [
  "Syncing Identity Vault...",
  "Checking Proxy Nodes...",
  "Human Reviewers Online...",
  "Loading Resume Variants...",
  "Connecting to Job Boards...",
  "Encrypting Application Data...",
  "Verifying LinkedIn OAuth...",
  "Calibrating AI Match Engine...",
  "Scanning Priority Links...",
  "Establishing Secure Channels...",
  "Deploying Cover Letter Templates...",
  "Running Compliance Checks...",
  "Initializing Human Review Queue...",
  "System Ready — Launching...",
];

const DeployTerminal = () => {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[idx]]);
        idx++;
      } else {
        // Loop through randomized status lines
        const extras = [
          "Heartbeat OK — All systems nominal",
          "Queue processing — batch 0x3FA2",
          "Human specialist #4 assigned",
          "Cover letter variant B selected",
          "AI confidence: 94.7%",
          "Proxy node latency: 12ms",
        ];
        setLines((prev) => [
          ...prev.slice(-12),
          extras[Math.floor(Math.random() * extras.length)],
        ]);
      }
    }, 400);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

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
        {lines.map((line, i) => (
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
