import { useMemo, useEffect, type ReactNode } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend,
} from 'recharts';
import { Package, Pause, TrendingUp, Target, Timer, Briefcase } from 'lucide-react';
import { useStore } from '../stores/useStore';
import {
  calcularResumos, calcularKPI, gerarDadosGraficoProdutividade,
  gerarDadosGraficoEvolucao, gerarDadosGraficoTempo, gerarAlertas,
  formatMinutes, META_VOL_POR_HORA, META_SEGUNDOS, getUniqueUsuarios,
} from '../utils/calculations';
import dayjs from 'dayjs';
import type { FilterPeriod } from '../types';

interface KPICardProps { title: string; value: string; subtitle?: ReactNode; icon: typeof Package; color: string; bgColor: string }
function KPICard({ title, value, subtitle, icon: Icon, color, bgColor }: KPICardProps) {
  return (
    <div className="bg-[#151b2b] rounded-xl p-4 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}><Icon className={`w-4 h-4 ${color}`} /></div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      {subtitle && <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

interface TP { name: string; value: number; color: string }
function CTip({ active, payload, label }: { active?: boolean; payload?: TP[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2236] border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} className="text-sm font-semibold" style={{ color: e.color }}>{e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</p>)}
    </div>
  );
}

function barColor(v: number) { return v >= META_VOL_POR_HORA ? '#10b981' : v >= META_VOL_POR_HORA * 0.5 ? '#f59e0b' : '#ef4444'; }
const PER: { key: FilterPeriod; label: string }[] = [{ key: 'diario', label: 'Diário' }, { key: 'semanal', label: 'Semanal' }, { key: 'mensal', label: 'Mensal' }];

