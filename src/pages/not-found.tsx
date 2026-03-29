import React from "react";
import { Link } from "wouter";
import { NeonButton } from "@/components/ui/NeonButton";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-display font-black text-destructive neon-text-primary animate-glitch" style={{ textShadow: "0 0 10px hsl(var(--destructive)), 0 0 20px hsl(var(--destructive))" }}>
          404
        </h1>
        <div className="font-mono text-xl text-muted-foreground border-y border-border py-4 bg-black/50">
          FATAL ERROR: SECTOR NOT FOUND IN MATRIX
        </div>
        <div className="pt-8">
          <Link href="/">
            <NeonButton variant="secondary">
              RETURN TO NEXUS
            </NeonButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
