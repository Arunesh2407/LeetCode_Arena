import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroBg from "@/assets/hero-bg.jpg";

type EchoPoint = {
  x: number;
  y: number;
  life: number;
  radius: number;
};

const CursorTrailBackground = () => {
  const isMobile = useIsMobile();
  const [echoes, setEchoes] = useState<EchoPoint[]>([]);
  const [revealed, setRevealed] = useState(false);

  const activeRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const lastEmitTimeRef = useRef(0);
  const lastEmitPosRef = useRef<{ x: number; y: number } | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const maskRef = useRef<string>("");

  const maxEchoes = useMemo(() => (isMobile ? 10 : 14), [isMobile]);
  const decay = useMemo(() => (isMobile ? 0.02 : 0.018), [isMobile]);
  const emitIntervalMs = useMemo(() => (isMobile ? 34 : 22), [isMobile]);
  const minDistance = useMemo(() => (isMobile ? 20 : 12), [isMobile]);
  const mainRadius = useMemo(() => (isMobile ? 170 : 220), [isMobile]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReduced = () => {
      prefersReducedMotionRef.current = media.matches;
    };

    updateReduced();
    media.addEventListener("change", updateReduced);

    return () => media.removeEventListener("change", updateReduced);
  }, []);

  useEffect(() => {
    const emitEcho = (x: number, y: number) => {
      if (prefersReducedMotionRef.current) return;

      const now = performance.now();
      if (now - lastEmitTimeRef.current < emitIntervalMs) return;

      const last = lastEmitPosRef.current;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) return;
      }

      lastEmitTimeRef.current = now;
      lastEmitPosRef.current = { x, y };

      setEchoes((prev) => {
        const next = [...prev, { x, y, life: 1, radius: isMobile ? 120 : 150 }];
        return next.length > maxEchoes
          ? next.slice(next.length - maxEchoes)
          : next;
      });
    };

    const setPointer = (x: number, y: number) => {
      targetRef.current.x = x;
      targetRef.current.y = y;
      if (!revealed) setRevealed(true);
      emitEcho(x, y);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isMobile) {
        if (event.pointerType !== "touch" || !activeRef.current) return;
      }
      setPointer(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") activeRef.current = true;
      setPointer(event.clientX, event.clientY);
    };

    const onPointerUp = () => {
      activeRef.current = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [emitIntervalMs, isMobile, maxEchoes, minDistance, revealed]);

  useEffect(() => {
    const tick = () => {
      if (prefersReducedMotionRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const easing = isMobile ? 0.22 : 0.16;
      currentRef.current.x +=
        (targetRef.current.x - currentRef.current.x) * easing;
      currentRef.current.y +=
        (targetRef.current.y - currentRef.current.y) * easing;

      setEchoes((prev) =>
        prev
          .map((point) => ({ ...point, life: point.life - decay }))
          .filter((point) => point.life > 0.02),
      );

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [decay, isMobile]);

  useEffect(() => {
    const head = `radial-gradient(circle ${mainRadius}px at ${currentRef.current.x}px ${currentRef.current.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 44%, rgba(0,0,0,0.34) 70%, rgba(0,0,0,0) 100%)`;

    const trail = echoes.map((point) => {
      const radius = point.radius * (0.82 + point.life * 0.45);
      const inner = 0.44 * point.life;
      const mid = 0.2 * point.life;

      return `radial-gradient(circle ${radius}px at ${point.x}px ${point.y}px, rgba(0,0,0,${inner}) 0%, rgba(0,0,0,${mid}) 54%, rgba(0,0,0,0) 100%)`;
    });

    maskRef.current = [head, ...trail].join(",");
  }, [echoes, mainRadius]);

  if (prefersReducedMotionRef.current) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${revealed ? "opacity-100" : "opacity-0"}`}
        style={{
          backgroundImage: `linear-gradient(rgba(3,1,8,0.74), rgba(3,1,8,0.74)), linear-gradient(135deg, rgba(157,23,77,0.28) 0%, rgba(131,24,67,0.24) 45%, rgba(80,7,36,0.2) 100%), url(${heroBg})`,
          backgroundSize: "cover, cover, cover",
          backgroundPosition: "center, center, center",
          backgroundRepeat: "no-repeat, no-repeat, no-repeat",
          maskImage: maskRef.current,
          WebkitMaskImage: maskRef.current,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          willChange: "mask-image",
        }}
      />
    </div>
  );
};

export default CursorTrailBackground;
