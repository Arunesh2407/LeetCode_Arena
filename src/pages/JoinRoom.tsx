import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DoorOpen, Plus, Radio, Users } from "lucide-react";
import { useLocation } from "wouter";

import { NeonButton } from "@/components/ui/NeonButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useJoinedRooms } from "@/hooks/use-arena-data";
import { useToast } from "@/hooks/use-toast";
import {
  createRoomForCurrentUser,
  joinRoomByCodeForCurrentUser,
  validateRoomCode,
} from "@/lib/room-service";

const ROOM_TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Math",
  "Dynamic Programming",
  "Sorting",
  "Greedy",
  "Depth-First Search",
  "Binary Search",
  "Database",
  "Bit Manipulation",
  "Matrix",
  "Tree",
  "Breadth-First Search",
  "Two Pointers",
  "Prefix Sum",
  "Heap (Priority Queue)",
  "Simulation",
  "Counting",
  "Graph Theory",
  "Binary Tree",
  "Stack",
  "Sliding Window",
  "Enumeration",
  "Design",
  "Backtracking",
  "Union-Find",
  "Number Theory",
  "Linked List",
  "Ordered Set",
  "Segment Tree",
  "Monotonic Stack",
  "Divide and Conquer",
  "Trie",
  "Combinatorics",
  "Bitmask",
  "Queue",
  "Recursion",
  "Geometry",
  "Binary Indexed Tree",
  "Memoization",
  "Binary Search Tree",
  "Hash Function",
  "Topological Sort",
  "Shortest Path",
  "String Matching",
  "Rolling Hash",
  "Game Theory",
  "Interactive",
  "Data Stream",
  "Monotonic Queue",
  "Brainteaser",
  "Doubly-Linked List",
  "Merge Sort",
  "Randomized",
  "Counting Sort",
  "Iterator",
  "Concurrency",
  "Quickselect",
  "Suffix Array",
  "Sweep Line",
  "Probability and Statistics",
  "Minimum Spanning Tree",
  "Bucket Sort",
  "Shell",
  "Reservoir Sampling",
  "Eulerian Circuit",
  "Radix Sort",
  "Strongly Connected Component",
  "Rejection Sampling",
  "Biconnected Component",
];

function MaskedCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = code.length > 0 ? "*".repeat(code.length) : "******";

  return (
    <span
      role="button"
      tabIndex={0}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      className="inline-flex rounded border border-cyan-400/20 bg-cyan-500/5 px-2 py-0.5 font-mono tracking-[0.22em] text-cyan-200 outline-none transition-colors hover:border-cyan-300/50 focus:border-cyan-300/60"
      aria-label="Room code hidden by default"
      title="Hover to reveal room code"
    >
      {revealed ? code : masked}
    </span>
  );
}

