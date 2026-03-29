import { useEffect, useRef } from 'react';

const MATRIX_CHARS = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF><][{}#@!$%';
const COL_COLORS = ['#00fff7', '#00fff7', '#00fff7', '#bf00ff', '#ff0090', '#00ff88', '#00fff7', '#ffffff'];

export function GlobalScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const smoothMouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    type RainCol = { y: number; speed: number; length: number; chars: string[]; timers: number[]; color: string; headColor: string };
    type DataBurst = { y: number; progress: number; color: string; segments: number[] };
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number };

    let rainCols: RainCol[] = [];
    let dataBursts: DataBurst[] = [];
    let burstTimer = 0;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colW = 14;
      const numCols = Math.ceil(canvas.width / colW);
      rainCols = Array.from({ length: numCols }, () => {
        const length = Math.floor(Math.random() * 28 + 8);
        const colorBase = COL_COLORS[Math.floor(Math.random() * COL_COLORS.length)];
        return {
          y: Math.random() * -canvas.height * 1.5,
          speed: Math.random() * 1.4 + 0.4,
          length,
          chars: Array.from({ length }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
          timers: Array.from({ length }, () => Math.random() * 40),
          color: colorBase,
          headColor: colorBase === '#ffffff' ? '#ffffff' : '#e0ffff',
        };
      });
      if (!particles.length) {
        for (let i = 0; i < 140; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.8 + 0.4,
            color: Math.random() > 0.5 ? '#00fff7' : '#bf00ff',
            alpha: Math.random() * 0.5 + 0.15,
          });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      t += 0.004;
      burstTimer++;

      smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.05;
      smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.05;
      const mx = smoothMouse.current.x * w;
      const my = smoothMouse.current.y * h;

      /* ── Clear ── */
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(1,1,15,0.96)';
      ctx.fillRect(0, 0, w, h);

      /* ── Plasma blobs (slowly moving colored gradients) ── */
      const plasma = [
        { x: Math.cos(t * 0.25) * w * 0.3 + w * 0.5, y: Math.sin(t * 0.18) * h * 0.3 + h * 0.4, r: w * 0.45, c: 'rgba(0,255,247,0.055)' },
        { x: Math.cos(t * 0.31 + 2) * w * 0.38 + w * 0.4, y: Math.sin(t * 0.24 + 1) * h * 0.35 + h * 0.55, r: w * 0.38, c: 'rgba(191,0,255,0.045)' },
        { x: Math.cos(t * 0.19 + 4) * w * 0.28 + w * 0.6, y: Math.sin(t * 0.33 + 3) * h * 0.28 + h * 0.35, r: w * 0.35, c: 'rgba(255,0,144,0.03)' },
      ];
      for (const p of plasma) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }

      /* ── Matrix Rain ── */
      const colW = 14;
      ctx.font = `bold 12px "Share Tech Mono", monospace`;
      for (let i = 0; i < rainCols.length; i++) {
        const col = rainCols[i];
        col.y += col.speed;
        if (col.y - col.length * 15 > h + 40) {
          col.y = Math.random() * -200 - 40;
          col.speed = Math.random() * 1.4 + 0.4;
          col.color = COL_COLORS[Math.floor(Math.random() * COL_COLORS.length)];
          col.chars = col.chars.map(() => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
        }
        for (let j = 0; j < col.length; j++) {
          const cy = col.y - j * 15;
          if (cy < -20 || cy > h + 20) continue;
          col.timers[j]--;
          if (col.timers[j] <= 0) {
            col.chars[j] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
            col.timers[j] = 15 + Math.random() * 50;
          }
          const fade = Math.max(0, 1 - j / col.length);
          if (j === 0) {
            ctx.fillStyle = col.headColor;
            ctx.globalAlpha = 0.95;
          } else if (j === 1) {
            ctx.fillStyle = col.color;
            ctx.globalAlpha = 0.7;
          } else {
            ctx.fillStyle = col.color;
            ctx.globalAlpha = fade * 0.45;
          }
          ctx.fillText(col.chars[j], i * colW + 1, cy);
          ctx.globalAlpha = 1;
        }
      }

      /* ── Cursor spotlight ── */
      const sg = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.42);
      sg.addColorStop(0, 'rgba(0,255,247,0.04)');
      sg.addColorStop(0.5, 'rgba(191,0,255,0.018)');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);

      /* ── Perspective grid ── */
      const horizon = h * 0.64, vx = w / 2;
      ctx.save();
      for (let i = 0; i <= 22; i++) {
        const x = (i / 22) * w;
        ctx.strokeStyle = 'rgba(0,255,247,0.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(vx, horizon); ctx.stroke();
      }
      for (let j = 1; j <= 22; j++) {
        const p = Math.pow(j / 22, 1.5);
        const y = horizon + (h - horizon) * p;
        ctx.strokeStyle = `rgba(0,255,247,${p * 0.11})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.restore();

      /* ── Data bursts (horizontal lightning lines) ── */
      if (burstTimer > 90 && Math.random() < 0.04) {
        burstTimer = 0;
        const segs = Array.from({ length: 30 }, () => (Math.random() - 0.5) * 12);
        dataBursts.push({ y: Math.random() * h, progress: 0, color: Math.random() > 0.5 ? '#00fff7' : '#bf00ff', segments: segs });
      }
      for (let i = dataBursts.length - 1; i >= 0; i--) {
        const burst = dataBursts[i];
        burst.progress += 0.05;
        if (burst.progress > 1) { dataBursts.splice(i, 1); continue; }
        const endX = burst.progress * w;
        ctx.save();
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = Math.sin(burst.progress * Math.PI) * 0.8;
        ctx.shadowColor = burst.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, burst.y);
        for (let k = 0; k < burst.segments.length; k++) {
          const px = (k / burst.segments.length) * endX;
          ctx.lineTo(px, burst.y + burst.segments[k]);
        }
        ctx.stroke();
        ctx.restore();
      }

      /* ── Particles + network ── */
      for (const p of particles) {
        const dist = Math.hypot(p.x - mx, p.y - my);
        const inf = Math.max(0, 1 - dist / 180);
        p.x += p.vx + (p.x - mx) * inf * 0.003;
        p.y += p.vy + (p.y - my) * inf * 0.003;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 3 + p.x * 0.01));
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (5 + inf * 6));
        gr.addColorStop(0, p.color); gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (5 + inf * 6), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < particles.length - 1; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.save(); ctx.globalAlpha = (1 - d / 90) * 0.11;
            ctx.strokeStyle = '#00fff7'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); ctx.restore();
          }
        }
      }

      /* ── Pulsing rings ── */
      const cx = w / 2, cy2 = h * 0.27;
      for (let r = 0; r < 7; r++) {
        const radius = 40 + r * 50 + Math.sin(t * 0.7 + r) * 10;
        const alpha = 0.05 + Math.sin(t + r * 0.7) * 0.025;
        ctx.save();
        ctx.strokeStyle = r % 2 === 0 ? `rgba(0,255,247,${alpha})` : `rgba(191,0,255,${alpha})`;
        ctx.lineWidth = r === 0 ? 2 : 1;
        ctx.shadowColor = r % 2 === 0 ? '#00fff7' : '#bf00ff';
        ctx.shadowBlur = r === 0 ? 8 : 4;
        ctx.beginPath(); ctx.arc(cx, cy2, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      /* ── Double scan lines ── */
      for (let sl = 0; sl < 2; sl++) {
        const speed = sl === 0 ? 60 : 38;
        const offset = sl === 0 ? 0 : h * 0.5;
        const scanY = ((t * speed) % (h + 100)) - 50 + offset;
        if (scanY > -10 && scanY < h + 10) {
          ctx.save();
          const sg2 = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
          sg2.addColorStop(0, 'transparent');
          sg2.addColorStop(0.5, sl === 0 ? 'rgba(0,255,247,0.06)' : 'rgba(191,0,255,0.05)');
          sg2.addColorStop(1, 'transparent');
          ctx.fillStyle = sg2; ctx.fillRect(0, scanY - 4, w, 8); ctx.restore();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,247,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(191,0,255,0.055) 0%, transparent 60%)',
      }} />
    </div>
  );
}
