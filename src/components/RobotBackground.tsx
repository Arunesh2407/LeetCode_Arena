import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const RobotBackground = () => {
  const isMobile = useIsMobile();
  const robotRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);
  const leftPupilRef = useRef<HTMLDivElement | null>(null);
  const rightPupilRef = useRef<HTMLDivElement | null>(null);

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const touchActiveRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const [blink, setBlink] = useState(false);

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
    if (prefersReducedMotionRef.current) return;

    let blinkTimer: number | null = null;
    let closeTimer: number | null = null;

    const queueBlink = () => {
      const nextDelay = 2200 + Math.random() * 2800;
      blinkTimer = window.setTimeout(() => {
        setBlink(true);
        closeTimer = window.setTimeout(() => {
          setBlink(false);
          queueBlink();
        }, 130);
      }, nextDelay);
    };

    queueBlink();

    return () => {
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (closeTimer) window.clearTimeout(closeTimer);
    };
  }, []);

  useEffect(() => {
    const setTargetFromPointer = (x: number, y: number) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);

      targetRef.current.x = clamp((x / width) * 2 - 1, -1, 1);
      targetRef.current.y = clamp((y / height) * 2 - 1, -1, 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (prefersReducedMotionRef.current) return;

      if (isMobile) {
        if (event.pointerType !== "touch" || !touchActiveRef.current) return;
        setTargetFromPointer(event.clientX, event.clientY);
        return;
      }

      setTargetFromPointer(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (prefersReducedMotionRef.current) return;
      if (!isMobile || event.pointerType !== "touch") return;

      touchActiveRef.current = true;
      setTargetFromPointer(event.clientX, event.clientY);
    };

    const onPointerUp = () => {
      if (!isMobile) return;
      touchActiveRef.current = false;
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
  }, [isMobile]);

  useEffect(() => {
    const animate = () => {
      const easing = prefersReducedMotionRef.current ? 0.08 : 0.14;

      if (isMobile && !touchActiveRef.current) {
        const t = Date.now() * 0.0012;
        targetRef.current.x = Math.sin(t) * 0.3;
        targetRef.current.y = Math.cos(t * 0.8) * 0.2;
      }

      currentRef.current.x +=
        (targetRef.current.x - currentRef.current.x) * easing;
      currentRef.current.y +=
        (targetRef.current.y - currentRef.current.y) * easing;

      const x = currentRef.current.x;
      const y = currentRef.current.y;

      const moveX = x * (isMobile ? 18 : 24);
      const moveY = y * (isMobile ? 14 : 18);
      const rotY = x * (isMobile ? 6 : 9);
      const rotX = y * (isMobile ? -5 : -7);
      const pupilX = x * (isMobile ? 3 : 5);
      const pupilY = y * (isMobile ? 2 : 4);

      if (robotRef.current) {
        robotRef.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }

      const pupilTransform = `translate3d(${pupilX}px, ${pupilY}px, 0)`;
      if (leftPupilRef.current)
        leftPupilRef.current.style.transform = pupilTransform;
      if (rightPupilRef.current)
        rightPupilRef.current.style.transform = pupilTransform;

      const intensity = clamp(Math.sqrt(x * x + y * y), 0, 1);
      const alpha = prefersReducedMotionRef.current
        ? 0.12
        : 0.14 + intensity * 0.2;

      if (auraRef.current) {
        auraRef.current.style.boxShadow = `0 0 28px rgba(34, 197, 94, ${alpha}), 0 0 72px rgba(34, 197, 94, ${alpha * 0.55})`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isMobile]);

  return (
    <div
      className="relative z-10 pointer-events-none my-2 md:my-4 flex justify-center"
      aria-hidden="true"
    >
      <div
        ref={robotRef}
        className="relative will-change-transform"
        style={{
          transform: "translate3d(0, 0, 0)",
          transformStyle: "preserve-3d",
          transition: prefersReducedMotionRef.current
            ? "transform 250ms ease-out"
            : "none",
        }}
      >
        <div
          ref={auraRef}
          className="absolute -inset-6 rounded-full blur-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.04) 52%, transparent 78%)",
          }}
        />

        <div className="relative h-36 w-36 rounded-[1.8rem] border border-primary/40 bg-background/50 backdrop-blur-md">
          <div className="absolute inset-2 rounded-[1.8rem] border border-primary/25" />

          <div className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full bg-primary/80 animate-pulse-neon" />
          <div className="absolute left-1/2 top-6 h-7 w-[2px] -translate-x-1/2 bg-primary/60" />

          <div className="absolute inset-x-8 top-14 h-14 rounded-2xl border border-primary/25 bg-background/65">
            <div className="absolute inset-x-3 top-4 flex justify-between">
              <div className="relative h-6 w-10 overflow-hidden rounded-xl border border-primary/35 bg-background/80">
                <div
                  className="absolute left-0 right-0 top-0 h-full origin-center rounded-xl bg-background transition-transform duration-100"
                  style={{ transform: blink ? "scaleY(1)" : "scaleY(0)" }}
                />
                <div
                  ref={leftPupilRef}
                  className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_16px_rgba(34,197,94,0.9)]"
                />
              </div>

              <div className="relative h-6 w-10 overflow-hidden rounded-xl border border-primary/35 bg-background/80">
                <div
                  className="absolute left-0 right-0 top-0 h-full origin-center rounded-xl bg-background transition-transform duration-100"
                  style={{ transform: blink ? "scaleY(1)" : "scaleY(0)" }}
                />
                <div
                  ref={rightPupilRef}
                  className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_16px_rgba(34,197,94,0.9)]"
                />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-12 bottom-8 h-5 rounded-full border border-primary/25 bg-primary/10" />
        </div>
      </div>
    </div>
  );
};

export default RobotBackground;
