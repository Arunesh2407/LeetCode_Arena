import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Search, Terminal } from 'lucide-react';
import { useProblems, Difficulty, Problem } from '@/hooks/use-arena-data';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';

const DIFF_GLOW: Record<string, string> = {
  EASY: '#22c55e',
  MEDIUM: '#eab308',
  HARD: '#ef4444',
  INSANE: '#bf00ff',
};

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

function ProblemCard({ problem, idx, onClick }: { problem: Problem; idx: number; onClick: () => void }) {
  const glowColor = DIFF_GLOW[problem.difficulty] || '#00fff7';

  return (
    <ScrollReveal delay={idx * 0.06}>
      <Tilt3DCard
        className="bg-card/80 backdrop-blur-md border border-border p-6 rounded-lg shadow-lg h-full"
        onClick={onClick}
        glowColor={glowColor}
        intensity={12}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)', backgroundSize: '14px 24px' }} />

        <div className="relative z-10 flex justify-between items-start mb-4">
          <span className="font-mono text-muted-foreground text-sm">#{problem.id.padStart(4, '0')}</span>
          <CyberBadge difficulty={problem.difficulty} />
        </div>

        <h3 className="relative z-10 text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors leading-tight">
          {problem.title}
        </h3>

        <div className="relative z-10 flex flex-wrap gap-2 mb-5">
          {problem.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border/50">
              {tag}
            </span>
          ))}
          {problem.tags.length > 3 && <span className="text-xs font-mono text-muted-foreground px-2 py-1">+{problem.tags.length - 3}</span>}
        </div>

        <div className="relative z-10 flex justify-between items-center border-t border-border/30 pt-4">
          <div className="font-mono text-xs text-muted-foreground">
            Acceptance: <span className="text-white">{problem.acceptance}%</span>
          </div>
          <motion.div
            className="font-mono text-xs flex items-center gap-1"
            style={{ color: glowColor }}
            whileHover={{ x: 4 }}
          >
            HACK <span className="text-base leading-none">→</span>
          </motion.div>
        </div>
      </Tilt3DCard>
    </ScrollReveal>
  );
}

export default function Problems() {
  const { data: problems, isLoading } = useProblems();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Difficulty | 'ALL'>('ALL');
  const [, setLocation] = useLocation();

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold neon-text-primary uppercase flex items-center gap-3 font-mono">
            <Terminal className="w-8 h-8" /> Data Nodes
          </h1>
          <p className="text-muted-foreground font-mono mt-2 border-l-2 border-primary/50 pl-3">
            Hover a target to feel its depth. Click to infiltrate.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-primary/50 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Query matrix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-background/50 border-2 border-border text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all cyber-corner"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD', 'INSANE'] as const).map((d) => (
              <motion.button
                key={d}
                onClick={() => setFilter(d)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 font-mono text-xs border rounded-sm transition-all ${filter === d
                  ? 'bg-primary/20 border-primary text-primary neon-text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" style={{ perspective: '1200px' }}>
          <AnimatePresence>
            {filteredProblems.map((problem, idx) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                idx={idx}
                onClick={() => setLocation(`/arena/${problem.id}`)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!isLoading && filteredProblems.length === 0 && (
        <div className="text-center py-20 font-mono text-muted-foreground border-2 border-dashed border-border/50 p-8">
          [ERR 404] NO MATRICES FOUND MATCHING QUERY
        </div>
      )}
    </div>
  );
}
