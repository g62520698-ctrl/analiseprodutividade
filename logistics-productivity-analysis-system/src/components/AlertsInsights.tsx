import { useMemo, useState } from 'react';
import type { DaySummary, IntervalDetail } from '../types';
import { generateInsights } from '../utils/calculations';
import { getInsightBorder, getInsightIcon, getCorDesempenho, getPerformanceStatusText } from '../utils/helpers';

interface Props {
  summaries: DaySummary[];
}

interface TaskEntry {
  id: string;
  usuario: string;
  data: string;
  inicio: string;
  fim: string;
  intervaloMin: number;
  volumes: number;
  segVol: number;
  tipo: 'tarefa' | 'aviso' | 'ocioso';
}

function classifyInterval(interval: IntervalDetail, volumes: number): TaskEntry['tipo'] {
  if (interval.tipo === 'ocioso' || interval.intervaloMin > 20) return 'ocioso';
  if (interval.intervaloMin > 2 && volumes > 0) return 'aviso';
  return 'tarefa';
}

export default function AlertsInsights({ summaries }: Props) {
  const [tab, setTab] = useState<'alertas' | 'insights'>('alertas');
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const allUsuarios = useMemo(
    () => [...new Set(summaries.map(s => s.usuario))].sort(),
    [summaries]
  );

  const insights = useMemo(() => generateInsights(summaries), [summaries]);

  // Build ALL task entries from all intervals
  const allTasks = useMemo(() => {
    const tasks: TaskEntry[] = [];
    for (const summary of summaries) {
      for (let i = 0; i < summary.intervalos.length; i++) {
        const iv = summary.intervalos[i];
        const tipo = classifyInterval(iv, iv.volumes);
        tasks.push({
          id: `${summary.usuario}-${summary.data}-${iv.inicio}-${i}`,
          usuario: summary.usuario,
          data: summary.data,
          inicio: iv.inicio,
          fim: iv.fim,
          intervaloMin: iv.intervaloMin,
          volumes: iv.volumes,
          segVol: iv.segVol,
          tipo,
        });
      }
    }
    return tasks.sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data);
      if (a.usuario !== b.usuario) return a.usuario.localeCompare(b.usuario);
      return a.inicio.localeCompare(b.inicio);
    });
  }, [summaries]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (filterDate && t.data !== filterDate) return false;
      if (filterUser && t.usuario !== filterUser) return false;
      return true;
    });
  }, [allTasks, filterDate, filterUser]);

  // Counts
  const countOcioso = filteredTasks.filter(t => t.tipo === 'ocioso').length;
  const countAviso = filteredTasks.filter(t => t.tipo === 'aviso').length;
  const countTarefa = filteredTasks.filter(t => t.tipo === 'tarefa').length;

  // Group tasks by date then user
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Record<string, TaskEntry[]>> = {};
    for (const t of filteredTasks) {
      if (!groups[t.data]) groups[t.data] = {};
      if (!groups[t.data][t.usuario]) groups[t.data][t.usuario] = [];
      groups[t.data][t.usuario].push(t);
    }
    // Sort dates desc
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(date => ({
      date,
      users: Object.keys(groups[date]).sort().map(user => ({
        user,
        tasks: groups[date][user],
      })),
    }));
  }, [filteredTasks]);

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('alertas')}
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            tab === 'alertas'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          🚨 Alertas Detalhados {filteredTasks.length > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{filteredTasks.length}</span>}
        </button>
        <button
          onClick={() => setTab('insights')}
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            tab === 'insights'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          🤖 Insights IA {insights.length > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{insights.length}</span>}
        </button>
      </div>

      {/* ===== ALERTAS TAB ===== */}
      {tab === 'alertas' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Data</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Separador</label>
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:border-blue-500 focus:outline-none min-w-[160px]"
              >
                <option value="">Todos</option>
                {allUsuarios.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={() => { setFilterDate(''); setFilterUser(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors">Limpar</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{countTarefa}</div>
              <div className="text-xs text-slate-400 mt-1">Tarefas</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{countAviso}</div>
              <div className="text-xs text-slate-400 mt-1">Avisos</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{countOcioso}</div>
              <div className="text-xs text-slate-400 mt-1">Ociosidade</div>
            </div>
          </div>

          {/* Grouped Task List */}
          {groupedTasks.length > 0 ? (
            <div className="space-y-4">
              {groupedTasks.map(group => (
                <div key={group.date} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                  {/* Date Header */}
                  <div className="px-5 py-3 bg-slate-700/40 border-b border-slate-700/50">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>📅</span>
                      <span>{group.date.split('-').reverse().join('/')}</span>
                    </h3>
                  </div>

                  {group.users.map(({ user, tasks }) => (
                    <div key={user} className="border-b border-slate-700/30 last:border-b-0">
                      {/* User Header */}
                      <div className="px-5 py-2.5 bg-slate-700/20 flex items-center gap-2">
                        <span>👤</span>
                        <span className="text-sm font-semibold text-slate-300">{user}</span>
                        <span className="text-xs text-slate-500 ml-2">{tasks.length} registros</span>
                      </div>

                      {/* Task Rows */}
                      <div className="divide-y divide-slate-700/20">
                        {tasks.map(task => (
                          <TaskRow key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-400 text-lg">Nenhum registro encontrado</p>
              <p className="text-slate-500 text-sm mt-1">Importe dados para visualizar alertas detalhados</p>
            </div>
          )}
        </div>
      )}

      {/* ===== INSIGHTS TAB ===== */}
      {tab === 'insights' && (
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div key={i} className={`border-l-4 rounded-lg p-4 ${getInsightBorder(insight.tipo)} transition-all hover:scale-[1.01]`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getInsightIcon(insight.tipo)}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">{insight.titulo}</h4>
                    <p className="text-sm text-slate-400">{insight.mensagem}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-slate-400 text-lg">Analisando dados...</p>
              <p className="text-slate-500 text-sm mt-1">
                {summaries.length === 0 ? 'Importe dados para gerar insights' : 'Dados insuficientes para gerar insights significativos'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Task Row Component ===
function TaskRow({ task }: { task: TaskEntry }) {
  // Dynamic color based on seg/vol performance
  const perfColor = task.segVol > 0 ? getCorDesempenho(task.segVol) : '#64748b';
  const perfLabel = task.segVol > 0 ? getPerformanceStatusText(task.segVol) : '';

  if (task.tipo === 'ocioso') {
    return (
      <div className="px-5 py-3 flex items-center gap-3 bg-red-500/5 hover:bg-red-500/10 transition-colors">
        <span className="text-base w-6 text-center">🔴</span>
        <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-red-400">Ocioso</span>
          <span className="text-slate-400">
            {task.inicio} → {task.fim}
          </span>
          <span className="text-red-300 font-medium">{Math.round(task.intervaloMin)} min</span>
          {task.volumes > 0 && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-blue-300">{task.volumes} vol</span>
              <span style={{ color: perfColor }} className="font-medium">{task.segVol.toFixed(0)} seg/vol</span>
            </>
          )}
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 uppercase tracking-wider">Ocioso</span>
      </div>
    );
  }

  if (task.tipo === 'aviso') {
    return (
      <div className="px-5 py-3 flex items-center gap-3 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
        <span className="text-base w-6 text-center">⚠️</span>
        <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-yellow-400">Intervalo</span>
          <span className="text-slate-400">
            {task.inicio} → {task.fim}
          </span>
          <span className="text-yellow-300 font-medium">{Math.round(task.intervaloMin)} min</span>
          {task.volumes > 0 && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-blue-300">{task.volumes} vol</span>
              <span style={{ color: perfColor }} className="font-medium">{task.segVol.toFixed(0)} seg/vol</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: perfColor + '20', color: perfColor }}>
                {perfLabel}
              </span>
            </>
          )}
          <span className="text-yellow-400 font-medium">AVISO</span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-wider">Aviso</span>
      </div>
    );
  }

  // Tarefa normal
  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-slate-700/20 transition-colors"
      style={{ backgroundColor: perfColor + '08' }}>
      <span className="text-base w-6 text-center">✅</span>
      <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold" style={{ color: perfColor }}>Tarefa</span>
        <span className="text-slate-400">
          {task.inicio} → {task.fim}
        </span>
        <span style={{ color: perfColor }} className="font-medium">{Math.round(task.intervaloMin)} min</span>
        {task.volumes > 0 && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-blue-300">{task.volumes} vol</span>
            <span style={{ color: perfColor }} className="font-medium">{task.segVol.toFixed(0)} seg/vol</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: perfColor + '20', color: perfColor }}>
              {perfLabel}
            </span>
          </>
        )}
      </div>
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
        style={{ backgroundColor: perfColor + '20', color: perfColor }}>
        Tarefa
      </span>
    </div>
  );
}