export function Dashboard() {
  const records = useStore(s => s.records);
  const periodo = useStore(s => s.periodo);
  const dataSel = useStore(s => s.dataSelecionada);
  const sepSel = useStore(s => s.separadorSelecionado);
  const setP = useStore(s => s.setPeriodo);
  const setD = useStore(s => s.setDataSelecionada);
  const setS = useStore(s => s.setSeparadorSelecionado);
  const setAlerts = useStore(s => s.setAlerts);
  const setPage = useStore(s => s.setCurrentPage);

  const filtered = useMemo(() => {
    let r = [...records];
    if (periodo === 'diario') r = r.filter(x => x.data === dataSel);
    else if (periodo === 'semanal') { const s = dayjs(dataSel).startOf('week'), e = s.add(7, 'day'); r = r.filter(x => { const d = dayjs(x.data); return (d.isAfter(s) || d.isSame(s, 'day')) && d.isBefore(e); }); }
    else { const m = dayjs(dataSel).format('YYYY-MM'); r = r.filter(x => x.data.startsWith(m)); }
    if (sepSel) r = r.filter(x => x.usuario === sepSel);
    return r.sort((a, b) => a.timestamp - b.timestamp);
  }, [records, periodo, dataSel, sepSel]);

  const resumos = useMemo(() => calcularResumos(filtered), [filtered]);
  const kpi = useMemo(() => calcularKPI(resumos), [resumos]);
  const cProd = useMemo(() => gerarDadosGraficoProdutividade(resumos), [resumos]);
  const cEvo = useMemo(() => gerarDadosGraficoEvolucao(resumos), [resumos]);
  const cTempo = useMemo(() => gerarDadosGraficoTempo(resumos), [resumos]);
  const cRank = useMemo(() => gerarDadosGraficoProdutividade(resumos).slice(0, 10), [resumos]);
  const usuarios = useMemo(() => getUniqueUsuarios(records), [records]);

  useEffect(() => { if (resumos.length > 0) setAlerts(gerarAlertas(filtered, resumos)); }, [resumos, filtered, setAlerts]);

  const dCol = kpi.desempenho >= 100 ? 'text-emerald-400' : kpi.desempenho >= 50 ? 'text-amber-400' : 'text-red-400';

  const Filters = (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex bg-slate-800/60 rounded-lg p-0.5">
        {PER.map(p => <button key={p.key} onClick={() => setP(p.key)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${periodo === p.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>{p.label}</button>)}
      </div>
      <input type="date" value={dataSel} onChange={e => setD(e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
      <select value={sepSel} onChange={e => setS(e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Todos Separadores</option>
        {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <div className="text-xs text-slate-500 ml-auto">{resumos.length} resumo(s) · {kpi.separadoresAtivos} separador(es)</div>
    </div>
  );

  if (filtered.length === 0) {
    return <div>{Filters}
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-6"><Package className="w-10 h-10 text-slate-600" /></div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Nenhum dado encontrado</h3>
        <p className="text-sm text-slate-500 mb-6">Importe dados ou carregue demonstração.</p>
        <button onClick={() => setPage('importar')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Ir para Importação</button>
      </div>
    </div>;
  }

  return (
    <div>
      {Filters}

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPICard title="Volumes" value={kpi.totalVolumes.toLocaleString('pt-BR')} subtitle={`${kpi.totalRegistros} registros`} icon={Package} color="text-blue-400" bgColor="bg-blue-500/10" />
        <KPICard title="Tempo Produtivo" value={formatMinutes(kpi.totalProdutivo)} subtitle={`${(kpi.totalProdutivo / 60).toFixed(1)}h`} icon={Briefcase} color="text-emerald-400" bgColor="bg-emerald-500/10" />
        <KPICard title="Tempo Ocioso" value={formatMinutes(kpi.totalOcioso)} subtitle={`${(kpi.totalOcioso / 60).toFixed(1)}h`} icon={Pause} color="text-amber-400" bgColor="bg-amber-500/10" />
        <KPICard title="Produtividade" value={`${kpi.produtividade.toFixed(1)}`} subtitle={`vol/h (meta: ${META_VOL_POR_HORA})`} icon={TrendingUp} color={kpi.produtividade >= META_VOL_POR_HORA ? 'text-emerald-400' : 'text-red-400'} bgColor={kpi.produtividade >= META_VOL_POR_HORA ? 'bg-emerald-500/10' : 'bg-red-500/10'} />
        <KPICard title="Tempo Médio / Vol" value={`${kpi.tempoMedioSeg.toFixed(1)}s`} subtitle={`Meta: ${META_SEGUNDOS} seg/vol`} icon={Timer} color={kpi.tempoMedioSeg <= META_SEGUNDOS ? 'text-emerald-400' : 'text-red-400'} bgColor={kpi.tempoMedioSeg <= META_SEGUNDOS ? 'bg-emerald-500/10' : 'bg-red-500/10'} />
        <KPICard title="Desempenho" value={`${kpi.desempenho.toFixed(1)}%`} subtitle={`(${META_SEGUNDOS}s / ${kpi.tempoMedioSeg.toFixed(1)}s) × 100`} icon={Target} color={dCol} bgColor="bg-slate-500/10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151b2b] rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Produtividade por Separador</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cProd} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip content={<CTip />} />
              <ReferenceLine y={META_VOL_POR_HORA} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Meta 120', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="produtividade" name="Produtividade" radius={[4, 4, 0, 0]} maxBarSize={50}>{cProd.map((e, i) => <Cell key={i} fill={barColor(e.produtividade)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </div>

        <div className="bg-[#151b2b] rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Evolução por Período</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cEvo} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip content={<CTip />} />
              <ReferenceLine y={META_VOL_POR_HORA} stroke="#ef4444" strokeDasharray="5 5" />
              <Bar dataKey="produtividade" name="Produtividade" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer></div>
        </div>

        <div className="bg-[#151b2b] rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Tempo Produtivo × Ocioso</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cTempo} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip content={<CTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="produtivo" name="Produtivo (≤20min)" stackId="a" fill="#10b981" maxBarSize={50} />
              <Bar dataKey="ocioso" name="Ocioso (>20min + final)" stackId="a" fill="#f59e0b" maxBarSize={50} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </div>

        <div className="bg-[#151b2b] rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Ranking Top 10</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...cRank].reverse()} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} width={80} />
              <Tooltip content={<CTip />} />
              <ReferenceLine x={META_VOL_POR_HORA} stroke="#ef4444" strokeDasharray="5 5" />
              <Bar dataKey="produtividade" name="Produtividade" radius={[0, 4, 4, 0]} maxBarSize={25}>
                {cRank.map((_, i) => <Cell key={i} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#ef4444', '#84cc16', '#a855f7'][i % 10]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}
