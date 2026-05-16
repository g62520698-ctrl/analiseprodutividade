import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  hour: number;
  day: string;
  value: number;
  count: number;
}

export function Heatmap({ data }: { data: HeatmapData[] }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 6);
  const days = useMemo(() => {
    const daySet = new Set(data.map((d) => d.day));
    const order = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return order.filter((d) => daySet.has(d));
  }, [data]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Green=peak, Blue=high, Yellow=moderate, Red=low
  function getColor(value: number): string {
    const intensity = value / maxValue;
    if (intensity === 0) return 'var(--border-color)';
    if (intensity >= 0.8) return 'rgba(16, 185, 129, 0.85)';   // Green - peak
    if (intensity >= 0.6) return 'rgba(59, 130, 246, 0.75)';    // Blue - high
    if (intensity >= 0.3) return 'rgba(245, 158, 11, 0.65)';    // Yellow/amber - moderate
    return 'rgba(239, 68, 68, 0.55)';                            // Red - low
  }

  function getLabel(value: number): string {
    const intensity = value / maxValue;
    if (intensity === 0) return 'Sem atividade';
    if (intensity >= 0.8) return 'Pico de performance';
    if (intensity >= 0.6) return 'Alto desempenho';
    if (intensity >= 0.3) return 'Moderado';
    return 'Baixo desempenho';
  }

  if (data.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Heatmap Operacional</h3>
        <div className="text-center text-[var(--text-muted)] py-10">Nenhum dado disponível</div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl p-4 md:p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Heatmap Operacional</h3>
      <p className="text-xs text-[var(--text-muted)] mb-4">Concentração de atividade por horário e dia</p>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex mb-1">
            <div className="w-12 shrink-0" />
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-[var(--text-muted)] px-0.5">{h}h</div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="flex mb-1">
              <div className="w-12 shrink-0 text-[11px] text-[var(--text-secondary)] flex items-center pr-2">{day}</div>
              {hours.map((hour) => {
                const cell = data.find((d) => d.hour === hour && d.day === day);
                const value = cell?.value || 0;
                return (
                  <div key={`${day}-${hour}`} className="flex-1 px-0.5">
                    <div
                      className="rounded-sm aspect-square flex items-center justify-center text-[10px] font-medium transition-all duration-200 hover:scale-110 cursor-default"
                      style={{ backgroundColor: getColor(value), color: value > 0 ? 'white' : 'transparent' }}
                      title={`${day} ${hour}h: ${value} volumes — ${getLabel(value)}`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-[var(--text-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--border-color)' }} /> Sem atividade
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500/60" /> Baixo
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-500/70" /> Moderado
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-500/75" /> Alto
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/85" /> Pico
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
