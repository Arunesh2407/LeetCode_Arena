import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Trophy, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  const handleSaveLeetcode = async () => {
    if (!user || !leetcodeUsername.trim()) return;

    setSavingUsername(true);
    const { error } = await supabase
      .from("profiles")
      .update({ leetcode_username: leetcodeUsername.trim() })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Saved!", description: "LeetCode username linked." });
      setProfile((prev: any) => ({
        ...prev,
        leetcode_username: leetcodeUsername.trim(),
      }));
    }

    setSavingUsername(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-arena flex items-center justify-center">
        <div className="text-primary animate-pulse-neon font-mono">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-arena">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass rounded-xl p-6">
            <h1 className="font-display font-bold text-3xl text-foreground mb-2">
              Profile
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Manage your public coding identity.
            </p>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Account
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <User className="h-4 w-4" />
                {profile?.display_name || user?.email || "Unknown User"}
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  {profile?.elo_rating || 1500} ELO
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                Email: {user?.email}
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              LeetCode
            </h2>
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
                {savingUsername ? "Saving..." : "Save"}
              </Button>
            </div>
            {profile?.leetcode_username && (
              <p className="text-sm text-primary font-mono mt-3">
                Linked: {profile.leetcode_username}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
