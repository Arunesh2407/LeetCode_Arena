import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, ArrowRight, LogOut, User, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setLeetcodeUsername(data.leetcode_username || "");
          }
        });
    }
  }, [user]);

  const handleSaveLeetcode = async () => {
    if (!user || !leetcodeUsername.trim()) return;
    setSavingUsername(true);
    const { error } = await supabase
      .from("profiles")
      .update({ leetcode_username: leetcodeUsername.trim() })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "LeetCode username linked." });
      setProfile((p: any) => ({ ...p, leetcode_username: leetcodeUsername.trim() }));
    }
    setSavingUsername(false);
  };

  const createRoom = async () => {
    if (!user) return;
    setCreating(true);
    try {
      // Generate unique code
      const { data: codeData } = await supabase.rpc("generate_room_code");
      const code = codeData as string;

      const { data: room, error } = await supabase
        .from("rooms")
        .insert({ code, host_user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Join as participant
      await supabase
        .from("room_participants")
        .insert({ room_id: room.id, user_id: user.id });

      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast({ title: "Error creating room", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !roomCode.trim()) return;
    setJoining(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.trim().toUpperCase())
        .single();

      if (roomError || !room) throw new Error("Room not found");
      if (room.status !== "waiting") throw new Error("Room is no longer accepting players");

      const { error } = await supabase
        .from("room_participants")
        .insert({ room_id: room.id, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          // Already in room
          navigate(`/room/${room.code}`);
          return;
        }
        throw error;
      }

      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-arena flex items-center justify-center">
        <div className="text-primary animate-pulse-neon font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-arena">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground">LeetCode Arena</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <User className="h-4 w-4" />
              {profile?.display_name || user?.email}
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-foreground">{profile?.elo_rating || 1500} ELO</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="border-border text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-4xl text-foreground mb-2">
          Welcome, <span className="text-primary text-glow">{profile?.display_name || "Coder"}</span>
        </h1>
        <p className="text-muted-foreground font-mono mb-12">Ready to battle?</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          {/* LeetCode Profile */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">LeetCode Profile</h2>
            <div className="flex gap-2">
              <Input
                placeholder="LeetCode username"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
              <Button
                onClick={handleSaveLeetcode}
                disabled={savingUsername}
                className="bg-primary text-primary-foreground font-display"
              >
                {savingUsername ? "..." : "Link"}
              </Button>
            </div>
            {profile?.leetcode_username && (
              <p className="text-sm text-primary font-mono mt-2">
                ✓ Linked: {profile.leetcode_username}
              </p>
            )}
          </div>

          {/* Create Room */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Create a Room</h2>
            <Button
              onClick={createRoom}
              disabled={creating}
              className="w-full bg-primary text-primary-foreground font-display font-semibold text-lg py-6 box-glow hover:box-glow-strong transition-shadow"
            >
              <Swords className="mr-2 h-5 w-5" />
              {creating ? "Creating..." : "Create Room"}
            </Button>
          </div>

          {/* Join Room */}
          <div className="glass rounded-xl p-6 md:col-span-2">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Join a Room</h2>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Enter room code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary uppercase tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={joinRoom}
                disabled={joining || roomCode.length < 6}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-display"
              >
                {joining ? "..." : "Join"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
