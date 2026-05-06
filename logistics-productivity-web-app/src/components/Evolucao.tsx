import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import type { DaySummary } from '../types';
import {
  getCorDesempenho, getPerformanceColor, getPerformanceStatusText,
} from '../utils/helpers';

interface Props {
  summaries: DaySummary[];
  usuarios: string[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '13px',
};

export default function Evolucao({ summaries, usuarios }: Props) {
  const [selectedUser, setSelectedUser] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const filtered = useMemo(() => {
    return summaries.filter(s => {
      if (selectedUser && s.usuario !== selectedUser) return false;
      if (dataInicio && s.data < dataInicio) return false;
      if (dataFim && s.data > dataFim) return false;
      return true;
    });
  }, [summaries, selectedUser, dataInicio, dataFim]);

  const userData = useMemo(() => {
    const map: Record<string, DaySummary[]> = {};
    for (const s of filtered) {
      if (!map[s.usuario]) map[s.usuario] = [];
      map[s.usuario].push(s);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.data.localeCompare(b.data));
    }
    return map;
  }, [filtered]);

  const displayUsers = selectedUser ? { [selectedUser]: userData[selectedUser] || [] } : userData;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-lg shadow-black/20">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Separador</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none min-w-[180px]">
            <option value="">Todos</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Início</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Fim</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col justify-end">
          <button onClick={() => { setSelectedUser(''); setDataInicio(''); setDataFim(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors">Limpar Filtros</button>
        </div>
      </div>

      {/* Performance Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-800/40 rounded-xl px-5 py-3 border border-slate-700/30">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Legenda:</span>
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

      {/* Content */}
      {Object.keys(displayUsers).length === 0 ? (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center shadow-lg shadow-black/10">
          <div className="text-5xl mb-4">📈</div>
          <p className="text-slate-400 text-lg">Nenhum dado para exibir</p>
          <p className="text-slate-500 text-sm mt-1">Importe dados e selecione um separador</p>
        </div>
      ) : (
        Object.entries(displayUsers).map(([usuario, data]) => {
          const chartData = data.map(s => ({
            name: dayjs(s.data).format('DD/MM'),
            'Vol/h': s.volHora,
            'Seg/vol': s.segVol,
            'Desempenho (%)': s.desempenho,
            Volumes: s.volumes,
          }));

          const avgVolH = data.length > 0 ? data.reduce((s, d) => s + d.volHora, 0) / data.length : 0;
          const avgSegVol = data.length > 0 ? data.reduce((s, d) => s + d.segVol, 0) / data.length : 0;
          const avgDesemp = data.length > 0 ? data.reduce((s, d) => s + d.desempenho, 0) / data.length : 0;
          const totalVol = data.reduce((s, d) => s + d.volumes, 0);

          // Line colors based on average seg/vol
          const lineColorVolH = getCorDesempenho(avgSegVol);
          const lineColorSegVol = getCorDesempenho(avgSegVol);
          const lineColorDesemp = getCorDesempenho(avgSegVol);

          return (
            <div key={usuario} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-lg shadow-black/10">
              {/* Header with dynamic color indicators */}
              <div className="px-5 py-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3 bg-slate-700/20">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span>{usuario}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: getCorDesempenho(avgSegVol) + '30', color: getCorDesempenho(avgSegVol) }}>
                      {getPerformanceStatusText(avgSegVol)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{data.length} dia(s) • {totalVol.toLocaleString()} volumes total</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: getCorDesempenho(avgSegVol) + '10', borderColor: getCorDesempenho(avgSegVol) + '30' }}>
                    <div className="text-lg font-bold" style={{ color: lineColorVolH }}>{avgVolH.toFixed(1)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Média Vol/h</div>
                  </div>
                  <div className="text-center px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: getCorDesempenho(avgSegVol) + '10', borderColor: getCorDesempenho(avgSegVol) + '30' }}>
                    <div className="text-lg font-bold" style={{ color: lineColorSegVol }}>{avgSegVol.toFixed(1)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Média Seg/vol</div>
                  </div>
                  <div className="text-center px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: getCorDesempenho(avgSegVol) + '10', borderColor: getCorDesempenho(avgSegVol) + '30' }}>
                    <div className={`text-lg font-bold ${getPerformanceColor(avgDesemp)}`}>
                      {avgDesemp.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Média Desemp.</div>
                  </div>
                </div>
              </div>

              {/* 3 Separate Charts with dynamic line colors */}
              {chartData.length >= 2 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-slate-700/50">
                  <div className="p-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                      style={{ color: lineColorVolH }}>
                      <span>📈</span> Produtividade (Vol/h)
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="Vol/h" stroke={lineColorVolH} strokeWidth={2.5} dot={{ fill: lineColorVolH, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                      style={{ color: lineColorSegVol }}>
                      <span>⏲️</span> Segundos por Volume
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="Seg/vol" stroke={lineColorSegVol} strokeWidth={2.5} dot={{ fill: lineColorSegVol, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                      style={{ color: lineColorDesemp }}>
                      <span>🎯</span> Desempenho (%)
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="Desempenho (%)" stroke={lineColorDesemp} strokeWidth={2.5} dot={{ fill: lineColorDesemp, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Necessário pelo menos 2 dias de dados para gerar gráficos individuais
                </div>
              )}

              {/* Daily Table with dynamic colors */}
              <div className="overflow-x-auto border-t border-slate-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700/40">
                      <th className="px-4 py-2.5 text-left text-slate-400 font-semibold text-xs">Data</th>
                      <th className="px-4 py-2.5 text-center text-slate-400 font-semibold text-xs">Status</th>
                      <th className="px-4 py-2.5 text-right text-slate-400 font-semibold text-xs">Volumes</th>
                      <th className="px-4 py-2.5 text-right text-slate-400 font-semibold text-xs">Vol/h</th>
                      <th className="px-4 py-2.5 text-right text-slate-400 font-semibold text-xs">Seg/vol</th>
                      <th className="px-4 py-2.5 text-right text-slate-400 font-semibold text-xs">Desempenho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((s, i) => (
                      <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-2 text-slate-300">{dayjs(s.data).format('DD/MM/YYYY')}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: getCorDesempenho(s.segVol) }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCorDesempenho(s.segVol) }} />
                            {getPerformanceStatusText(s.segVol)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-blue-400 font-medium">{s.volumes.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-purple-400">{s.volHora.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right font-bold" style={{ color: getCorDesempenho(s.segVol) }}>
                          {s.segVol.toFixed(1)}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${getPerformanceColor(s.desempenho)}`}>
                          {s.desempenho.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
