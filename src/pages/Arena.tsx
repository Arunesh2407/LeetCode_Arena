import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Cpu, Zap, ArrowLeft, Terminal } from "lucide-react";
import { useProblem } from "@/hooks/use-arena-data";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { NeonButton } from "@/components/ui/NeonButton";
import { cn } from "@/lib/utils";

export default function Arena() {
  const [, params] = useRoute("/arena/:id");
  const id = params?.id || "1";
  const { data: problem, isLoading } = useProblem(id);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (problem && !code) {
      setCode(problem.starterCode);
    }
  }, [problem]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput(null);
    setTimeout(() => {
      setIsRunning(false);
      const isSuccess = Math.random() > 0.3;
      if (isSuccess) {
        setOutput(
          "> COMPILING...\n> LINKING LIBS...\n> EXECUTION COMPLETE\n\nSTATUS: ACCEPTED\nRUNTIME: 42ms\nMEMORY: 18.2MB",
        );
      } else {
        setOutput(
          "> COMPILING...\n> EXECUTION FAILED\n\nRUNTIME_ERROR: NullPointer in sector 7G\n   at function() line 14\n\nSTATUS: REJECTED",
        );
      }
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-xl border border-border/60 bg-card/70 p-8 text-center">
          <h2 className="font-mono text-xl text-white mb-2">
            Problem Not Available
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            No preloaded problem data exists for this room yet.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 font-mono text-cyan-300 hover:text-cyan-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Room Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-background/90 backdrop-blur-xl">
      <div className="w-full md:w-1/3 lg:w-2/5 border-r border-border/50 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/20 sticky top-0 z-10 backdrop-blur-md">
          <Link
            href="/problems"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </Link>
          <CyberBadge difficulty={problem.difficulty} />
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {problem.title}
            </h1>
            <div className="flex gap-2 flex-wrap mb-4">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono px-2 py-0.5 border border-primary/30 text-primary/80 bg-primary/5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="font-mono text-sm text-muted-foreground leading-relaxed space-y-4">
            {problem.description.split("\n\n").map((para, i) => (
              <p key={i}>
                {para.split("`").map((text, j) =>
                  j % 2 === 1 ? (
                    <code
                      key={j}
                      className="text-cyan-400 bg-cyan-400/10 px-1 rounded font-mono"
                    >
                      {text}
                    </code>
                  ) : (
                    text
                  ),
                )}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0a0a0f]">
        <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-background/50">
          <div className="flex items-center gap-2 font-mono text-sm text-primary">
            <Terminal className="w-4 h-4" /> MAIN.JS
          </div>
          <NeonButton
            variant="primary"
            className="px-4 py-1.5 text-xs flex items-center gap-2"
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" /> EXECUTING...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> INJECT CODE
              </>
            )}
          </NeonButton>
        </div>

        <div className="flex-1 relative border-b border-border/50">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-background/80 border-r border-border/50 text-right pr-2 py-4 font-mono text-muted-foreground/50 select-none overflow-hidden text-sm leading-relaxed">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 pl-16 pr-4 py-4 w-full h-full bg-transparent text-[#e0e0e0] font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 selection:bg-primary/30"
          />
          <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground/30 pointer-events-none uppercase">
            // INSERT LOGIC //
          </div>
        </div>

        <div className="h-1/3 min-h-[160px] bg-black/80 p-4 font-mono text-sm overflow-y-auto relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          <h3 className="text-primary/50 text-xs mb-2 flex items-center gap-2">
            <Cpu className="w-3 h-3" /> COMPILER_OUT
          </h3>

          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground flex items-center gap-2"
              >
                <span className="w-2 h-4 bg-primary animate-pulse inline-block" />{" "}
                PROCESSING DATA STREAM...
              </motion.div>
            ) : output ? (
              <motion.pre
                key="output"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "whitespace-pre-wrap font-mono",
                  output.includes("ACCEPTED")
                    ? "text-green-400"
                    : "text-red-400",
                )}
              >
                {output}
              </motion.pre>
            ) : (
              <div key="idle" className="text-muted-foreground/30">
                Awaiting execution...
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
