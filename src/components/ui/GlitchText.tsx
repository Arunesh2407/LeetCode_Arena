import { useEffect, useRef, useState } from 'react';

interface GlitchSlice {
  top: number;
  height: number;
  offsetX: number;
  color: 'red' | 'cyan' | 'purple';
}

export function GlitchText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const [slices, setSlices] = useState<GlitchSlice[]>([]);
  const [scrambled, setScrambled] = useState(text);
  const [shaking, setShaking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const triggerGlitch = () => {
    const numSlices = Math.floor(Math.random() * 4) + 2;
    const newSlices: GlitchSlice[] = Array.from({ length: numSlices }, () => ({
      top: Math.random() * 90,
      height: Math.random() * 15 + 3,
      offsetX: (Math.random() - 0.5) * 20,
      color: ['red', 'cyan', 'purple'][Math.floor(Math.random() * 3)] as GlitchSlice['color'],
    }));
    setSlices(newSlices);
    setShaking(true);

    let iters = 0;
    const scrambleInterval = setInterval(() => {
      setScrambled(
        text.split('').map((ch, i) =>
          Math.random() < 0.3 ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch
        ).join('')
      );
      iters++;
      if (iters > 4) {
        clearInterval(scrambleInterval);
        setScrambled(text);
        setSlices([]);
        setShaking(false);
      }
    }, 50);
  };

  useEffect(() => {
    const schedule = () => {
      const delay = 2500 + Math.random() * 4000;
      timeoutRef.current = setTimeout(() => {
        triggerGlitch();
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [text]);

  const colorMap = {
    red: 'rgba(255,20,80,0.85)',
    cyan: 'rgba(0,255,247,0.85)',
    purple: 'rgba(191,0,255,0.85)',
  };

  return (
    <span
      className={`relative inline-block select-none ${className ?? ''}`}
      style={{
        ...style,
        transform: shaking ? `translateX(${(Math.random() - 0.5) * 4}px)` : undefined,
      }}
    >
      <span className="relative z-10" style={style}>{scrambled}</span>

      {slices.map((sl, i) => (
        <span
          key={i}
          className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
          style={{
            clipPath: `inset(${sl.top}% 0 ${100 - sl.top - sl.height}% 0)`,
            transform: `translateX(${sl.offsetX}px)`,
            color: colorMap[sl.color],
            mixBlendMode: 'screen',
          }}
        >
          {scrambled}
        </span>
      ))}
    </span>
  );
}
