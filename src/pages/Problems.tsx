import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Layers3, Search, Terminal, Trash2 } from "lucide-react";
import {
  useRoomProblemGroups,
  Difficulty,
  Problem,
} from "@/hooks/use-arena-data";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { Tilt3DCard } from "@/components/ui/Tilt3DCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { deleteRoomForCurrentUser } from "@/lib/room-service";

const DIFF_GLOW: Record<string, string> = {
  EASY: "#22c55e",
  MEDIUM: "#eab308",
  HARD: "#ef4444",
  INSANE: "#bf00ff",
};

function ScrollReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

function ProblemCard({
  problem,
  idx,
  onClick,
}: {
  problem: Problem;
  idx: number;
  onClick: () => void;
}) {
  const glowColor = DIFF_GLOW[problem.difficulty] || "#00fff7";

  return (
    <ScrollReveal delay={idx * 0.06}>
      <Tilt3DCard
        className="bg-card/80 backdrop-blur-md border border-border p-6 rounded-lg shadow-lg h-full"
        onClick={onClick}
        glowColor={glowColor}
        intensity={12}
      >
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)",
            backgroundSize: "14px 24px",
          }}
        />

        <div className="relative z-10 flex justify-end items-start mb-4">
          <CyberBadge difficulty={problem.difficulty} />
        </div>

        <h3 className="relative z-10 text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors leading-tight">
          {problem.title}
        </h3>

        <div className="relative z-10 flex flex-wrap gap-2 mb-5">
          {problem.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border/50"
            >
              {tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span className="text-xs font-mono text-muted-foreground px-2 py-1">
              +{problem.tags.length - 3}
            </span>
          )}
        </div>

        <div className="relative z-10 flex justify-between items-center border-t border-border/30 pt-4">
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            <div>
              Points: <span className="text-white">{problem.points ?? 0}</span>
            </div>
            <div>
              Status:{" "}
              <span
                className={problem.completed ? "text-green-400" : "text-white"}
              >
                {problem.completed ? "Completed" : "Pending"}
              </span>
            </div>
          </div>
          <motion.div
            className="font-mono text-xs flex items-center gap-1"
            style={{ color: glowColor }}
            whileHover={{ x: 4 }}
          >
            OPEN LEETCODE <span className="text-base leading-none">↗</span>
          </motion.div>
        </div>
      </Tilt3DCard>
    </ScrollReveal>
  );
}

export default function Problems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: roomGroups, isLoading } = useRoomProblemGroups();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Difficulty | "ALL">("ALL");
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>(
    {},
  );
  const [deleteConfirmRoomId, setDeleteConfirmRoomId] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [removedRoomIds, setRemovedRoomIds] = useState<Set<string>>(new Set());

  const filteredGroups = roomGroups
    .map((group) => ({
      ...group,
      problems: group.problems.filter((problem) => {
        const matchesSearch =
          problem.title.toLowerCase().includes(search.toLowerCase()) ||
          problem.tags.some((tag) =>
            tag.toLowerCase().includes(search.toLowerCase()),
          );
        const matchesFilter = filter === "ALL" || problem.difficulty === filter;
        return matchesSearch && matchesFilter;
      }),
    }))
    .filter((group) => group.problems.length > 0);

  const visibleGroups = useMemo(
    () => filteredGroups.filter((group) => !removedRoomIds.has(group.roomId)),
    [filteredGroups, removedRoomIds],
  );

  const deletingGroup = roomGroups.find(
    (group) => group.roomId === deleteConfirmRoomId,
  );

  const toggleCodeVisibility = (roomId: string) => {
    setRevealedCodes((current) => ({
      ...current,
      [roomId]: !current[roomId],
    }));
  };

  const handleDeleteRoom = async (roomId: string) => {
    setIsDeleting(true);
    try {
      await deleteRoomForCurrentUser(roomId);
      setRemovedRoomIds((current) => {
        const next = new Set(current);
        next.add(roomId);
        return next;
      });
      setDeleteConfirmRoomId(null);
      toast({
        title: "Room deleted",
        description: "The room and related data were removed.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete room.";
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold neon-text-primary uppercase flex items-center gap-3 font-mono">
            <Terminal className="w-8 h-8" /> Room Problems
          </h1>
          <p className="text-muted-foreground font-mono mt-2 border-l-2 border-primary/50 pl-3">
            Problems are grouped by your joined rooms with variable challenge
            volume.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-primary/50 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Query matrix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-background/50 border-2 border-border text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all cyber-corner"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["ALL", "EASY", "MEDIUM", "HARD", "INSANE"] as const).map((d) => (
              <motion.button
                key={d}
                onClick={() => setFilter(d)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 font-mono text-xs border rounded-sm transition-all ${
                  filter === d
                    ? "bg-primary/20 border-primary text-primary neon-text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10" style={{ perspective: "1200px" }}>
          {visibleGroups.map((group) => (
            <motion.section
              key={group.roomId}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-5"
              style={{
                borderColor: "rgba(0,255,247,0.2)",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-mono text-lg text-white flex items-center gap-2 tracking-wide">
                    <Layers3 className="h-5 w-5 text-cyan-300" />{" "}
                    {group.roomName}
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Room Code:{" "}
                    {revealedCodes[group.roomId]
                      ? group.roomCode
                      : "*".repeat(group.roomCode.length || 6)}{" "}
                    • Active problems: {group.problems.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCodeVisibility(group.roomId)}
                    className="px-3 py-2 border border-cyan-400/35 text-cyan-200 font-mono text-xs hover:bg-cyan-500/10 rounded transition-colors inline-flex items-center gap-1"
                  >
                    {revealedCodes[group.roomId] ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> HIDE CODE
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> VIEW CODE
                      </>
                    )}
                  </button>
                  {group.roomOwnerId === user?.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmRoomId(group.roomId)}
                      className="px-3 py-2 border border-red-500/50 text-red-400 font-mono text-xs hover:bg-red-500/10 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> DELETE
                    </button>
                  )}
                </div>
              </div>

              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {group.problems.map((problem, idx) => (
                    <ProblemCard
                      key={`${group.roomId}-${problem.slug}`}
                      problem={problem}
                      idx={idx}
                      onClick={() => {
                        window.open(
                          problem.url ||
                            `https://leetcode.com/problems/${problem.slug}/`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          ))}
        </div>
      )}

      {!isLoading && visibleGroups.length === 0 && (
        <div className="text-center py-20 font-mono text-muted-foreground border-2 border-dashed border-border/50 p-8">
          [ERR 404] NO ROOM PROBLEMS FOUND MATCHING QUERY
        </div>
      )}

      <Dialog
        open={!!deleteConfirmRoomId}
        onOpenChange={(open) => !open && setDeleteConfirmRoomId(null)}
      >
        <DialogContent className="max-w-sm border-red-400/30 bg-black/85 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-red-400 tracking-widest">
              DELETE ROOM
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              This action cannot be undone.{" "}
              {deletingGroup?.roomName ?? "This room"} and all associated data
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-3 py-2 border border-white/20 text-muted-foreground font-mono text-xs hover:bg-white/5"
              onClick={() => setDeleteConfirmRoomId(null)}
              disabled={isDeleting}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="px-3 py-2 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs hover:bg-red-500/20 disabled:opacity-50"
              onClick={() =>
                deleteConfirmRoomId && handleDeleteRoom(deleteConfirmRoomId)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "DELETING..." : "DELETE ROOM"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
