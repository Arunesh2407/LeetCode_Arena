import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { useJoinedRooms, useLeaderboard } from "@/hooks/use-arena-data";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: joinedRooms, isLoading: loadingRooms } = useJoinedRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  useEffect(() => {
    if (!selectedRoomId && joinedRooms.length > 0) {
      setSelectedRoomId(joinedRooms[0].id);
    }
  }, [joinedRooms, selectedRoomId]);

  const activeRoom = useMemo(
    () => joinedRooms.find((room) => room.id === selectedRoomId) ?? null,
    [joinedRooms, selectedRoomId],
  );

  const { data: leaderboard, isLoading } = useLeaderboard(selectedRoomId || undefined);

  if (loadingRooms) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const podium = [top3[1], top3[0], top3[2]];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-widest uppercase mb-3"
          style={{
            color: "#bf00ff",
            textShadow:
              "0 0 20px rgba(191,0,255,0.7), 0 0 40px rgba(191,0,255,0.3)",
          }}
        >
          Room Leaderboard
        </motion.h1>
        <p className="font-mono text-muted-foreground">
          Rankings are scoped to each room and calculated from solved assigned problems.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="font-mono text-xs text-muted-foreground mb-2">Select Room</div>
        {joinedRooms.length === 0 ? (
          <div className="font-mono text-sm text-muted-foreground">Join a room to view leaderboard.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {joinedRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={cn(
                  "px-3 py-1.5 border rounded font-mono text-xs transition-colors",
                  selectedRoomId === room.id
                    ? "border-cyan-300 text-cyan-200 bg-cyan-500/10"
                    : "border-white/20 text-muted-foreground hover:text-white",
                )}
              >
                {room.name} ({room.code})
              </button>
            ))}
          </div>
        )}
      </div>

      {activeRoom && (
        <div className="mb-8 font-mono text-sm text-cyan-300">
          Active room: {activeRoom.name} • Code: {activeRoom.code}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/60 p-8 text-center font-mono text-sm text-muted-foreground">
          No points yet in this room.
        </div>
      ) : (
        <>
          <div className="flex justify-center items-end h-64 mb-16 gap-2 md:gap-6 px-4">
            {podium.map((user, idx) => {
              if (!user) return null;
              const isFirst = user.rank === 1;
              const isSecond = user.rank === 2;
              const height = isFirst ? 200 : isSecond ? 160 : 120;

              return (
                <motion.div
                  key={user.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height, opacity: 1 }}
                  transition={{ duration: 0.8, delay: idx * 0.2, type: "spring" }}
                  className="relative flex flex-col items-center justify-end w-24 md:w-32"
                >
                  <div className="absolute -top-24 flex flex-col items-center text-center w-full">
                    {isFirst && (
                      <Crown
                        className="w-8 h-8 mb-2 animate-bounce"
                        style={{
                          color: "#ffd700",
                          filter: "drop-shadow(0 0 10px rgba(255,215,0,0.8))",
                        }}
                      />
                    )}
                    <span
                      className={cn(
                        "font-bold font-mono truncate w-full text-center",
                        isFirst ? "text-lg" : "text-md text-white",
                      )}
                      style={isFirst ? { color: "#ffd700" } : {}}
                    >
                      {user.username}
                    </span>
                    <span className="font-mono text-xs text-cyan-400">
                      {user.totalPoints} pts
                    </span>
                  </div>

                  <div
                    className="w-full rounded-t-lg relative overflow-hidden"
                    style={{
                      height: "100%",
                      background: isFirst
                        ? "linear-gradient(to top, rgba(255,215,0,0.1), rgba(255,215,0,0.3))"
                        : isSecond
                          ? "linear-gradient(to top, rgba(191,0,255,0.1), rgba(191,0,255,0.3))"
                          : "linear-gradient(to top, rgba(0,255,247,0.1), rgba(0,255,247,0.3))",
                      borderTop: `2px solid ${isFirst ? "#ffd700" : isSecond ? "#bf00ff" : "#00fff7"}`,
                      borderLeft: `1px solid ${isFirst ? "#ffd700" : isSecond ? "#bf00ff" : "#00fff7"}`,
                      borderRight: `1px solid ${isFirst ? "#ffd700" : isSecond ? "#bf00ff" : "#00fff7"}`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-4xl md:text-6xl font-black opacity-20">
                      {user.rank}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead className="bg-black/40 border-b border-border/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Points</th>
                      <th className="px-6 py-4">Solved</th>
                      <th className="px-6 py-4 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rest.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.05 }}
                          className="border-b border-border/30 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-cyan-400/80 font-bold">#{user.rank}</td>
                          <td className="px-6 py-4 font-bold text-white">{user.username}</td>
                          <td className="px-6 py-4">{user.totalPoints}</td>
                          <td className="px-6 py-4">{user.solvedCount}</td>
                          <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 justify-end">
                              <Trophy className="w-3.5 h-3.5" />
                              {new Date(user.updatedAt).toLocaleString()}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