export default function JoinRoom() {
  const { data: joinedRooms, isLoading } = useJoinedRooms();
  const { user, openAuthModal } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rooms, setRooms] = useState(joinedRooms);
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"topics" | "list_url">(
    "topics",
  );
  const [roomName, setRoomName] = useState("");
  const [listUrl, setListUrl] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Array"]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState("");

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);

  useEffect(() => {
    setRooms(joinedRooms);
  }, [joinedRooms]);

  const requireAuth = () => {
    if (user) return true;
    toast({
      title: "Sign in required",
      description: "Authenticate first to create or join a room.",
    });
    openAuthModal();
    return false;
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((item) => item !== topic);
      }
      return [...current, topic];
    });
  };

  const handleJoinRoom = async () => {
    if (!requireAuth()) return;

    if (!validateRoomCode(normalizedCode)) {
      toast({
        title: "Invalid room code",
        description: "Use a 6-character alphanumeric room code.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const room = await joinRoomByCodeForCurrentUser(normalizedCode);
      toast({
        title: "Room linked",
        description: `Connected to ${room.name}.`,
      });
      setCode("");
      setRooms((current) => {
        if (current.some((item) => item.id === room.id)) {
          return current;
        }

        return [
          {
            id: room.id,
            code: room.code,
            name: room.name,
            memberCount: 1,
            status: room.status,
            joinedAt: new Date().toISOString(),
          },
          ...current,
        ];
      });
      setLocation(`/arena/1?room=${room.code}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not join room.";
      toast({
        title: "Join failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!requireAuth()) return;

    setIsCreating(true);
    try {
      const room = await createRoomForCurrentUser({
        roomName,
        sourceType: createMode,
        listUrl: createMode === "list_url" ? listUrl : undefined,
        topics: createMode === "topics" ? selectedTopics : undefined,
      });

      setCreatedRoomCode(room.code);
      setCode(room.code);
      setRooms((current) => [
        {
          id: room.id,
          code: room.code,
          name: room.name,
          memberCount: 1,
          status: "ACTIVE",
          joinedAt: new Date().toISOString(),
        },
        ...current.filter((item) => item.id !== room.id),
      ]);

      toast({
        title: "Room created",
        description:
          createMode === "list_url"
            ? "New room created using custom list URL."
            : "New room created using selected topics.",
      });

      setCreateOpen(false);
      setRoomName("");
      setListUrl("");
      setCreateMode("topics");
      setSelectedTopics(["Array"]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not create room. Please verify DB schema and try again.";
      toast({
        title: "Create room failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-mono tracking-wider neon-text-primary flex items-center gap-3">
              <DoorOpen className="w-8 h-8" /> ROOMS
            </h1>
            <p className="text-muted-foreground font-mono mt-2 border-l-2 border-primary/50 pl-3">
              View joined rooms, connect via code, and create new rooms.
            </p>
          </div>

          <NeonButton
            className="px-5 py-3 text-xs sm:text-sm"
            glow
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> CREATE ROOM
          </NeonButton>
        </div>

        {createdRoomCode && (
          <div className="mt-4 rounded-lg border border-cyan-400/25 bg-cyan-500/5 px-3 py-2 font-mono text-xs text-muted-foreground">
            Newly created room code: <MaskedCode code={createdRoomCode} />
          </div>
        )}
      </motion.div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl border-cyan-400/30 bg-black/85 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-cyan-300 tracking-widest">
              CREATE ROOM
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Configure room source and generate a new private room code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="ROOM NAME (OPTIONAL)"
              maxLength={64}
              className="border-cyan-400/25 bg-black/50 font-mono text-xs"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setCreateMode("topics")}
                className={`px-3 py-1 border font-mono text-[11px] tracking-wide ${
                  createMode === "topics"
                    ? "border-cyan-300 text-cyan-200 bg-cyan-500/10"
                    : "border-white/20 text-muted-foreground"
                }`}
              >
                TOPIC AUTO-FETCH
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("list_url")}
                className={`px-3 py-1 border font-mono text-[11px] tracking-wide ${
                  createMode === "list_url"
                    ? "border-cyan-300 text-cyan-200 bg-cyan-500/10"
                    : "border-white/20 text-muted-foreground"
                }`}
              >
                CUSTOM LIST URL
              </button>
            </div>

            {createMode === "list_url" ? (
              <Input
                value={listUrl}
                onChange={(event) => setListUrl(event.target.value)}
                placeholder="https://leetcode.com/problem-list/..."
                className="border-cyan-400/25 bg-black/50 font-mono text-xs"
              />
            ) : (
              <div className="max-h-64 overflow-y-auto rounded border border-white/10 bg-black/40 p-2">
                <div className="flex flex-wrap gap-2">
                  {ROOM_TOPICS.map((topic) => {
                    const selected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-2.5 py-1 border font-mono text-[11px] tracking-wide rounded-full ${
                          selected
                            ? "border-cyan-300 text-cyan-200 bg-cyan-500/10"
                            : "border-white/20 text-muted-foreground"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 border border-white/20 text-muted-foreground font-mono text-xs hover:bg-white/5"
                onClick={() => setCreateOpen(false)}
              >
                CANCEL
              </button>
              <NeonButton
                className="px-4 py-2 text-xs"
                onClick={handleCreateRoom}
                disabled={isCreating}
                glow
              >
                {isCreating ? "CREATING..." : "CREATE ROOM"}
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <motion.section
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border p-5"
          style={{
            borderColor: "rgba(0,255,247,0.22)",
            background: "rgba(0,0,0,0.58)",
            backdropFilter: "blur(14px)",
          }}
        >
          <h2 className="font-mono text-cyan-300 text-sm tracking-widest mb-4">
            // CONNECT WITH ROOM CODE //
          </h2>
          <div className="space-y-3">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ENTER 6-CHAR CODE"
              maxLength={6}
              className="font-mono text-center tracking-[0.35em] border-cyan-400/35 bg-black/40"
            />
            <NeonButton className="w-full py-3" onClick={handleJoinRoom} glow>
              {isJoining ? "JOINING..." : "OPEN ROOM"}
            </NeonButton>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border p-5"
          style={{
            borderColor: "rgba(191,0,255,0.22)",
            background: "rgba(0,0,0,0.58)",
            backdropFilter: "blur(14px)",
          }}
        >
          <h2 className="font-mono text-purple-300 text-sm tracking-widest mb-4">
            // YOUR JOINED ROOMS //
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="rounded-lg border px-4 py-6 text-center font-mono text-sm text-muted-foreground"
                  style={{
                    borderColor: "rgba(0,255,247,0.2)",
                    background: "rgba(2,8,24,0.55)",
                  }}
                >
                  No joined rooms yet. Create one or join with a room code.
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style={{
                      borderColor: "rgba(0,255,247,0.2)",
                      background: "rgba(2,8,24,0.55)",
                    }}
                  >
                    <div>
                      <div className="font-mono text-white text-sm tracking-wide">
                        {room.name}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">
                        CODE: <MaskedCode code={room.code} /> • MEMBERS: {room.memberCount} •{" "}
                        {room.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <NeonButton
                        className="px-4 py-2 text-xs"
                        onClick={() => setLocation("/problems")}
                        glow
                      >
                        OPEN PROBLEMS
                      </NeonButton>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-2 border border-purple-400/30 text-purple-300 text-xs font-mono hover:bg-purple-500/10"
                        onClick={() => setLocation("/pulse")}
                      >
                        <Radio className="h-3.5 w-3.5" /> PULSE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/10 font-mono text-xs text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rooms are now loaded from Supabase memberships.
          </div>
        </motion.section>
      </div>
    </div>
  );
}
