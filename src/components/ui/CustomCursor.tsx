import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const frame = useRef(0);
  const clicking = useRef(false);

  useEffect(() => {
    const TRAIL_COUNT = 8;
    const trails = trailRef.current;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    const onDown = () => { clicking.current = true; };
    const onUp = () => { clicking.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    const positions: { x: number; y: number }[] = Array(TRAIL_COUNT).fill({ x: -100, y: -100 });

    const tick = () => {
      const dot = dotRef.current;
      const r = ringRef.current;
      if (dot) {
        dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px) scale(${clicking.current ? 0.5 : 1})`;
      }
      ring.current.x += (pos.current.x - ring.current.x) * 0.15;
      ring.current.y += (pos.current.y - ring.current.y) * 0.15;
      if (r) {
        const s = clicking.current ? 0.7 : 1;
        r.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px) scale(${s})`;
      }

      positions.unshift({ ...pos.current });
      positions.pop();
      trails.forEach((el, i) => {
        if (!el) return;
        const lerp = positions[i] || positions[positions.length - 1];
        const alpha = 1 - i / TRAIL_COUNT;
        const size = 3 * alpha;
        el.style.transform = `translate(${lerp.x - size / 2}px, ${lerp.y - size / 2}px)`;
        el.style.opacity = String(alpha * 0.4);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
      });

      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" style={{ mixBlendMode: 'screen' }}>
      <div
        ref={dotRef}
        className="fixed rounded-full"
        style={{
          width: 8, height: 8,
          background: '#00fff7',
          boxShadow: '0 0 6px #00fff7, 0 0 12px #00fff7',
          willChange: 'transform',
          transition: 'transform 0.05s ease, width 0.1s, height 0.1s',
        }}
      />
      <div
        ref={ringRef}
        className="fixed rounded-full"
        style={{
          width: 36, height: 36,
          border: '1.5px solid rgba(0,255,247,0.7)',
          boxShadow: '0 0 8px rgba(0,255,247,0.3)',
          willChange: 'transform',
          transition: 'transform 0.05s linear, width 0.15s, height 0.15s',
        }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          ref={el => { if (el) trailRef.current[i] = el; }}
          className="fixed rounded-full"
          style={{
            background: i % 2 === 0 ? '#00fff7' : '#bf00ff',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
