import { useMemo, useState } from "react";
import { Chrome, Github, MessageCircle, Shield, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    signInWithEmail,
    signInWithOAuth,
    signUpWithEmail,
  } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(() => {
    if (mode === "signin") {
      return "Access the arena with your account.";
    }
    return "Create your pilot profile and enter the arena.";
  }, [mode]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setMode("signin");
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      closeAuthModal();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({ title: "Sign in failed", description: error, variant: "destructive" });
          return;
        }

        toast({ title: "Welcome back", description: "Authentication successful." });
        onOpenChange(false);
        return;
      }

      const { error } = await signUpWithEmail(email, password, displayName);
      if (error) {
        toast({ title: "Sign up failed", description: error, variant: "destructive" });
        return;
      }

      toast({
        title: "Account created",
        description: "Check your inbox to confirm your email if required.",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github" | "discord") => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast({ title: "OAuth failed", description: error, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Redirecting", description: `Continue with ${provider}.` });
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-cyan-400/30 bg-black/85 backdrop-blur-xl"
        aria-describedby="auth-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl tracking-widest text-cyan-300">
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </DialogTitle>
          <DialogDescription id="auth-modal-description" className="font-mono text-xs">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-cyan-300/70" htmlFor="displayName">
                Display Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="NeoCoder"
                required
                className="border-cyan-400/30 bg-black/40 font-mono"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-mono text-cyan-300/70" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@arena.dev"
              required
              className="border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-cyan-300/70" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-mono tracking-widest">
            {loading ? "PROCESSING..." : mode === "signin" ? "SIGN IN" : "SIGN UP"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-cyan-400/20" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-black px-2 font-mono text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void handleOAuth("google")}
            className="border-cyan-400/30"
          >
            <Chrome className="h-4 w-4" />
            <span className="sr-only">Google sign in</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void handleOAuth("github")}
            className="border-cyan-400/30"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub sign in</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void handleOAuth("discord")}
            className="border-cyan-400/30"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="sr-only">Discord sign in</span>
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-cyan-400/20 pt-3 text-xs font-mono">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            {mode === "signin" ? <Shield className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
            {mode === "signin" ? "Need an account?" : "Already registered?"}
          </span>
          <button
            type="button"
            className="text-cyan-300 transition-colors hover:text-cyan-100"
            onClick={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
