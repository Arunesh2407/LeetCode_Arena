import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Activity,
  DoorOpen,
  Hexagon,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Settings2,
  Sun,
  TerminalSquare,
  Trophy,
} from "lucide-react";
import { useTheme } from "next-themes";
import { GlobalScene } from "./3d/GlobalScene";
import { AuthModal } from "@/components/auth/AuthModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomCursor } from "@/components/ui/CustomCursor";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/join-room", label: "ROOMS", icon: DoorOpen },
  { path: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
  { path: "/pulse", label: "PULSE", icon: Activity },
  { path: "/problems", label: "PROBLEMS", icon: TerminalSquare },
];

const SIGNED_OUT_NAV_ITEMS = [
  { path: "/", label: "NEXUS", icon: Hexagon },
  { path: "/join-room", label: "ROOMS", icon: DoorOpen },
  { path: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
  { path: "/problems", label: "TERMINAL", icon: TerminalSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, loading, openAuthModal, signOut } = useAuth();
  const { toast } = useToast();
  const { theme = "system", setTheme } = useTheme();
  const [compactHud, setCompactHud] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("arena.config.compactHud") === "true";
  });
  const [reducedFx, setReducedFx] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("arena.config.reducedFx") === "true";
  });

  const displayName =
    user?.user_metadata?.display_name?.toString() ||
    user?.email?.split("@")[0] ||
    "Pilot";
  const initials = displayName.slice(0, 2).toUpperCase();
  const navItems = user ? NAV_ITEMS : SIGNED_OUT_NAV_ITEMS;

  useEffect(() => {
    localStorage.setItem("arena.config.compactHud", String(compactHud));
    document.documentElement.dataset.arenaCompactHud = compactHud
      ? "enabled"
      : "disabled";
  }, [compactHud]);

  useEffect(() => {
    localStorage.setItem("arena.config.reducedFx", String(reducedFx));
    document.documentElement.dataset.arenaReducedFx = reducedFx
      ? "enabled"
      : "disabled";
  }, [reducedFx]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Signed out", description: "Your session has ended." });
  };

  return (
    <div
      className="min-h-screen text-foreground font-sans flex flex-col selection:bg-primary/30 selection:text-primary"
      style={{ cursor: "none" }}
    >
      <CustomCursor />
      <GlobalScene />

      {/* CRT scanline overlay — covers entire site */}
      <div
        className="fixed inset-0 pointer-events-none z-[999]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[998]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Animated header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: "rgba(1,1,15,0.65)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,255,247,0)",
        }}
      >
        {/* Animated bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, #00fff7, #bf00ff, #00fff7, transparent)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        {/* Corner accents */}
        <div
          className="absolute bottom-0 left-0 w-16 h-px"
          style={{
            background: "rgba(0,255,247,0.8)",
            boxShadow: "0 0 8px #00fff7",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-16 h-px"
          style={{
            background: "rgba(191,0,255,0.8)",
            boxShadow: "0 0 8px #bf00ff",
          }}
        />

        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group outline-none">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Hexagon
                className="w-8 h-8 text-primary group-hover:text-accent transition-colors"
                style={{ filter: "drop-shadow(0 0 6px #00fff7)" }}
              />
            </motion.div>
            <span
              className="font-display font-bold text-xl tracking-widest"
              style={{
                color: "#00fff7",
                textShadow: "0 0 10px rgba(0,255,247,0.7)",
              }}
            >
              LC // ARENA
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex gap-1 sm:gap-2">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "relative px-3 sm:px-4 py-2 font-mono text-sm tracking-wider uppercase transition-all outline-none group flex items-center gap-2",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-white",
                    )}
                    style={
                      isActive
                        ? { textShadow: "0 0 8px rgba(0,255,247,0.8)" }
                        : {}
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:block">{item.label}</span>
                    {isActive && (
                      <>
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5"
                          style={{
                            background: "#00fff7",
                            boxShadow:
                              "0 0 8px #00fff7, 0 0 16px rgba(0,255,247,0.5)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                        {/* Active item glow bg */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "rgba(0,255,247,0.05)",
                            borderRadius: 2,
                          }}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>

            {loading ? (
              <div className="hidden sm:flex items-center gap-2 px-2 text-xs font-mono text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                SESSION
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-cyan-400/40 p-0.5 transition-colors hover:border-cyan-200"
                  >
                    <Avatar className="h-8 w-8 bg-black/60">
                      <AvatarFallback className="bg-cyan-400/20 text-[10px] font-mono text-cyan-100">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 border-cyan-400/30 bg-black/95 font-mono"
                >
                  <DropdownMenuLabel className="truncate text-cyan-300">
                    {displayName}
                  </DropdownMenuLabel>
                  <DropdownMenuLabel className="truncate pt-0 text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-cyan-300/80 flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5" /> Arena Config
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={compactHud}
                    onCheckedChange={(checked) =>
                      setCompactHud(Boolean(checked))
                    }
                    className="text-xs"
                  >
                    Compact HUD
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={reducedFx}
                    onCheckedChange={(checked) =>
                      setReducedFx(Boolean(checked))
                    }
                    className="text-xs"
                  >
                    Reduced FX
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-cyan-300/80">
                    Theme
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value)}
                  >
                    <DropdownMenuRadioItem value="system" className="text-xs">
                      System
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      className="text-xs flex items-center gap-2"
                    >
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="light"
                      className="text-xs flex items-center gap-2"
                    >
                      <Sun className="h-3.5 w-3.5" /> Light
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-300 focus:bg-red-950/50 focus:text-red-200"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs tracking-widest text-cyan-200 transition-all hover:bg-cyan-400/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 relative z-10">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      <AuthModal />
    </div>
  );
}
