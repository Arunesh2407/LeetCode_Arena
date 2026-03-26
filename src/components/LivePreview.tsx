import { useState, useEffect } from "react";

const players = [
  { name: "alice_dev", rating: 1842, status: "coding", time: "03:42" },
  { name: "bob_coder", rating: 1756, status: "submitted", time: "05:11" },
  { name: "charlie99", rating: 1901, status: "coding", time: "04:18" },
  { name: "diana_lc", rating: 1689, status: "idle", time: "--:--" },
];

const LivePreview = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Live <span className="text-primary text-glow">Battle</span> Preview
          </h2>
        </div>

        <div className="max-w-3xl mx-auto glass rounded-2xl overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-primary/40" />
            <div className="w-3 h-3 rounded-full bg-primary/80" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              room://arena-x7k2 — Two Sum II
            </span>
            <span className="ml-auto font-mono text-xs text-primary animate-pulse-neon">
              ● LIVE
            </span>
          </div>

          {/* Problem info */}
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-primary/60">PROBLEM</span>
                <h3 className="font-display font-semibold text-foreground">167. Two Sum II - Input Array Is Sorted</h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-primary/60">ELAPSED</span>
                <div className="font-mono text-xl text-primary text-glow">{formatTime(elapsed)}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-xs">Arrays</span>
              <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-xs">Two Pointers</span>
              <span className="px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-mono text-xs">Medium</span>
            </div>
          </div>

          {/* Players */}
          <div className="divide-y divide-border/30">
            {players.map((player, i) => (
              <div key={player.name} className="flex items-center px-6 py-3 hover:bg-secondary/30 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-6">#{i + 1}</span>
                <span className="font-display font-medium text-foreground flex-1">{player.name}</span>
                <span className="font-mono text-xs text-muted-foreground mr-6">{player.rating} ELO</span>
                <span className="font-mono text-xs mr-4 text-muted-foreground">{player.time}</span>
                <span
                  className={`px-2 py-0.5 rounded-sm font-mono text-xs ${
                    player.status === "submitted"
                      ? "bg-primary/20 text-primary"
                      : player.status === "coding"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {player.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LivePreview;
