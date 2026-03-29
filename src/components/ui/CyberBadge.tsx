import React from 'react';
import { cn } from '@/lib/utils';
import { Difficulty } from '@/hooks/use-arena-data';

export function CyberBadge({ difficulty, className }: { difficulty: Difficulty, className?: string }) {
  const styles = {
    EASY: "border-success text-success shadow-[0_0_5px_hsl(var(--color-success)/0.5)]",
    MEDIUM: "border-warning text-warning shadow-[0_0_5px_hsl(var(--color-warning)/0.5)]",
    HARD: "border-destructive text-destructive shadow-[0_0_5px_hsl(var(--destructive)/0.5)]",
    INSANE: "border-accent text-accent animate-pulse-neon shadow-[0_0_10px_hsl(var(--accent)/0.8)]",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 text-xs font-mono font-bold border rounded-sm tracking-widest uppercase bg-background/50 backdrop-blur-sm",
      styles[difficulty],
      className
    )}>
      {difficulty}
    </span>
  );
}
