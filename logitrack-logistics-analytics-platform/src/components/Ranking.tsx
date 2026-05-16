import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Trophy, Award, AlertTriangle, XCircle, Star } from 'lucide-react';
import type { OperatorMetrics } from '../types';

const classColors: Record<string, string> = {
  Excelente: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Bom: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Atenção: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Crítico: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const classIcons: Record<string, React.ReactNode> = {
  Excelente: <Trophy size={14} />,
  Bom: <Award size={14} />,
  Atenção: <AlertTriangle size={14} />,
  Crítico: <XCircle size={14} />,
};

type SortField = 'performance' | 'productivity' | 'totalVolumes' | 'totalTarefas' | 'segVol' | 'idleTime';

export function Ranking({ metrics }: { metrics: OperatorMetrics[] }) {
  // Default sort: performance (desc) → productivity → volumes
  const [sortField, setSortField] = useState<SortField>('performance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...metrics].sort((a, b) => {
      // Primary sort field
      const mult = sortDir === 'desc' ? -1 : 1;
      const primary = mult * ((a[sortField] as number) - (b[sortField] as number));
      if (Math.abs(primary) > 0.01) return primary;
      // Secondary: productivity
      const secondary = -1 * (b.productivity - a.productivity);
      if (Math.abs(secondary) > 0.01) return secondary;
      // Tertiary: volumes
      return -1 * (b.totalVolumes - a.totalVolumes);
    });
  }, [metrics, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    return (
      <th
        className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)] cursor-pointer hover:text-neon-cyan transition-colors select-none"
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          <ArrowUpDown size={10} className={sortField === field ? 'text-neon-cyan' : 'opacity-30'} />
        </div>
      </th>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ranking de Operadores</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Ordenado por: desempenho % → produtividade → volumes</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-tertiary)]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)]">#</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Operador</th>
              <SortHeader field="totalTarefas" label="Tarefas" />
              <SortHeader field="totalVolumes" label="Volumes" />
              <SortHeader field="productivity" label="Prod/H" />
              <SortHeader field="performance" label="Desempenho" />
              <SortHeader field="segVol" label="Seg/Vol" />
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)]">T. Prod.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)]">T. Ocioso</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Classificação</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <motion.tr
                key={m.operatorId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-3 py-3 text-[var(--text-muted)] font-mono text-xs">
                  {i === 0 ? <Star size={14} className="text-neon-amber" /> : i + 1}
                </td>
                <td className="px-3 py-3 text-[var(--text-primary)] font-medium">{m.operatorName}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.totalTarefas}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.totalVolumes.toLocaleString()}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.productivity.toFixed(1)}</td>
                <td className="px-3 py-3">
                  <span className={`font-bold ${m.performance >= 100 ? 'text-emerald-400' : m.performance >= 80 ? 'text-blue-400' : m.performance >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.performance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.segVol.toFixed(1)}s</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.productiveHours.toFixed(2)}h</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{m.idleHours.toFixed(2)}h</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${classColors[m.classification]}`}>
                    {classIcons[m.classification]} {m.classification}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
