import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  glow?: boolean;
  children: React.ReactNode;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = 'primary', glow = true, children, ...props }, ref) => {
    
    const variants = {
      primary: "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
      secondary: "border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground",
      accent: "border-accent text-accent hover:bg-accent hover:text-accent-foreground",
      destructive: "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
    };

    const glows = {
      primary: "neon-box-primary neon-text-primary",
      secondary: "neon-box-secondary neon-text-secondary",
      accent: "neon-box-accent neon-text-accent",
      destructive: "shadow-[0_0_10px_hsl(var(--destructive)/0.2)] text-shadow-[0_0_5px_hsl(var(--destructive))]",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-6 py-2.5 font-display font-bold uppercase tracking-wider",
          "border-2 bg-transparent transition-colors duration-300",
          "overflow-hidden group cyber-corner",
          variants[variant],
          glow && glows[variant],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        {/* Animated background scanline on hover */}
        <div className="absolute inset-0 -translate-y-full group-hover:animate-[scanline_1s_linear_infinite] bg-gradient-to-b from-transparent via-white/20 to-transparent z-0" />
      </motion.button>
    );
  }
);

NeonButton.displayName = 'NeonButton';
