import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, ArrowLeft, Chrome, Github, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthAuth = async (provider: "google" | "github" | "discord") => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-arena flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono text-sm">Back to home</span>
        </button>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Swords className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl text-foreground">
              LeetCode Arena
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl text-foreground text-center mb-2">
            {isLogin ? "Welcome Back" : "Join the Arena"}
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-8 font-mono">
            {isLogin
              ? "Sign in to your account"
              : "Create your competitive profile"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary"
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground focus:border-primary"
              required
              minLength={6}
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-display font-semibold box-glow hover:box-glow-strong transition-shadow"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted-foreground font-mono">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-border hover:bg-secondary"
              onClick={() => handleOAuthAuth("google")}
              disabled={loading}
            >
              <Chrome className="h-4 w-4" />
              <span className="sr-only">Continue with Google</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border hover:bg-secondary"
              onClick={() => handleOAuthAuth("github")}
              disabled={loading}
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">Continue with GitHub</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border hover:bg-secondary"
              onClick={() => handleOAuthAuth("discord")}
              disabled={loading}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="sr-only">Continue with Discord</span>
            </Button>
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
