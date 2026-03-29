import { useEffect, useRef, useState } from 'react';

export function useMouse() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5, px: 0, py: 0 });
  const frame = useRef<number>(0);
  const raw = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      raw.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      setMouse(prev => {
        const lerpX = prev.x + (raw.current.x - prev.x) * 0.08;
        const lerpY = prev.y + (raw.current.y - prev.y) * 0.08;
        return { x: lerpX, y: lerpY, px: e2ndc(lerpX), py: e2ndc(lerpY) };
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return mouse;
}

function e2ndc(v: number) {
  return (v - 0.5) * 2;
}
