import { useEffect, useRef, useState } from 'react';

const LINES = [
  { text: '> INITIALIZING COMBAT SUBSYSTEMS...', delay: 0, suffix: ' [OK]', suffixColor: '#00ff88' },
  { text: '> LOADING ALGORITHM DATABASE v4.2.1', delay: 700, suffix: ' [LOADED]', suffixColor: '#00fff7' },
  { text: '> ESTABLISHING ARENA UPLINK...', delay: 1400, suffix: ' [CONNECTED]', suffixColor: '#00fff7' },
  { text: '> CALIBRATING NEURAL INTERFACE...', delay: 2200, suffix: ' [DONE]', suffixColor: '#00ff88' },
  { text: '> SCANNING FOR RIVALS...', delay: 3000, suffix: ' [247 FOUND]', suffixColor: '#ff6b35' },
  { text: '> SYSTEM READY. WELCOME, OPERATOR.', delay: 3800, suffix: '', suffixColor: '#00fff7' },
];

function TypingLine({ text, suffix, suffixColor, onDone }: { text: string; suffix: string; suffixColor: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [showSuffix, setShowSuffix] = useState(false);
  useEffect(() => {
    let i = 0;
    const int = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(int);
        setTimeout(() => { setShowSuffix(true); onDone?.(); }, 120);
      }
    }, 28);
    return () => clearInterval(int);
  }, [text]);

  return (
    <div className="flex items-center gap-1">
      <span style={{ color: '#00fff7' }}>{displayed}</span>
      {displayed.length < text.length && (
        <span className="animate-pulse" style={{ color: '#00fff7' }}>▊</span>
      )}
      {showSuffix && <span style={{ color: suffixColor }}>{suffix}</span>}
    </div>
  );
}

export function BootSequence() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
      }, line.delay);
      timerRefs.current.push(t);
    });
    const doneT = setTimeout(() => setDone(true), 5000);
    timerRefs.current.push(doneT);
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  if (done && visibleLines.length >= LINES.length) {
    return (
      <div
        className="font-mono text-xs p-4 rounded-sm relative overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid rgba(0,255,247,0.2)',
          backdropFilter: 'blur(8px)',
          width: 300,
          color: '#00fff7',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #00fff7, transparent)' }} />
        <div style={{ color: 'rgba(0,255,247,0.4)' }} className="mb-2 text-xs tracking-widest">// SYSTEM CONSOLE //</div>
        {LINES.map((line, i) => (
          <div key={i} className="flex gap-1 leading-5">
            <span style={{ color: '#00fff7' }}>{line.text}</span>
            <span style={{ color: line.suffixColor }}>{line.suffix}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-1">
          <span style={{ color: '#00ff88' }}>▶</span>
          <span style={{ color: '#00ff88' }} className="tracking-widest">ARENA ONLINE</span>
          <span className="animate-pulse ml-1" style={{ color: '#00ff88' }}>▊</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="font-mono text-xs p-4 rounded-sm relative overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.75)',
        border: '1px solid rgba(0,255,247,0.2)',
        backdropFilter: 'blur(8px)',
        width: 300,
        minHeight: 120,
        color: '#00fff7',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #00fff7, transparent)' }} />
      <div style={{ color: 'rgba(0,255,247,0.4)' }} className="mb-2 text-xs tracking-widest">// SYSTEM CONSOLE //</div>
      {visibleLines.map((lineIdx) => (
        <TypingLine
          key={lineIdx}
          text={LINES[lineIdx].text}
          suffix={LINES[lineIdx].suffix}
          suffixColor={LINES[lineIdx].suffixColor}
        />
      ))}
    </div>
  );
}
