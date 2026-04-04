import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlitchText } from "@/components/ui/GlitchText";
import { BootSequence } from "@/components/ui/BootSequence";
import { supabase } from "@/integrations/supabase/client";

function useSmoothedMouse() {
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const smoothed = useRef({ x: 0.5, y: 0.5 });
  const frame = useRef(0);
  const [val, setVal] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove);
    const tick = () => {
      smoothed.current.x += (mouse.current.x - smoothed.current.x) * 0.06;
      smoothed.current.y += (mouse.current.y - smoothed.current.y) * 0.06;
      setVal({ x: smoothed.current.x, y: smoothed.current.y });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, []);
  return val;
}

function ParallaxLayer({
  children,
  depth,
  className,
}: {
  children: React.ReactNode;
  depth: number;
  className?: string;
}) {
  const mouse = useSmoothedMouse();
  return (
    <div
      className={className}
      style={{
        transform: `translate(${(mouse.x - 0.5) * depth}px, ${(mouse.y - 0.5) * depth}px)`,
        willChange: "transform",
        transition: "transform 0.06s linear",
      }}
    >
      {children}
    </div>
  );
}

function Hexagon({
  size,
  style,
  depth,
}: {
  size: number;
  style: React.CSSProperties;
  depth: number;
}) {
  const mouse = useSmoothedMouse();
  const dx = (mouse.x - 0.5) * depth,
    dy = (mouse.y - 0.5) * depth;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...style,
        width: size,
        height: size,
        transform: `translate(${dx}px, ${dy}px) rotate(${dx * 0.4}deg)`,
        willChange: "transform",
        transition: "transform 0.08s linear",
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
        <polygon
          points="50,2 93,26 93,74 50,98 7,74 7,26"
          stroke={style.color as string}
          strokeWidth="1.5"
          fill={`${style.color}08`}
        />
        <polygon
          points="50,20 77,35 77,65 50,80 23,65 23,35"
          stroke={style.color as string}
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />
        <polygon
          points="50,35 65,43 65,57 50,65 35,57 35,43"
          stroke={style.color as string}
          strokeWidth="0.5"
          fill={`${style.color}12`}
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

function HUDCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const corners = {
    tl: {
      top: 0,
      left: 0,
      borderTop: "2px solid #00fff7",
      borderLeft: "2px solid #00fff7",
      borderRight: "none",
      borderBottom: "none",
    },
    tr: {
      top: 0,
      right: 0,
      borderTop: "2px solid #00fff7",
      borderRight: "2px solid #00fff7",
      borderLeft: "none",
      borderBottom: "none",
    },
    bl: {
      bottom: 0,
      left: 0,
      borderBottom: "2px solid #00fff7",
      borderLeft: "2px solid #00fff7",
      borderTop: "none",
      borderRight: "none",
    },
    br: {
      bottom: 0,
      right: 0,
      borderBottom: "2px solid #00fff7",
      borderRight: "2px solid #00fff7",
      borderTop: "none",
      borderLeft: "none",
    },
  };
  return (
    <div
      className="absolute"
      style={{ ...corners[position], width: 28, height: 28, opacity: 0.7 }}
    />
  );
}

function TargetingReticle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 280, height: 280 }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(0,255,247,0.15)",
            animation: "targeting-spin 12s linear infinite",
          }}
        >
          <div
            className="absolute"
            style={{
              top: -3,
              left: "50%",
              transform: "translateX(-50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00fff7",
              boxShadow: "0 0 8px #00fff7",
            }}
          />
        </div>
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            border: "1px solid rgba(191,0,255,0.12)",
            animation: "targeting-spin 8s linear infinite reverse",
          }}
        >
          <div
            className="absolute"
            style={{
              top: -3,
              left: "50%",
              transform: "translateX(-50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#bf00ff",
              boxShadow: "0 0 8px #bf00ff",
            }}
          />
        </div>
        <div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            border: "1px dashed rgba(0,255,247,0.1)",
            animation: "targeting-spin 5s linear infinite",
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            border: "1px solid rgba(0,255,247,0.1)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function LiveHexData() {
  const [values, setValues] = useState<string[]>([
    "0x3F9A",
    "0xC21B",
    "0x8E44",
    "0x17DC",
    "0x5F0A",
  ]);
  useEffect(() => {
    const int = setInterval(() => {
      setValues((prev) =>
        prev.map((v) =>
          Math.random() < 0.3
            ? "0x" +
              Math.floor(Math.random() * 0xffff)
                .toString(16)
                .toUpperCase()
                .padStart(4, "0")
            : v,
        ),
      );
    }, 400);
    return () => clearInterval(int);
  }, []);
  return (
    <div className="absolute bottom-8 right-8 font-mono text-xs flex-col gap-0.5 hidden md:flex items-end">
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            color: `rgba(0,255,247,${0.15 + i * 0.07})`,
            fontFamily: "monospace",
          }}
        >
          {v}
        </span>
      ))}
      <span style={{ color: "rgba(191,0,255,0.3)" }} className="animate-pulse">
        SCAN ACTIVE
      </span>
    </div>
  );
}

