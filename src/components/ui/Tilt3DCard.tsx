import { useRef, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  intensity?: number;
}

export function Tilt3DCard({
  children,
  className,
  onClick,
  glowColor = '#00fff7',
  intensity = 15,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glint = glintRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotX = (y - 0.5) * -intensity;
    const rotY = (x - 0.5) * intensity;

    card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;

    if (glint) {
      const glintX = x * 100;
      const glintY = y * 100;
      glint.style.background = `radial-gradient(circle at ${glintX}% ${glintY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
      glint.style.opacity = '1';
    }
  };

  const handleLeave = () => {
    const card = cardRef.current;
    const glint = glintRef.current;
    if (card) card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
    if (glint) glint.style.opacity = '0';
  };

  const handleEnter = () => {
    const card = cardRef.current;
    if (card) {
      card.style.boxShadow = `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20, inset 0 0 20px ${glowColor}05`;
    }
  };

  const handleLeaveComplete = () => {
    handleLeave();
    const card = cardRef.current;
    if (card) card.style.boxShadow = '';
  };

  return (
    <div
      ref={cardRef}
      className={cn('relative overflow-hidden cursor-pointer', className)}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        willChange: 'transform',
      }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeaveComplete}
      onClick={onClick}
    >
      <div
        ref={glintRef}
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-200"
        style={{ opacity: 0 }}
      />
      <div style={{ transform: 'translateZ(0px)' }}>
        {children}
      </div>
    </div>
  );
}
