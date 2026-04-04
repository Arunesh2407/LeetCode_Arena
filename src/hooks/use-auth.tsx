import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, supabaseConfigError } from "@/integrations/supabase/client";
import { hasCompletedProfileForUser } from "@/lib/profile-service";

const JUST_SIGNED_IN_STORAGE_KEY = "arena.profile.justSignedIn";

function markJustSignedIn() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(JUST_SIGNED_IN_STORAGE_KEY, "true");
}

function consumeJustSignedInMark() {
  if (typeof window === "undefined") {
    return false;
  }

  const marked =
    window.localStorage.getItem(JUST_SIGNED_IN_STORAGE_KEY) === "true";
  if (marked) {
    window.localStorage.removeItem(JUST_SIGNED_IN_STORAGE_KEY);
  }

  return marked;
}

type OAuthProvider = "google" | "github" | "discord";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: string | null }>;
  signInWithOAuth: (
    provider: OAuthProvider,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;

      const nextSession = data.session;
      if (nextSession?.user) {
        const allowIncompleteProfileOnce = consumeJustSignedInMark();
        const hasCompletedProfile = await hasCompletedProfileForUser(
          nextSession.user.id,
        ).catch(() => false);

        if (!isMounted) return;

        if (!hasCompletedProfile && !allowIncompleteProfileOnce) {
          await supabase.auth.signOut();
          if (!isMounted) return;

          setSession(null);
          setUser(null);
          setAuthModalOpen(true);
          setLoading(false);
          return;
        }
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_IN") {
        consumeJustSignedInMark();
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
      signInWithEmail: async (email, password) => {
        if (supabaseConfigError) {
          return { error: supabaseConfigError };
        }
        markJustSignedIn();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          consumeJustSignedInMark();
        }
        return { error: error?.message ?? null };
      },
      signUpWithEmail: async (email, password, displayName) => {
        if (supabaseConfigError) {
          return { error: supabaseConfigError };
        }
        markJustSignedIn();
        const metadata = displayName
          ? { display_name: displayName }
          : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: metadata ? { data: metadata } : undefined,
        });
        if (error) {
          consumeJustSignedInMark();
        }
        return { error: error?.message ?? null };
      },
      signInWithOAuth: async (provider) => {
        if (supabaseConfigError) {
          return { error: supabaseConfigError };
        }
        markJustSignedIn();
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          consumeJustSignedInMark();
        }
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        if (supabaseConfigError) {
          return { error: supabaseConfigError };
        }
        const { error } = await supabase.auth.signOut();
        return { error: error?.message ?? null };
      },
    }),
    [authModalOpen, loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
