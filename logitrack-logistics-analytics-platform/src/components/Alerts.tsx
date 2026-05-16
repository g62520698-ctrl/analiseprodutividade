import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Coffee, CheckCircle, Filter, Search, ChevronDown } from 'lucide-react';
import type { AlertItem } from '../types';

const typeConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  NORMAL: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <CheckCircle size={13} />, label: 'Normal' },
  AVISO: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: <AlertTriangle size={13} />, label: 'Atenção' },
  OCIOSIDADE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: <Clock size={13} />, label: 'Ociosidade' },
  ALMOÇO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: <Coffee size={13} />, label: 'Almoço' },
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(Math.abs(totalSeconds) / 3600);
  const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
  const s = Math.floor(Math.abs(totalSeconds) % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

const ROW_HEIGHT = 44;
const OVERSCAN = 15;

export function Alerts({ alerts }: { alerts: AlertItem[] }) {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(500);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(460);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Responsive height calculation
  useEffect(() => {
    const update = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        const avail = window.innerHeight - rect.bottom - 60;
        setContainerHeight(Math.max(280, Math.min(650, avail)));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    let result = alerts;
    if (filter !== 'ALL') result = result.filter((a) => a.tipoAlerta === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.operatorName.toLowerCase().includes(q));
    }
    return result;
  }, [alerts, filter, search]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const counts = useMemo(() => ({
    ALL: alerts.length,
    NORMAL: alerts.filter((a) => a.tipoAlerta === 'NORMAL').length,
    AVISO: alerts.filter((a) => a.tipoAlerta === 'AVISO').length,
    OCIOSIDADE: alerts.filter((a) => a.tipoAlerta === 'OCIOSIDADE').length,
    ALMOÇO: alerts.filter((a) => a.tipoAlerta === 'ALMOÇO').length,
  }), [alerts]);

  // Virtual scroll calculations
  const totalHeight = visible.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(visible.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleSlice = visible.slice(startIndex, endIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 500, filtered.length));
  }, [filtered.length]);

  // Row renderer
  const renderRow = useCallback((alert: AlertItem) => {
    const cfg = typeConfig[alert.tipoAlerta] || typeConfig.NORMAL;
    const isIdle = alert.tipoAlerta === 'OCIOSIDADE';
    return (
      <div
        key={alert.id}
        className={`flex items-center border-b border-[var(--border-color)] text-xs transition-colors ${
          isIdle ? 'bg-red-500/[0.03]' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
        style={{ height: ROW_HEIGHT }}
      >
        <div className="flex-[0_0_16%] px-3 text-[var(--text-primary)] font-medium truncate">{alert.operatorName}</div>
        <div className="flex-[0_0_10%] px-2 text-[var(--text-muted)]">{alert.date.split('-').reverse().join('/')}</div>
        <div className="flex-[0_0_9%] px-2 text-[var(--text-secondary)] font-mono">{alert.horaInicio}</div>
        <div className="flex-[0_0_9%] px-2 text-[var(--text-secondary)] font-mono">{alert.horaFim}</div>
        <div className="flex-[0_0_11%] px-2 text-[var(--text-secondary)] font-mono">{formatDuration(alert.duracao)}</div>
        <div className="flex-[0_0_8%] px-2 text-[var(--text-secondary)] text-right">{alert.volumes || '—'}</div>
        <div className="flex-[0_0_8%] px-2 text-[var(--text-secondary)] text-right">{alert.segVol > 0 ? `${alert.segVol.toFixed(1)}s` : '—'}</div>
        <div className="flex-[0_0_12%] px-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div ref={headerRef} className="px-5 py-4 border-b border-[var(--border-color)] space-y-3 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Filter size={16} className="text-neon-cyan" />
            Alertas Operacionais
            <span className="text-xs font-normal text-[var(--text-muted)]">
              {filtered.length.toLocaleString()} registros
              {hasMore ? ` — mostrando ${visible.length.toLocaleString()}` : ''}
            </span>
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar operador..."
              className="pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan w-48" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'NORMAL', 'AVISO', 'OCIOSIDADE', 'ALMOÇO'] as const).map((type) => (
            <button key={type} onClick={() => { setFilter(type); setVisibleCount(500); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === type ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-color)]'
              }`}>
              {type === 'ALL' ? 'Todos' : type} ({counts[type].toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center bg-[var(--bg-tertiary)] text-[10px] font-medium text-[var(--text-muted)] border-b border-[var(--border-color)] shrink-0" style={{ height: ROW_HEIGHT }}>
        <div className="flex-[0_0_16%] px-3">OPERADOR</div>
        <div className="flex-[0_0_10%] px-2">DATA</div>
        <div className="flex-[0_0_9%] px-2">INÍCIO</div>
        <div className="flex-[0_0_9%] px-2">FIM</div>
        <div className="flex-[0_0_11%] px-2">DURAÇÃO</div>
        <div className="flex-[0_0_8%] px-2 text-right">VOL.</div>
        <div className="flex-[0_0_8%] px-2 text-right">SEG/VOL</div>
        <div className="flex-[0_0_12%] px-2">TIPO</div>
      </div>

      {/* Virtual scroll container */}
      {visible.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-12 text-sm">Nenhum alerta encontrado</div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{ height: containerHeight, overflow: 'auto' }}
          className="will-change-scroll"
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: startIndex * ROW_HEIGHT, left: 0, right: 0 }}>
              {visibleSlice.map(renderRow)}
            </div>
          </div>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center py-2.5 border-t border-[var(--border-color)] shrink-0">
          <button onClick={loadMore}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neon-cyan bg-neon-cyan/10 rounded-lg hover:bg-neon-cyan/20 transition-colors">
            <ChevronDown size={14} />
            Carregar mais ({(filtered.length - visibleCount).toLocaleString()} restantes)
          </button>
        </div>
      )}
    </motion.div>
  );
}
