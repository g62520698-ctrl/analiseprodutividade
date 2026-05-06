import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import dayjs from 'dayjs';
import type { DaySummary, AppFilters } from '../types';
import {
  formatSecondsToReadable, formatNumber,
  getPerformanceBg, getCorDesempenho, getPerformanceColor,
} from '../utils/helpers';

interface Props {
  summaries: DaySummary[];
  filters: AppFilters;
  setFilters: React.Dispatch<React.SetStateAction<AppFilters>>;
  usuarios: string[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '13px',
};

// SVG Gradients
function ChartGradients() {
  return (
    <defs>
      <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#9a3412" />
      </linearGradient>
      <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#5b21b6" />
      </linearGradient>
    </defs>
  );
}

// Performance Legend
function PerformanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-800/40 rounded-xl px-5 py-3 border border-slate-700/30">
      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1">Legenda:</span>
      <span className="flex items-center gap-1.5 text-xs text-slate-300">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Excelente (≤ 30s)
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-300">
        <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> Atenção (31–37s)
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-300">
        <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Baixo (38–50s)
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-300">
        <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Crítico (&gt; 50s)
      </span>
    </div>
  );
}

export default function Dashboard({ summaries, filters, setFilters, usuarios }: Props) {
  const filtered = useMemo(() => {
    return summaries.filter(s => {
      if (filters.usuario && s.usuario !== filters.usuario) return false;
      if (filters.dataInicio && s.data < filters.dataInicio) return false;
      if (filters.dataFim && s.data > filters.dataFim) return false;
      return true;
    });
  }, [summaries, filters]);

  const totals = useMemo(() => {
    const v = filtered.reduce((s, d) => s + d.volumes, 0);
    const p = filtered.reduce((s, d) => s + d.tempoProdutivoSeg, 0);
    const o = filtered.reduce((s, d) => s + d.tempoOciosoSeg, 0);
    const vh = filtered.length > 0 ? filtered.reduce((s, d) => s + d.volHora, 0) / filtered.length : 0;
    const sv = v > 0 ? p / v : 0;
    const dAvg = filtered.length > 0 ? filtered.reduce((s, x) => s + x.desempenho, 0) / filtered.length : 0;
    return { volumes: v, produtivo: p, ocioso: o, volHora: vh, segVol: sv, desempenho: dAvg };
  }, [filtered]);

  // === PER-SEPARADOR CHART DATA ===
  const segVolByUser = useMemo(() => {
    const map: Record<string, { sv: number[] }> = {};
    for (const s of filtered) {
      if (!map[s.usuario]) map[s.usuario] = { sv: [] };
      map[s.usuario].sv.push(s.segVol);
    }
    return Object.entries(map).map(([u, d]) => ({
      name: u.length > 14 ? u.slice(0, 14) + '…' : u,
      fullName: u,
      'Seg/vol': Math.round((d.sv.reduce((a, b) => a + b, 0) / d.sv.length) * 10) / 10,
    })).sort((a, b) => a['Seg/vol'] - b['Seg/vol']);
  }, [filtered]);

  const desempenhoByUser = useMemo(() => {
    const map: Record<string, { d: number[]; sv: number[] }> = {};
    for (const s of filtered) {
      if (!map[s.usuario]) map[s.usuario] = { d: [], sv: [] };
      map[s.usuario].d.push(s.desempenho);
      map[s.usuario].sv.push(s.segVol);
    }
    return Object.entries(map).map(([u, data]) => {
      const avgDesemp = data.d.reduce((a, b) => a + b, 0) / data.d.length;
      const avgSegVol = data.sv.reduce((a, b) => a + b, 0) / data.sv.length;
      return {
        name: u.length > 14 ? u.slice(0, 14) + '…' : u,
        fullName: u,
        'Desempenho (%)': Math.round(avgDesemp * 10) / 10,
        segVol: Math.round(avgSegVol * 10) / 10,
      };
    }).sort((a, b) => b['Desempenho (%)'] - a['Desempenho (%)']);
  }, [filtered]);

  const volHoraByUser = useMemo(() => {
    const map: Record<string, { vh: number[]; sv: number[] }> = {};
    for (const s of filtered) {
      if (!map[s.usuario]) map[s.usuario] = { vh: [], sv: [] };
      map[s.usuario].vh.push(s.volHora);
      map[s.usuario].sv.push(s.segVol);
    }
    return Object.entries(map).map(([u, data]) => ({
      name: u.length > 14 ? u.slice(0, 14) + '…' : u,
      fullName: u,
      'Vol/h': Math.round((data.vh.reduce((a, b) => a + b, 0) / data.vh.length) * 10) / 10,
      segVol: Math.round((data.sv.reduce((a, b) => a + b, 0) / data.sv.length) * 10) / 10,
    })).sort((a, b) => b['Vol/h'] - a['Vol/h']);
  }, [filtered]);

  // === TIME-BASED CHARTS ===
  const volumesChart = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const s of filtered) byDate[s.data] = (byDate[s.data] || 0) + s.volumes;
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, v]) => ({ name: dayjs(d).format('DD/MM'), Volumes: v }));
  }, [filtered]);

  const perfChart = useMemo(() => {
    const byDate: Record<string, number[]> = {};
    for (const s of filtered) {
      if (!byDate[s.data]) byDate[s.data] = [];
      byDate[s.data].push(s.desempenho);
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, vals]) => ({
        name: dayjs(d).format('DD/MM'),
        Desempenho: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
      }));
  }, [filtered]);

  const timeChart = useMemo(() => {
    const byDate: Record<string, { p: number; o: number }> = {};
    for (const s of filtered) {
      if (!byDate[s.data]) byDate[s.data] = { p: 0, o: 0 };
      byDate[s.data].p += s.tempoProdutivoSeg / 60;
      byDate[s.data].o += s.tempoOciosoSeg / 60;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, { p, o }]) => ({ name: dayjs(d).format('DD/MM'), Produtivo: Math.round(p), Ocioso: Math.round(o) }));
  }, [filtered]);

  const kpiCards = [
    { label: 'Volumes', value: totals.volumes.toLocaleString('pt-BR'), icon: '📦', color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30', textCol: 'text-blue-400' },
    { label: 'Tempo Produtivo', value: formatSecondsToReadable(totals.produtivo), icon: '⏱️', color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30', textCol: 'text-emerald-400' },
    { label: 'Tempo Ocioso', value: formatSecondsToReadable(totals.ocioso), icon: '⏳', color: 'from-red-500/20 to-red-600/5 border-red-500/30', textCol: 'text-red-400' },
    { label: 'Produtividade (vol/h)', value: formatNumber(totals.volHora), icon: '📈', color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30', textCol: 'text-purple-400' },
    { label: 'Seg/vol', value: formatNumber(totals.segVol), icon: '⏲️', color: getPerformanceBg(totals.desempenho), textCol: getPerformanceColor(totals.desempenho) },
    { label: 'Desempenho', value: `${formatNumber(totals.desempenho)}%`, icon: '🎯', color: getPerformanceBg(totals.desempenho), textCol: getPerformanceColor(totals.desempenho) },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/20">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Período</label>
          <select
            value={filters.periodo}
            onChange={e => {
              const periodo = e.target.value as AppFilters['periodo'];
              const today = dayjs().format('YYYY-MM-DD');
              let dataInicio = '';
              const dataFim = today;
              if (periodo === 'dia') dataInicio = today;
              else if (periodo === 'semana') dataInicio = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
              else if (periodo === 'mes') dataInicio = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
              setFilters({ ...filters, periodo, dataInicio, dataFim });
            }}
            className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none min-w-[120px]"
          >
            <option value="">Personalizado</option>
            <option value="dia">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Início</label>
          <input type="date" value={filters.dataInicio} onChange={e => setFilters({ ...filters, dataInicio: e.target.value, periodo: '' })} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Fim</label>
          <input type="date" value={filters.dataFim} onChange={e => setFilters({ ...filters, dataFim: e.target.value, periodo: '' })} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Separador</label>
          <select value={filters.usuario} onChange={e => setFilters({ ...filters, usuario: e.target.value })} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none min-w-[160px]">
            <option value="">Todos</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <button onClick={() => setFilters({ periodo: '', dataInicio: '', dataFim: '', usuario: '' })} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors">Limpar Filtros</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border rounded-xl p-4 hover:scale-[1.04] hover:shadow-lg hover:shadow-black/30 transition-all duration-300 cursor-default shadow-md shadow-black/10`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{card.label}</span>
            </div>
            <div className={`text-xl md:text-2xl font-bold ${card.textCol}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Performance Legend */}
      <PerformanceLegend />

      {/* Charts */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {/* Per-separador comparison charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Seg/vol by Separador */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">⏲️ Seg/vol por Separador</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={segVolByUser} layout="vertical" margin={{ left: 10 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} width={95} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Seg/vol" radius={[0, 6, 6, 0]}>
                    {segVolByUser.map((entry, idx) => (
                      <Cell key={idx} fill={getCorDesempenho(entry['Seg/vol'])} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desempenho by Separador */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">🎯 Desempenho (%) por Separador</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={desempenhoByUser} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} width={95} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Desempenho (%)" radius={[0, 6, 6, 0]}>
                    {desempenhoByUser.map((entry, idx) => (
                      <Cell key={idx} fill={getCorDesempenho(entry.segVol)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Vol/h by Separador */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">📈 Produtividade (Vol/h) por Separador</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volHoraByUser} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} width={95} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Vol/h" radius={[0, 6, 6, 0]}>
                    {volHoraByUser.map((entry, idx) => (
                      <Cell key={idx} fill={getCorDesempenho(entry.segVol)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time-based charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">📊 Volumes por Dia</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={volumesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Volumes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">📈 Evolução do Desempenho</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={perfChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="Desempenho" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 lg:col-span-2 shadow-lg shadow-black/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">⏱️ Tempo Produtivo vs Ocioso (min)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="Produtivo" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                  <Area type="monotone" dataKey="Ocioso" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center shadow-lg shadow-black/10">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400 text-lg">Nenhum dado encontrado</p>
          <p className="text-slate-500 text-sm mt-1">Importe uma planilha Excel para começar</p>
        </div>
      )}
    </div>
  );
}
