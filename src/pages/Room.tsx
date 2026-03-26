import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Swords, Users, Play, ExternalLink, Trophy, Clock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  user_id: string;
  status: string;
  score: number;
  solve_time_seconds: number | null;
  profiles: { display_name: string | null; elo_rating: number; leetcode_username: string | null } | null;
}

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [problem, setProblem] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Load room
  useEffect(() => {
    if (!code) return;
    const loadRoom = async () => {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code)
        .single();
      if (!roomData) {
        toast({ title: "Room not found", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setRoom(roomData);
    };
    loadRoom();
  }, [code]);

  // Load participants
  useEffect(() => {
    if (!room) return;
    const loadParticipants = async () => {
      const { data } = await supabase
        .from("room_participants")
        .select("*, profiles!room_participants_user_id_fkey(display_name, elo_rating, leetcode_username)")
        .eq("room_id", room.id);
      if (data) setParticipants(data as any);
    };
    loadParticipants();

    // Subscribe to participant changes
    const channel = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${room.id}` }, () => {
        loadParticipants();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (payload) => {
        setRoom(payload.new);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_problems", filter: `room_id=eq.${room.id}` }, (payload) => {
        setProblem(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  // Load problem if room in progress
  useEffect(() => {
    if (!room || room.status !== "in_progress") return;
    supabase
      .from("room_problems")
      .select("*")
      .eq("room_id", room.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setProblem(data);
      });
  }, [room?.status]);

  // Timer
  useEffect(() => {
    if (!problem || room?.status !== "in_progress") return;
    const start = new Date(problem.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [problem, room?.status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isHost = user?.id === room?.host_user_id;

  const startBattle = async () => {
    if (!room || !user) return;
    setStarting(true);
    try {
      // Call edge function to pick a problem
      const { data, error } = await supabase.functions.invoke("pick-problem", {
        body: { room_id: room.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Battle started!", description: `Problem: ${data.title}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const markSubmitted = async () => {
    if (!user || !room) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("room_participants")
        .update({ status: "submitted" as any, solve_time_seconds: elapsed })
        .eq("room_id", room.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Submitted!", description: `Solve time: ${formatTime(elapsed)}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen gradient-arena flex items-center justify-center">
        <div className="text-primary animate-pulse-neon font-mono">Loading room...</div>
      </div>
    );
  }

  const isWaiting = room.status === "waiting";
  const isInProgress = room.status === "in_progress";
  const isCompleted = room.status === "completed";
  const myParticipation = participants.find((p) => p.user_id === user?.id);

  return (
    <div className="min-h-screen gradient-arena">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-foreground">Room</span>
              <span className="font-mono text-primary text-glow tracking-widest">{room.code}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full font-mono text-xs ${
              isWaiting ? "bg-secondary text-secondary-foreground" :
              isInProgress ? "bg-primary/20 text-primary animate-pulse-neon" :
              "bg-muted text-muted-foreground"
            }`}>
              {isWaiting ? "WAITING" : isInProgress ? "● LIVE" : "COMPLETED"}
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Problem card (when in progress) */}
          {isInProgress && problem && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-primary/60">PROBLEM</span>
                  <h2 className="font-display font-semibold text-foreground">{problem.title}</h2>
                  <div className="flex gap-2 mt-1">
                    {problem.topics?.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-xs">{t}</span>
                    ))}
                    <span className={`px-2 py-0.5 rounded-sm font-mono text-xs ${
                      problem.difficulty === "Easy" ? "bg-primary/20 text-primary" :
                      problem.difficulty === "Medium" ? "bg-secondary text-secondary-foreground" :
                      "bg-destructive/20 text-destructive"
                    }`}>{problem.difficulty}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-primary/60">ELAPSED</span>
                  <div className="font-mono text-2xl text-primary text-glow">{formatTime(elapsed)}</div>
                </div>
              </div>
              <div className="px-6 py-3 flex items-center justify-between">
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline font-mono text-sm"
                >
                  Open on LeetCode <ExternalLink className="h-3 w-3" />
                </a>
                {myParticipation?.status !== "submitted" && (
                  <Button
                    onClick={markSubmitted}
                    disabled={submitting}
                    className="bg-primary text-primary-foreground font-display box-glow"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "I Solved It!"}
                  </Button>
                )}
                {myParticipation?.status === "submitted" && (
                  <span className="text-primary font-mono text-sm">✓ Submitted ({formatTime(myParticipation.solve_time_seconds || 0)})</span>
                )}
              </div>
            </div>
          )}

          {/* Completed */}
          {isCompleted && (
            <div className="glass rounded-xl p-6 text-center">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">Battle Complete!</h2>
              <p className="text-muted-foreground font-mono text-sm">Results below</p>
            </div>
          )}

          {/* Participants */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Players ({participants.length}/{room.max_players})
                </h2>
              </div>
              {isWaiting && isHost && participants.length >= 2 && (
                <Button
                  onClick={startBattle}
                  disabled={starting}
                  className="bg-primary text-primary-foreground font-display box-glow"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {starting ? "Starting..." : "Start Battle"}
                </Button>
              )}
            </div>

            <div className="divide-y divide-border/30">
              {participants
                .sort((a, b) => {
                  if (isInProgress || isCompleted) {
                    if (a.status === "submitted" && b.status !== "submitted") return -1;
                    if (b.status === "submitted" && a.status !== "submitted") return 1;
                    return (a.solve_time_seconds || 99999) - (b.solve_time_seconds || 99999);
                  }
                  return 0;
                })
                .map((p, i) => (
                <div key={p.id} className="flex items-center px-6 py-3 hover:bg-secondary/30 transition-colors">
                  <span className="font-mono text-xs text-muted-foreground w-8">#{i + 1}</span>
                  <div className="flex-1">
                    <span className="font-display font-medium text-foreground">
                      {p.profiles?.display_name || "Player"}
                    </span>
                    {p.profiles?.leetcode_username && (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        @{p.profiles.leetcode_username}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground mr-4">
                    {p.profiles?.elo_rating || 1500} ELO
                  </span>
                  {isInProgress && p.solve_time_seconds != null && (
                    <span className="font-mono text-xs text-primary mr-4">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(p.solve_time_seconds)}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-sm font-mono text-xs ${
                    p.status === "submitted" ? "bg-primary/20 text-primary" :
                    p.status === "coding" ? "bg-secondary text-secondary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {p.status}
                    {p.user_id === room.host_user_id && " · host"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting info */}
          {isWaiting && (
            <div className="text-center">
              <p className="text-muted-foreground font-mono text-sm">
                Share room code <span className="text-primary text-glow font-bold tracking-widest">{room.code}</span> with friends
              </p>
              {!isHost && (
                <p className="text-muted-foreground font-mono text-xs mt-2">
                  Waiting for host to start the battle...
                </p>
              )}
              {isHost && participants.length < 2 && (
                <p className="text-muted-foreground font-mono text-xs mt-2">
                  Need at least 2 players to start
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;
