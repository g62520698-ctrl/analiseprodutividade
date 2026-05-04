import { useMemo, useState } from 'react';
import {
  Bell, CheckCircle2, ChevronDown, ChevronRight, Briefcase, AlertTriangle,
  TrendingDown, UtensilsCrossed, AlertCircle, Minus, Clock,
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import { calcularResumos, gerarAlertas, getUniqueUsuarios } from '../utils/calculations';
import type { DetailedAlert } from '../types';

const CFG: Record<string, { icon: typeof Bell; bg: string; border: string; ic: string; label: string }> = {
  tarefa:            { icon: Briefcase,       bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', ic: 'text-emerald-400', label: 'Tarefa' },
  intervalo:         { icon: Minus,           bg: 'bg-amber-500/8',   border: 'border-amber-500/20',   ic: 'text-amber-400',   label: 'Intervalo' },
  ociosidade:        { icon: AlertCircle,     bg: 'bg-red-500/8',     border: 'border-red-500/20',     ic: 'text-red-400',     label: 'Ociosidade' },
  ociosidade_final:  { icon: Clock,           bg: 'bg-red-500/8',     border: 'border-red-500/20',     ic: 'text-red-400',     label: 'Ocioso Final' },
  almoco:            { icon: UtensilsCrossed, bg: 'bg-violet-500/8',  border: 'border-violet-500/20',  ic: 'text-violet-400',  label: 'Almoço' },
  baixo_desempenho:  { icon: TrendingDown,    bg: 'bg-red-500/8',     border: 'border-red-500/20',     ic: 'text-red-400',     label: 'Baixo Desempenho' },
  queda:             { icon: AlertTriangle,   bg: 'bg-orange-500/8',  border: 'border-orange-500/20',  ic: 'text-orange-400',  label: 'Queda' },
};

function AlertRow({ alert: a, onRead }: { alert: DetailedAlert; onRead: (id: string) => void }) {
  const c = CFG[a.tipo] || CFG.intervalo; const Icon = c.icon;
  return (
    <div className={`${c.bg} border ${c.border} rounded-lg px-3 py-2 flex items-center gap-3 ${a.lido ? 'opacity-40' : ''}`}>
      <Icon className={`w-4 h-4 ${c.ic} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold ${c.ic}`}>{c.label}</span>
          {a.horaInicio && <span className="text-[10px] text-slate-500">{a.horaInicio}{a.horaFim ? ` → ${a.horaFim}` : ''}</span>}
          {a.volumes > 0 && <span className="text-[10px] text-blue-400">{a.volumes} vol</span>}
          {a.tempoPorVolSeg > 0 && <span className="text-[10px] text-cyan-400">{a.tempoPorVolSeg.toFixed(1)} seg/vol</span>}
          {a.severidade === 'high' && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">ALTA</span>}
          {a.severidade === 'warning' && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">AVISO</span>}
        </div>
        <p className="text-xs text-slate-300 mt-0.5">{a.mensagem}</p>
      </div>
      {!a.lido && <button onClick={() => onRead(a.id)} className="text-[10px] text-slate-500 hover:text-white px-2 py-1 rounded hover:bg-white/5 shrink-0">Ler</button>}
    </div>
  );
}

export function Alerts() {
  const records = useStore(s => s.records);
  const alerts = useStore(s => s.alerts);
  const markRead = useStore(s => s.markAlertRead);
  const clearAll = useStore(s => s.clearAlerts);
  const [fTipo, setFTipo] = useState('todos');
  const [fUser, setFUser] = useState('');
  const [showLidos, setShowLidos] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const usuarios = useMemo(() => getUniqueUsuarios(records), [records]);
  const allAlerts = useMemo(() => { if (records.length === 0) return []; return gerarAlertas(records, calcularResumos(records)); }, [records]);
  const active = alerts.length > 0 ? alerts : allAlerts;

  const filtered = useMemo(() => {
    let r = [...active]; if (!showLidos) r = r.filter(a => !a.lido);
    if (fTipo !== 'todos') r = r.filter(a => a.tipo === fTipo);
    if (fUser) r = r.filter(a => a.usuario === fUser); return r;
  }, [active, fTipo, fUser, showLidos]);

  const grouped = useMemo(() => {
    const m = new Map<string, DetailedAlert[]>();
    for (const a of filtered) { if (!m.has(a.usuario)) m.set(a.usuario, []); m.get(a.usuario)!.push(a); }
    for (const [, arr] of m) arr.sort((a, b) => { if (a.data !== b.data) return a.data.localeCompare(b.data); return (a.horaInicio || '').localeCompare(b.horaInicio || ''); });
    return m;
  }, [filtered]);

  useMemo(() => { const ex = new Set<string>(); for (const a of active) { if (a.severidade === 'high' && !a.lido) ex.add(a.usuario); } setExpanded(ex); }, [active]);

  const stats = useMemo(() => ({ total: active.length, unread: active.filter(a => !a.lido).length, tarefa: active.filter(a => a.tipo === 'tarefa').length, intervalo: active.filter(a => a.tipo === 'intervalo').length, ociosidade: active.filter(a => a.tipo === 'ociosidade' || a.tipo === 'ociosidade_final').length, almoco: active.filter(a => a.tipo === 'almoco').length, alto: active.filter(a => a.severidade === 'high').length }), [active]);

  const toggle = (u: string) => setExpanded(p => { const n = new Set(p); if (n.has(u)) n.delete(u); else n.add(u); return n; });

  if (records.length === 0) return <div className="flex flex-col items-center justify-center py-32 text-center"><Bell className="w-16 h-16 text-slate-700 mb-4" /><h3 className="text-lg font-semibold text-slate-400 mb-2">Sem dados</h3><p className="text-sm text-slate-500">Importe dados para gerar alertas</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[{ l: 'Total', v: stats.total, c: 'text-white' }, { l: 'Não Lidos', v: stats.unread, c: 'text-amber-400' }, { l: 'Tarefas', v: stats.tarefa, c: 'text-emerald-400' }, { l: 'Intervalos', v: stats.intervalo, c: 'text-amber-400' }, { l: 'Ociosidade', v: stats.ociosidade, c: 'text-red-400' }, { l: 'Almoço', v: stats.almoco, c: 'text-violet-400' }, { l: 'Alta Severid.', v: stats.alto, c: 'text-red-400' }].map(s => (
          <div key={s.l} className="bg-[#151b2b] rounded-xl p-3 border border-slate-800/60"><div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{s.l}</div><div className={`text-xl font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={fTipo} onChange={e => setFTipo(e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="todos">Todos os Tipos</option>
          <option value="tarefa">✅ Tarefa</option><option value="intervalo">⚠️ Intervalo</option><option value="ociosidade">🔴 Ociosidade</option><option value="ociosidade_final">🔴 Ocioso Final</option><option value="almoco">🍽️ Almoço</option><option value="baixo_desempenho">📉 Baixo Desempenho</option><option value="queda">⬇️ Queda</option>
        </select>
        <select value={fUser} onChange={e => setFUser(e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos Separadores</option>{usuarios.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer"><input type="checkbox" checked={showLidos} onChange={e => setShowLidos(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500" /> Mostrar lidos</label>
        {active.length > 0 && <button onClick={clearAll} className="ml-auto px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60">Limpar todos</button>}
      </div>

      {filtered.length === 0 ? (<div className="text-center py-16"><CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" /><p className="text-sm text-slate-400">{active.length === 0 ? 'Nenhum alerta.' : 'Nenhum alerta com os filtros aplicados.'}</p></div>
      ) : (<div className="space-y-3">
        {Array.from(grouped.entries()).map(([usuario, uAlerts]) => {
          const isExp = expanded.has(usuario); const hi = uAlerts.filter(a => a.severidade === 'high' && !a.lido).length; const tc = uAlerts.filter(a => a.tipo === 'tarefa').length; const ic = uAlerts.filter(a => a.tipo === 'ociosidade' || a.tipo === 'ociosidade_final').length; const lc = uAlerts.filter(a => a.tipo === 'almoco').length;
          return (<div key={usuario} className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
            <button onClick={() => toggle(usuario)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left">
              {isExp ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="text-sm font-semibold text-white flex-1">{usuario}</span>
              <div className="flex items-center gap-2">
                {tc > 0 && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">{tc} tarefas</span>}
                {ic > 0 && <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">{ic} ocioso</span>}
                {lc > 0 && <span className="text-[10px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full font-medium">{lc} almoço</span>}
                {hi > 0 && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{hi} crítico</span>}
              </div>
            </button>
            {isExp && <div className="px-4 pb-3 space-y-1.5">{uAlerts.map(a => <AlertRow key={a.id} alert={a} onRead={markRead} />)}</div>}
          </div>);
        })}
      </div>)}
    </div>
  );
}
