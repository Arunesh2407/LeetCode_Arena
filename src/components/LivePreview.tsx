import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  user_id: string;
  status: string;
  solve_time_seconds: number | null;
  profiles: {
    display_name: string | null;
    elo_rating: number | null;
    leetcode_username: string | null;
  } | null;
}

const LivePreview = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [room, setRoom] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const loadProblem = async (roomId: string) => {
    const { data } = await supabase
      .from("room_problems")
      .select("*")
      .eq("room_id", roomId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setProblem(data ?? null);
  };

  const loadParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from("room_participants")
      .select(
        "*, profiles!room_participants_user_id_fkey(display_name, elo_rating, leetcode_username)",
      )
      .eq("room_id", roomId);

    setParticipants((data as Participant[]) ?? []);
  };

  const loadLiveBattle = async () => {
    if (!user) {
      setLoadingLive(false);
      return;
    }

    setLoadingLive(true);

    const { data: liveRoom } = await supabase
      .from("rooms")
      .select("*")
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!liveRoom) {
      setRoom(null);
      setProblem(null);
      setParticipants([]);
      setLoadingLive(false);
      return;
    }

    setRoom(liveRoom);
    await Promise.all([
      loadProblem(liveRoom.id),
      loadParticipants(liveRoom.id),
    ]);
    setLoadingLive(false);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRoom(null);
      setProblem(null);
      setParticipants([]);
      setElapsed(0);
      setLoadingLive(false);
      return;
    }

    loadLiveBattle();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !room?.id) return;

    const channel = supabase
      .channel(`live-preview-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          loadParticipants(room.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_problems",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          loadProblem(room.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const nextRoom = payload.new as any;
          if (!nextRoom || nextRoom.status !== "in_progress") {
            setRoom(null);
            setProblem(null);
            setParticipants([]);
            return;
          }
          setRoom(nextRoom);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, user?.id]);

  useEffect(() => {
    if (!problem?.started_at) {
      setElapsed(0);
      return;
    }

    const start = new Date(problem.started_at).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [problem?.started_at]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (authLoading || loadingLive) return null;

  if (!user) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Live <span className="text-primary text-glow">Battle</span>{" "}
              Preview
            </h2>
          </div>

          <div className="max-w-3xl mx-auto glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground font-mono mb-5">
              Sign in to view real-time live battles.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground font-display font-semibold box-glow hover:box-glow-strong transition-shadow"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!room) return null;

  const problemTopics = Array.isArray(problem?.topics) ? problem.topics : [];

  const getPlayerName = (player: Participant) => {
    if (player.profiles?.display_name) return player.profiles.display_name;
    if (player.profiles?.leetcode_username)
      return player.profiles.leetcode_username;
    return `user_${player.user_id.slice(0, 6)}`;
  };

  const getPlayerTime = (player: Participant) => {
    if (
      player.status === "submitted" &&
      typeof player.solve_time_seconds === "number"
    ) {
      return formatTime(player.solve_time_seconds);
    }
    return "--:--";
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
              room://{room.code?.toLowerCase()} -{" "}
              {problem?.title ?? "Loading problem..."}
            </span>
            <span className="ml-auto font-mono text-xs text-primary animate-pulse-neon">
              ● LIVE
            </span>
          </div>

          {/* Problem info */}
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-primary/60">
                  PROBLEM
                </span>
                <h3 className="font-display font-semibold text-foreground">
                  {problem?.title ?? "Loading problem..."}
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-primary/60">
                  ELAPSED
                </span>
                <div className="font-mono text-xl text-primary text-glow">
                  {formatTime(elapsed)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {problemTopics.map((topic: string) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-xs"
                >
                  {topic}
                </span>
              ))}
              {problem?.difficulty && (
                <span
                  className={`px-2 py-0.5 rounded-sm font-mono text-xs ${
                    problem.difficulty === "Easy"
                      ? "bg-primary/20 text-primary"
                      : problem.difficulty === "Medium"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {problem.difficulty}
                </span>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="divide-y divide-border/30">
            {participants.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center px-6 py-3 hover:bg-secondary/30 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground w-6">
                  #{i + 1}
                </span>
                <span className="font-display font-medium text-foreground flex-1">
                  {getPlayerName(player)}
                </span>
                <span className="font-mono text-xs text-muted-foreground mr-6">
                  {player.profiles?.elo_rating ?? "-"} ELO
                </span>
                <span className="font-mono text-xs mr-4 text-muted-foreground">
                  {getPlayerTime(player)}
                </span>
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