function CounterStat({
  label,
  value,
  suffix = "",
  animate = true,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  animate?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isAnimatedNumber = typeof value === "number" && animate;

  useEffect(() => {
    if (!isAnimatedNumber) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        let start = 0;
        const step = value / 80;
        const timer = setInterval(() => {
          start += step;
          if (start >= value) {
            setCurrent(value);
            clearInterval(timer);
          } else setCurrent(Math.floor(start));
        }, 16);
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [isAnimatedNumber, value]);

  const displayValue = isAnimatedNumber
    ? current.toLocaleString()
    : String(value);

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-3xl md:text-4xl font-bold animate-corrupt"
        style={{ color: "#00fff7", textShadow: "0 0 15px rgba(0,255,247,0.7)" }}
      >
        {displayValue}
        {suffix}
      </div>
      <div className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const mouse = useSmoothedMouse();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollDim, setScrollDim] = useState(0);
  const [scrollBlur, setScrollBlur] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -40]);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / window.innerHeight, 1);
      setScrollDim(Math.min(progress * 1.6, 0.93));
      setScrollBlur(Math.min(progress * 12, 10));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadTotalQuestions = async () => {
      const { count, error } = await supabase
        .from("room_problems")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.warn("Failed to load total question count", error);
        if (isActive) setTotalQuestions(0);
        return;
      }

      if (isActive) {
        setTotalQuestions(count ?? 0);
      }
    };

    loadTotalQuestions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setActiveSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dx = mouse.x - 0.5,
    dy = mouse.y - 0.5;

  const hexagons = [
    {
      size: 90,
      style: {
        left: "4%",
        top: "12%",
        color: "#00fff7",
      } as React.CSSProperties,
      depth: -40,
    },
    {
      size: 130,
      style: {
        right: "5%",
        top: "8%",
        color: "#bf00ff",
      } as React.CSSProperties,
      depth: -70,
    },
    {
      size: 65,
      style: {
        right: "8%",
        top: "55%",
        color: "#00fff7",
      } as React.CSSProperties,
      depth: -30,
    },
    {
      size: 110,
      style: {
        left: "1%",
        top: "60%",
        color: "#bf00ff",
      } as React.CSSProperties,
      depth: -55,
    },
    {
      size: 50,
      style: {
        left: "40%",
        bottom: "15%",
        color: "#00fff7",
      } as React.CSSProperties,
      depth: -25,
    },
    {
      size: 75,
      style: {
        right: "20%",
        bottom: "20%",
        color: "#bf00ff",
      } as React.CSSProperties,
      depth: -45,
    },
    {
      size: 40,
      style: {
        left: "20%",
        top: "30%",
        color: "#00fff7",
      } as React.CSSProperties,
      depth: -20,
    },
    {
      size: 55,
      style: {
        right: "30%",
        top: "40%",
        color: "#bf00ff",
      } as React.CSSProperties,
      depth: -35,
    },
  ];

  return (
    <div ref={containerRef} className="relative" style={{ minHeight: "220vh" }}>
      {/* Scroll-driven dim + blur overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundColor: `rgba(1,1,15,${scrollDim})`,
          backdropFilter: scrollBlur > 0.5 ? `blur(${scrollBlur}px)` : "none",
          transition: "background-color 0.08s linear",
        }}
      />

      {/* Hero: sticky, fades on scroll */}
      <div
        className="sticky top-0 h-screen overflow-hidden noise-overlay"
        style={{ zIndex: 1 }}
      >
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          {hexagons.map((h, i) => (
            <Hexagon key={i} {...h} />
          ))}
          <TargetingReticle />

          {/* Ghost background word */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${dx * -8}px, ${dy * -8}px)`,
              transition: "transform 0.1s linear",
            }}
          >
            <div className="absolute inset-0 opacity-[0.018] select-none flex items-center justify-center overflow-hidden">
              <span
                className="text-[30vw] font-black"
                style={{ color: "#00fff7", fontFamily: "monospace" }}
              >
                ARENA
              </span>
            </div>
          </div>

          {/* HUD crosshair lines */}
          <div
            className="absolute top-0 left-1/2 w-px h-1/3 opacity-15"
            style={{
              background: "linear-gradient(to bottom, transparent, #00fff7)",
              transform: `translateX(calc(-50% + ${dx * 15}px))`,
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-px h-1/3 opacity-15"
            style={{
              background: "linear-gradient(to top, transparent, #00fff7)",
              transform: `translateX(calc(-50% + ${dx * 15}px))`,
            }}
          />
          <div
            className="absolute left-0 top-1/2 h-px w-1/4 opacity-15"
            style={{
              background: "linear-gradient(to right, transparent, #00fff7)",
              transform: `translateY(calc(-50% + ${dy * 15}px))`,
            }}
          />
          <div
            className="absolute right-0 top-1/2 h-px w-1/4 opacity-15"
            style={{
              background: "linear-gradient(to left, transparent, #00fff7)",
              transform: `translateY(calc(-50% + ${dy * 15}px))`,
            }}
          />

          {/* Main hero content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-5 px-4 max-w-5xl -translate-y-6 md:-translate-y-8">
            <ParallaxLayer depth={-25}>
              <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-none">
                <GlitchText
                  text="LEETCODE"
                  className="block"
                  style={{
                    color: "white",
                    fontFamily: "monospace",
                    textShadow: "0 0 20px rgba(255,255,255,0.3)",
                    display: "block",
                    transform: `perspective(800px) rotateY(${dx * 5}deg)`,
                    transition: "transform 0.1s linear",
                  }}
                />
                <motion.span
                  className="block animate-flicker"
                  style={{
                    color: "#00fff7",
                    display: "block",
                    fontFamily: "monospace",
                    transform: `perspective(800px) rotateY(${dx * -8}deg)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  ARENA
                </motion.span>
              </h1>
            </ParallaxLayer>

            <ParallaxLayer depth={-15}>
              <p className="max-w-xl font-mono text-sm md:text-base text-muted-foreground border-l-4 border-cyan-400/40 pl-4 py-2 text-left bg-black/30 backdrop-blur-sm">
                Engage in high-octane algorithmic combat.
                <br />
                Out-compute your rivals. Ascend the mainframe hierarchy.
              </p>
            </ParallaxLayer>

            <ParallaxLayer
              depth={-5}
              className="pt-2 flex flex-col sm:flex-row gap-4 items-center"
            >
              <NeonButton
                onClick={() => setLocation("/problems")}
                className="text-lg px-10 py-4 cyber-corner"
                glow
              >
                INITIALIZE UPLINK
              </NeonButton>
              <motion.button
                onClick={() => setLocation("/leaderboard")}
                className="font-mono text-sm tracking-widest text-muted-foreground hover:text-purple-400 transition-colors border border-purple-400/20 px-6 py-3 hover:border-purple-400/50 hover:bg-purple-400/5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                VIEW RANKINGS →
              </motion.button>
            </ParallaxLayer>

            <ParallaxLayer depth={-6} className="w-full max-w-2xl pt-3">
              <div
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 rounded-sm border p-2"
                style={{
                  borderColor: "rgba(0,255,247,0.25)",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <NeonButton
                  onClick={() => setLocation("/join-room")}
                  className="px-5 py-3 text-xs sm:text-sm"
                  glow
                >
                  ROOMS HUB
                </NeonButton>

                <NeonButton
                  onClick={() => setLocation("/join-room")}
                  className="px-6 py-3 text-xs sm:text-sm"
                  variant="accent"
                  glow
                >
                  MANAGE ROOMS
                </NeonButton>
              </div>
            </ParallaxLayer>
          </div>

          {/* Boot sequence terminal (top-right HUD) */}
          <div className="absolute top-20 right-6 hidden lg:block">
            <BootSequence />
          </div>

          {/* Live hex data (bottom-right) */}
          <LiveHexData />

          {/* Bottom HUD left */}
          <div className="absolute bottom-8 left-8 font-mono text-xs hidden md:flex flex-col gap-1">
            <span style={{ color: "rgba(0,255,247,0.3)" }}>
              CURSOR: {Math.round(mouse.x * 1000)}x{Math.round(mouse.y * 1000)}
            </span>
            <span style={{ color: "rgba(0,255,247,0.3)" }}>
              PARALLAX: ACTIVE
            </span>
            <span style={{ color: "rgba(0,255,247,0.3)" }}>DEPTH: 3D</span>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35">
            <span className="font-mono text-xs text-muted-foreground tracking-widest">
              SCROLL TO DEPLOY
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-px h-10 rounded-full"
              style={{
                background: "linear-gradient(to bottom, #00fff7, transparent)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scrolled content: semi-transparent so matrix bleeds through */}
      <div
        className="relative"
        style={{
          zIndex: 10,
          background:
            "linear-gradient(to bottom, rgba(1,1,15,0) 0%, rgba(1,1,15,0.82) 8%, rgba(1,1,15,0.82) 100%)",
          paddingTop: "4rem",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(1,1,15,0.82))",
          }}
        />

        <div className="relative px-6 py-16 max-w-5xl mx-auto">
          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="text-center mb-10">
              <h2 className="text-xl font-mono tracking-widest animate-holo">
                // ARENA METRICS //
              </h2>
            </div>
            <div
              className="grid grid-cols-3 gap-8 p-8 relative holo-card"
              style={{
                background: "rgba(0,0,0,0.75)",
                border: "1px solid rgba(0,255,247,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="absolute top-0 left-0 w-full h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, #00fff7, transparent)",
                }}
              />
              <HUDCorner position="tl" />
              <HUDCorner position="tr" />
              <HUDCorner position="bl" />
              <HUDCorner position="br" />
              <CounterStat
                label="TOTAL NUMBER OF QUESTIONS"
                value={totalQuestions ?? "..."}
                animate={totalQuestions !== null}
              />
              <CounterStat
                label="DEVELOPED BY"
                value="Arunesh Geda"
                animate={false}
              />
              <CounterStat
                label="ACTIVE FROM (TIME IN SECONDS)"
                value={activeSeconds}
                suffix=" s"
                animate={false}
              />
            </div>
          </motion.div>

          {/* Feature cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "COMBAT MODE",
                desc: "Compete head-to-head in real-time battles. First to solve wins.",
                color: "#00fff7",
              },
              {
                title: "DIFFICULTY TIERS",
                desc: "Easy → Medium → Hard → INSANE. Climb the ladder of algorithmic mastery.",
                color: "#bf00ff",
              },
              {
                title: "LIVE RANKING",
                desc: "Global leaderboard. Every submission matters. Every millisecond counts.",
                color: "#00fff7",
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, rotateX: 18 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="p-6 h-full rounded-sm relative overflow-hidden holo-card"
                  style={{
                    background: "rgba(0,0,0,0.78)",
                    border: `1px solid ${feat.color}22`,
                    backdropFilter: "blur(8px)",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      feat.color + "66";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      `0 0 24px ${feat.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      feat.color + "22";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-px"
                    style={{
                      background: `linear-gradient(to right, transparent, ${feat.color}, transparent)`,
                    }}
                  />
                  <HUDCorner position="tl" />
                  <HUDCorner position="br" />
                  <h3 className="font-mono font-bold text-white mb-3 tracking-widest text-sm">
                    {feat.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-20 text-center pb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NeonButton
              onClick={() => setLocation("/problems")}
              className="text-base px-12 py-4"
              glow
            >
              BEGIN THE TRIAL
            </NeonButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
