import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swords, ArrowRight, LogIn, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CursorTrailBackground from "@/components/CursorTrailBackground";
import RobotBackground from "@/components/RobotBackground";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [roomCode, setRoomCode] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateRoom = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/dashboard");
  };

  const handleJoinRoom = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!roomCode.trim()) return;

    try {
      const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.trim().toUpperCase())
        .single();

      if (!room) {
        toast({ title: "Room not found", variant: "destructive" });
        return;
      }

      // Try to join
      await supabase
        .from("room_participants")
        .insert({ room_id: room.id, user_id: user.id });

      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="container mx-auto px-6 py-5 flex justify-end">
          {user ? (
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="h-10 rounded-full border-border/70 bg-background/40 px-4 font-mono text-foreground backdrop-blur-md transition-all hover:bg-background/60 hover:text-foreground hover:border-primary/60 hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"
            >
              <UserCircle2 className="mr-2 h-4 w-4 text-primary" />
              Profile
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="h-10 rounded-full border-border/70 bg-background/40 px-4 font-mono text-foreground backdrop-blur-md transition-all hover:bg-background/60 hover:text-foreground hover:border-primary/60 hover:shadow-[0_0_18px_rgba(34,197,94,0.45)]"
            >
              <LogIn className="mr-2 h-4 w-4 text-primary" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover opacity-30"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 gradient-arena opacity-80" />
        <CursorTrailBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-primary/20 animate-scan-line" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
          <span className="text-sm font-mono text-primary">
            REAL-TIME COMPETITIVE CODING
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-800 text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6">
          <span className="text-foreground">LeetCode</span>
          <br />
          <span className="text-primary text-glow-strong">Arena</span>
        </h1>

        <RobotBackground />

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 mt-2">
          <Button
            size="lg"
            onClick={handleCreateRoom}
            className="bg-primary text-primary-foreground font-display font-semibold text-lg px-8 py-6 box-glow hover:box-glow-strong transition-shadow"
          >
            <Swords className="mr-2 h-5 w-5" />
            Create Room
          </Button>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-48 bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary uppercase tracking-widest"
              maxLength={6}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={handleJoinRoom}
              className="border-primary/40 text-primary hover:bg-primary/10 font-display py-6"
            >
              Join
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
