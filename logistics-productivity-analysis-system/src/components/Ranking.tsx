import { useMemo, useState } from 'react';
import type { DaySummary } from '../types';
import { calculateRanking } from '../utils/calculations';
import {
  formatSecondsToHHMM, formatNumber, getPerformanceColor,
  getCorDesempenho, getPerformanceStatusText, getPerformanceStatusEmoji,
  getRowHighlight,
} from '../utils/helpers';

interface Props {
  summaries: DaySummary[];
  usuarios: string[];
}

type SortField = 'usuario' | 'volumes' | 'tempoProdutivoSeg' | 'tempoOciosoSeg' | 'volHora' | 'segVol' | 'volSeg' | 'desempenho';

export default function Ranking({ summaries, usuarios }: Props) {
  const [sortField, setSortField] = useState<SortField>('desempenho');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const ranking = useMemo(() => {
    let filtered = summaries;
    if (filterUser) filtered = filtered.filter(s => s.usuario === filterUser);
    if (filterDateStart) filtered = filtered.filter(s => s.data >= filterDateStart);
    if (filterDateEnd) filtered = filtered.filter(s => s.data <= filterDateEnd);
    return calculateRanking(filtered);
  }, [summaries, filterUser, filterDateStart, filterDateEnd]);

  const sorted = useMemo(() => {
    const data = [...ranking];
    data.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return data;
  }, [ranking, sortField, sortDir]);

  // Find best and worst by desempenho
  const bestUser = ranking.length > 0 ? ranking.reduce((best, r) => r.desempenho > best.desempenho ? r : best).usuario : '';
  const worstUser = ranking.length > 0 ? ranking.reduce((worst, r) => r.desempenho < worst.desempenho ? r : worst).usuario : '';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-block text-[10px]">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const columns: { field: SortField; label: string; align: 'left' | 'right' }[] = [
    { field: 'usuario', label: 'Separador', align: 'left' },
    { field: 'volumes', label: 'Volumes', align: 'right' },
    { field: 'tempoProdutivoSeg', label: 'T. Produtivo', align: 'right' },
    { field: 'tempoOciosoSeg', label: 'T. Ocioso', align: 'right' },
    { field: 'volHora', label: 'Vol/h', align: 'right' },
    { field: 'segVol', label: 'Seg/vol', align: 'right' },
    { field: 'volSeg', label: 'Vol/seg', align: 'right' },
    { field: 'desempenho', label: 'Desempenho', align: 'right' },
  ];

  const getMedal = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `${i + 1}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Separador</label>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none min-w-[160px]">
            <option value="">Todos</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Início</label>
          <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data Fim</label>
          <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col justify-end">
          <button onClick={() => { setFilterUser(''); setFilterDateStart(''); setFilterDateEnd(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors">Limpar</button>
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

      {/* Ranking Table */}
      {sorted.length > 0 ? (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/60">
                  <th className="px-3 py-3 text-center text-slate-300 font-semibold w-12">#</th>
                  <th className="px-3 py-3 text-left text-slate-300 font-semibold">Status</th>
                  {columns.map(col => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className={`px-3 py-3 text-right text-slate-300 font-semibold cursor-pointer hover:text-blue-400 transition-colors select-none whitespace-nowrap`}
                    >
                      {col.label}
                      <SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const isBest = r.usuario === bestUser;
                  const isWorst = r.usuario === worstUser;
                  const highlight = getRowHighlight(r.desempenho, isBest, isWorst);

                  return (
                    <tr
                      key={r.usuario}
                      className={`border-t border-slate-700/30 hover:bg-slate-700/30 transition-all duration-200 ${highlight}`}
                    >
                      <td className="px-3 py-3 text-center text-lg">{getMedal(i)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="flex items-center gap-1.5">
                          <span>{getPerformanceStatusEmoji(r.segVol)}</span>
                          <span className={`text-xs font-semibold ${getPerformanceColor(r.desempenho)}`}>
                            {getPerformanceStatusText(r.segVol)}
                          </span>
                          {isBest && r.desempenho >= 120 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold animate-pulse">TOP</span>
                          )}
                          {isWorst && r.desempenho < 60 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">⚠️</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-200 font-medium whitespace-nowrap">{r.usuario}</td>
                      <td className="px-3 py-3 text-right text-blue-400 font-semibold">{r.volumes.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-emerald-400">{formatSecondsToHHMM(r.tempoProdutivoSeg)}</td>
                      <td className="px-3 py-3 text-right text-red-400">{formatSecondsToHHMM(r.tempoOciosoSeg)}</td>
                      <td className="px-3 py-3 text-right text-purple-400">{formatNumber(r.volHora)}</td>
                      <td className="px-3 py-3 text-right font-bold" style={{ color: getCorDesempenho(r.segVol) }}>
                        {formatNumber(r.segVol)}
                      </td>
                      <td className="px-3 py-3 text-right text-cyan-400">{formatNumber(r.volSeg, 4)}</td>
                      <td className={`px-3 py-3 text-right font-bold ${getPerformanceColor(r.desempenho)}`}>
                        {formatNumber(r.desempenho)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-center text-slate-500 text-xs bg-slate-700/20">
            {sorted.length} separador{sorted.length !== 1 ? 'es' : ''} encontrado{sorted.length !== 1 ? 's' : ''}
            {bestUser && sorted.length > 1 && (
              <span className="ml-3 text-emerald-500">
                🏆 Melhor: {bestUser} ({formatNumber(ranking.find(r => r.usuario === bestUser)?.desempenho || 0)}%)
              </span>
            )}
            {worstUser && sorted.length > 1 && worstUser !== bestUser && (
              <span className="ml-3 text-red-500">
                ⚠️ Pior: {worstUser} ({formatNumber(ranking.find(r => r.usuario === worstUser)?.desempenho || 0)}%)
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-slate-400 text-lg">Nenhum dado para ranking</p>
          <p className="text-slate-500 text-sm mt-1">Importe dados primeiro</p>
        </div>
      )}
    </div>
  );
}
