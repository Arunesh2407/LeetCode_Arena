import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-arena-data";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podium = [top3[1], top3[0], top3[2]];
  const hasLeaderboardData = leaderboard.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold tracking-widest uppercase mb-2"
          style={{
            color: "#bf00ff",
            textShadow:
              "0 0 20px rgba(191,0,255,0.7), 0 0 40px rgba(191,0,255,0.3)",
          }}
        >
          Global Rankings
        </motion.h1>
        <p className="font-mono text-muted-foreground">
          Live global ladder across signed-in arena operators.
        </p>
      </div>

      {hasLeaderboardData ? (
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
                    {user.rating} R
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
                    boxShadow: isFirst
                      ? "0 0 30px rgba(255,215,0,0.3)"
                      : isSecond
                        ? "0 0 20px rgba(191,0,255,0.3)"
                        : "0 0 20px rgba(0,255,247,0.3)",
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
      ) : (
        <div className="mb-16 rounded-xl border border-border/60 bg-card/60 p-8 text-center font-mono text-sm text-muted-foreground">
          No leaderboard entries yet.
        </div>
      )}

      {rest.length > 0 && (
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-black/40 border-b border-border/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4 text-right">Streak</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rest.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      className="border-b border-border/30 hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-cyan-400/80 font-bold">
                        #{user.rank}
                      </td>
                      <td className="px-6 py-4 font-bold text-white group-hover:text-cyan-400 transition-all">
                        {user.username}
                      </td>
                      <td className="px-6 py-4">{user.rating}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded">
                          {user.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="flex items-center justify-end gap-1 text-purple-400">
                          <Zap className="w-4 h-4" /> {user.streak}
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
    </div>
  );
}
