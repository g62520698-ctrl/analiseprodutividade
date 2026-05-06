import { useState } from 'react';
import type { DaySummary, SeparationRecord } from '../types';
import { exportToExcel } from '../utils/excelUtils';
import { calculateRanking } from '../utils/calculations';

interface Props {
  summaries: DaySummary[];
  records: SeparationRecord[];
  usuarios: string[];
  onClearAll: () => Promise<void>;
  onClearByDate: (date: string) => Promise<void>;
  onClearByUser: (user: string) => Promise<void>;
  loading: boolean;
  mode: 'export' | 'cleanup';
}

export default function DataManager({
  summaries, records, usuarios,
  onClearAll, onClearByDate, onClearByUser,
  loading, mode,
}: Props) {
  const [confirmAction, setConfirmAction] = useState<{ type: 'all' | 'date' | 'user'; value: string } | null>(null);
  const [clearDate, setClearDate] = useState('');
  const [clearUser, setClearUser] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ranking = calculateRanking(summaries);

  const handleExport = () => {
    try {
      exportToExcel(summaries, ranking);
      setMessage({ type: 'success', text: 'Arquivo Excel exportado com sucesso!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao exportar: ' + (err instanceof Error ? err.message : 'Erro') });
    }
  };

  const handleConfirmClear = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'all') await onClearAll();
      else if (confirmAction.type === 'date') await onClearByDate(confirmAction.value);
      else if (confirmAction.type === 'user') await onClearByUser(confirmAction.value);
      setMessage({ type: 'success', text: 'Dados removidos com sucesso!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao limpar: ' + (err instanceof Error ? err.message : 'Erro') });
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {message && (
        <div className={`p-4 rounded-lg border text-sm flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {/* Export Section */}
      {mode === 'export' && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-100 mb-2">💾 Exportar Relatório Excel</h2>
          <p className="text-slate-400 text-sm mb-6">
            Gera um arquivo .xlsx com duas abas: Resumo e Ranking
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">📊 Aba Resumo</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Separador, Data, Volumes</li>
                <li>• Tempo Produtivo (hh:mm)</li>
                <li>• Tempo Ocioso (hh:mm)</li>
                <li>• Vol/h, Seg/vol, Desempenho</li>
              </ul>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">🏆 Aba Ranking</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Ranking completo consolidado</li>
                <li>• Todas as métricas por separador</li>
                <li>• Vol/h, Seg/vol, Vol/seg</li>
                <li>• Desempenho geral</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={summaries.length === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              📥 Exportar Excel ({summaries.length} registros)
            </button>
          </div>
        </div>
      )}

      {/* Cleanup Section */}
      {mode === 'cleanup' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-100 mb-2">🧹 Limpeza de Dados</h2>
            <p className="text-slate-400 text-sm mb-6">
              Área restrita — ações irreversíveis
            </p>

            <div className="space-y-4">
              {/* Clear by Date */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">📅 Limpar por Data</h4>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Data</label>
                    <input
                      type="date"
                      value={clearDate}
                      onChange={e => setClearDate(e.target.value)}
                      className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50"
                    />
                  </div>
                  <button
                    onClick={() => clearDate && setConfirmAction({ type: 'date', value: clearDate })}
                    disabled={!clearDate || loading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    🗑️ Limpar Data
                  </button>
                </div>
              </div>

              {/* Clear by User */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">👤 Limpar por Separador</h4>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Separador</label>
                    <select
                      value={clearUser}
                      onChange={e => setClearUser(e.target.value)}
                      className="bg-slate-700/80 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 min-w-[180px]"
                    >
                      <option value="">Selecione...</option>
                      {usuarios.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => clearUser && setConfirmAction({ type: 'user', value: clearUser })}
                    disabled={!clearUser || loading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    🗑️ Limpar Separador
                  </button>
                </div>
              </div>

              {/* Clear All */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-400 mb-2">⚠️ Limpar Todos os Dados</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Esta ação removerá TODOS os registros do sistema. Não pode ser desfeita.
                </p>
                <button
                  onClick={() => setConfirmAction({ type: 'all', value: '' })}
                  disabled={loading || records.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  💣 Limpar Tudo ({records.length} registros)
                </button>
              </div>
            </div>
          </div>

          {/* Data Stats */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 Estatísticas dos Dados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-400">{records.length}</div>
                <div className="text-xs text-slate-400">Total Registros</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">{usuarios.length}</div>
                <div className="text-xs text-slate-400">Separadores</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-purple-400">
                  {new Set(records.map(r => r.data)).size}
                </div>
                <div className="text-xs text-slate-400">Datas</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-400">
                  {records.reduce((s, r) => s + r.volumes, 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Volumes Total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Confirmar Ação</h3>
              <p className="text-slate-400 text-sm mb-6">
                {confirmAction.type === 'all' && 'Tem certeza que deseja remover TODOS os dados? Esta ação não pode ser desfeita.'}
                {confirmAction.type === 'date' && `Tem certeza que deseja remover todos os registros da data ${confirmAction.value}?`}
                {confirmAction.type === 'user' && `Tem certeza que deseja remover todos os registros de "${confirmAction.value}"?`}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClear}
                  disabled={loading}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
