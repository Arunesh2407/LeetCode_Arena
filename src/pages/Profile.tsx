import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Activity, Shield, Cpu, Network, UserCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useProfile } from "@/hooks/use-arena-data";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [compactHud, setCompactHud] = useState(false);
  const [reducedFx, setReducedFx] = useState(false);

  useEffect(() => {
    setCompactHud(localStorage.getItem("arena.config.compactHud") === "true");
    setReducedFx(localStorage.getItem("arena.config.reducedFx") === "true");
  }, []);

  if (isLoading || !profile)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const skillData = [
    { subject: "Algorithms", A: 120, fullMark: 150 },
    { subject: "Data Structs", A: 98, fullMark: 150 },
    { subject: "Math", A: 86, fullMark: 150 },
    { subject: "DP", A: 99, fullMark: 150 },
    { subject: "Graphs", A: 85, fullMark: 150 },
    { subject: "Strings", A: 65, fullMark: 150 },
  ];

  const solvedData = [
    { name: "EASY", count: profile.solved.EASY, color: "#22c55e" },
    { name: "MEDIUM", count: profile.solved.MEDIUM, color: "#eab308" },
    { name: "HARD", count: profile.solved.HARD, color: "#ef4444" },
    { name: "INSANE", count: profile.solved.INSANE, color: "#bf00ff" },
  ];

  const displayName =
    user?.user_metadata?.display_name?.toString() || profile.username;
  const accountLabel = user?.email || "Guest account";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(0,255,247,0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: "rgba(0,255,247,0.05)" }}
        />

        <div
          className="relative w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            border: "3px solid rgba(0,255,247,0.5)",
            boxShadow: "0 0 20px rgba(0,255,247,0.3)",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400/30 animate-spin"
            style={{ animationDuration: "10s" }}
          />
          <UserCircle
            className="w-16 h-16 text-cyan-400"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,255,247,0.8))" }}
          />
        </div>

        <div className="text-center md:text-left z-10 flex-1">
          <div
            className="inline-flex items-center gap-2 font-mono text-sm mb-2 px-3 py-1 rounded-full"
            style={{
              color: "#00fff7",
              background: "rgba(0,255,247,0.1)",
              border: "1px solid rgba(0,255,247,0.2)",
            }}
          >
            <Shield className="w-4 h-4" /> STATUS: OPERATIONAL
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider">
            {displayName}
          </h1>
          <p className="font-mono text-xs text-cyan-300/70">{accountLabel}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 font-mono text-sm text-muted-foreground mt-4">
            <div className="flex flex-col">
              <span className="text-xs">GLOBAL RANK</span>
              <span className="text-xl text-white">#{profile.rank}</span>
            </div>
            <div className="flex flex-col border-l border-border/50 pl-6">
              <span className="text-xs">POWER RATING</span>
              <span
                className="text-xl"
                style={{
                  color: "#bf00ff",
                  textShadow: "0 0 10px rgba(191,0,255,0.7)",
                }}
              >
                {profile.rating}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(0,255,247,0.15)",
              backdropFilter: "blur(16px)",
              borderTop: "2px solid rgba(0,255,247,0.4)",
            }}
          >
            <h3 className="font-mono text-xl mb-6 flex items-center gap-2 text-white">
              <Cpu className="text-cyan-400" /> Matrix Decryptions
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={solvedData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#888",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid #333",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {solvedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(0,255,247,0.15)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h3 className="font-mono text-xl mb-4 flex items-center gap-2 text-white">
              <Activity style={{ color: "#bf00ff" }} /> Uplink History
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.recentSubmissions.map((status, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-sm"
                  style={{
                    background:
                      status === 1
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(239,68,68,0.2)",
                    border: `1px solid ${status === 1 ? "#22c55e" : "#ef4444"}`,
                    boxShadow:
                      status === 1 ? "0 0 5px rgba(34,197,94,0.5)" : "none",
                  }}
                  title={status === 1 ? "Accepted" : "Rejected"}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="p-6 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(191,0,255,0.2)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h3 className="font-mono text-xl mb-4 text-white">
              Arena Config Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded border border-cyan-400/25 bg-cyan-400/5 p-3">
                <div className="text-muted-foreground mb-1">Theme</div>
                <div className="text-cyan-300 uppercase">
                  {theme || "system"}
                </div>
              </div>
              <div className="rounded border border-cyan-400/25 bg-cyan-400/5 p-3">
                <div className="text-muted-foreground mb-1">Compact HUD</div>
                <div className="text-cyan-300">
                  {compactHud ? "ENABLED" : "DISABLED"}
                </div>
              </div>
              <div className="rounded border border-cyan-400/25 bg-cyan-400/5 p-3">
                <div className="text-muted-foreground mb-1">Reduced FX</div>
                <div className="text-cyan-300">
                  {reducedFx ? "ENABLED" : "DISABLED"}
                </div>
              </div>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-3">
              These values are controlled in the avatar dropdown under Arena
              Config.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl flex flex-col items-center justify-center min-h-[400px]"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(0,255,247,0.15)",
            backdropFilter: "blur(16px)",
          }}
        >
          <h3 className="font-mono text-xl mb-2 flex items-center gap-2 text-white self-start w-full border-b border-border/50 pb-4">
            <Network style={{ color: "#bf00ff" }} /> Neural Capabilities
          </h3>
          <div className="w-full h-80 mt-4 relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: "rgba(191,0,255,0.05)" }}
            />
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#888", fontFamily: "monospace", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 150]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#bf00ff"
                  fill="#bf00ff"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
