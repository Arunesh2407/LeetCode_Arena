import { motion } from "framer-motion";
import { Activity, TrendingUp, Waves } from "lucide-react";

import {
  useRoomPointSnapshots,
  useRoomPulseEvents,
} from "@/hooks/use-arena-data";

export default function Pulse() {
  const { data: roomPoints, isLoading: loadingPoints } =
    useRoomPointSnapshots();
  const { data: events, isLoading: loadingEvents } = useRoomPulseEvents();

  const totalPoints = roomPoints.reduce(
    (sum, room) => sum + room.totalPoints,
    0,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold font-mono tracking-wider neon-text-secondary flex items-center gap-3">
          <Waves className="w-8 h-8" /> ROOM PULSE
        </h1>
        <p className="text-muted-foreground font-mono mt-2 border-l-2 border-secondary/50 pl-3">
          Live point velocity and activity stream across every room you joined.
        </p>
      </motion.div>

      {loadingPoints ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : roomPoints.length === 0 ? (
        <div className="rounded-xl border border-secondary/25 bg-black/45 p-6 text-center font-mono text-sm text-muted-foreground">
          No room point snapshots available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roomPoints.map((room, index) => (
            <motion.div
              key={room.roomId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-xl border p-5"
              style={{
                borderColor: "rgba(0,255,247,0.22)",
                background: "rgba(0,0,0,0.58)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="font-mono text-xs text-cyan-300 tracking-widest mb-2">
                {room.roomName}
              </div>
              <div className="text-3xl font-bold text-white">
                {room.totalPoints}
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>RANK #{room.currentRank}</span>
                <span className="text-cyan-300">+{room.velocity}/min</span>
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                SOLVED: {room.solved}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <section
        className="rounded-xl border p-5"
        style={{
          borderColor: "rgba(191,0,255,0.22)",
          background: "rgba(0,0,0,0.58)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-mono text-purple-300 text-sm tracking-widest flex items-center gap-2">
            <Activity className="h-4 w-4" /> // LIVE EVENT FEED //
          </h2>
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> TOTAL POINTS: {totalPoints}
          </div>
        </div>

        {loadingEvents ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border px-4 py-6 text-center font-mono text-sm text-muted-foreground"
            style={{
              borderColor: "rgba(191,0,255,0.18)",
              background: "rgba(7,6,24,0.56)",
            }}
          >
            No live events to display.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border px-4 py-3"
                style={{
                  borderColor: "rgba(191,0,255,0.18)",
                  background: "rgba(7,6,24,0.56)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm text-white">
                      {event.actor} • {event.roomName}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mt-1">
                      {event.change}
                    </div>
                  </div>
                  <div className="font-mono text-right">
                    <div className="text-cyan-300 text-sm">
                      +{event.points} pts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.happenedAt}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
