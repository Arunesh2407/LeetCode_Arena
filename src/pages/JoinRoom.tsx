import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DoorOpen, Radio, Users } from "lucide-react";
import { useLocation } from "wouter";

import { NeonButton } from "@/components/ui/NeonButton";
import { Input } from "@/components/ui/input";
import { useJoinedRooms } from "@/hooks/use-arena-data";
import { useToast } from "@/hooks/use-toast";

export default function JoinRoom() {
  const { data: rooms, isLoading } = useJoinedRooms();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState("");

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);

  const handleJoinRoom = () => {
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      toast({
        title: "Invalid room code",
        description: "Use a 6-character alphanumeric room code.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Room linked",
      description: `Room ${normalizedCode} was added to your roster (mock).`,
    });
    setCode("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold font-mono tracking-wider neon-text-primary flex items-center gap-3">
          <DoorOpen className="w-8 h-8" /> JOIN ROOM
        </h1>
        <p className="text-muted-foreground font-mono mt-2 border-l-2 border-primary/50 pl-3">
          Attach yourself to existing battle rooms with a valid room code.
        </p>
      </motion.div>

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
            // CONNECT USING ROOM CODE //
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
              JOIN ROOM
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
              {rooms.map((room) => (
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
                      CODE: {room.code} • MEMBERS: {room.memberCount} •{" "}
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
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/10 font-mono text-xs text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Backend rooms sync will replace this mock list later.
          </div>
        </motion.section>
      </div>
    </div>
  );
}
