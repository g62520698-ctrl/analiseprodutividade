import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export function Insights({ insights }: { insights: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Lightbulb size={16} className="text-neon-amber" />
        Insights Inteligentes
      </h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[var(--bg-tertiary)] rounded-lg p-3.5 border-l-3 border-neon-cyan/30 text-sm text-[var(--text-secondary)]"
          >
            {insight}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
