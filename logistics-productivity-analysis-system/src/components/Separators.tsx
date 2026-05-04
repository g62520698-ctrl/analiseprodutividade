import { useState, useMemo } from 'react';
import { Users, Plus, Trash2, Edit3, X, Check, Search } from 'lucide-react';
import { useStore } from '../stores/useStore';
import type { Separator } from '../types';

export function Separators() {
  const records = useStore((s) => s.records);
  const addSeparator = useStore((s) => s.addSeparator);
  const updateSeparator = useStore((s) => s.updateSeparator);
  const deleteSeparator = useStore((s) => s.deleteSeparator);
  const showNotification = useStore((s) => s.showNotification);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newRuas, setNewRuas] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editRuas, setEditRuas] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const seps = useStore((s) => s.separators);

  const recordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of records) {
      counts.set(r.usuario, (counts.get(r.usuario) || 0) + 1);
    }
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    if (!searchTerm) return seps;
    const term = searchTerm.toLowerCase();
    return seps.filter(
      (s) =>
        s.nome.toLowerCase().includes(term) || s.ruas.toLowerCase().includes(term)
    );
  }, [seps, searchTerm]);

  const handleAdd = () => {
    if (!newNome.trim()) {
      showNotification('Nome é obrigatório', 'error');
      return;
    }

    addSeparator({
      id: `sep_${newNome.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      nome: newNome.trim().toUpperCase(),
      ruas: newRuas.trim(),
      ativo: true,
    });

    setNewNome('');
    setNewRuas('');
    setShowAddForm(false);
    showNotification('Separador adicionado com sucesso!', 'success');
  };

  const handleEdit = (sep: Separator) => {
    setEditingId(sep.id);
    setEditNome(sep.nome);
    setEditRuas(sep.ruas);
  };

  const handleSaveEdit = (id: string) => {
    if (!editNome.trim()) {
      showNotification('Nome é obrigatório', 'error');
      return;
    }
    updateSeparator(id, { nome: editNome.trim().toUpperCase(), ruas: editRuas.trim() });
    setEditingId(null);
    showNotification('Separador atualizado!', 'success');
  };

  const handleDelete = (id: string) => {
    deleteSeparator(id);
    setDeleteConfirmId(null);
    showNotification('Separador removido', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Gestão de Separadores
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {seps.length} separador(es) cadastrado(s)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Separador
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#151b2b] rounded-xl border border-blue-500/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-200">Novo Separador</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nome *</label>
              <input
                type="text"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Nome do separador"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Ruas</label>
              <input
                type="text"
                value={newRuas}
                onChange={(e) => setNewRuas(e.target.value)}
                placeholder="Ex: A1-A5, B1-B3"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar separador..."
          className="w-full bg-[#151b2b] border border-slate-800/60 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                  Ruas
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                  Registros
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filtered.map((sep) => (
                <tr key={sep.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === sep.id ? (
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-white font-medium">{sep.nome}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === sep.id ? (
                      <input
                        type="text"
                        value={editRuas}
                        onChange={(e) => setEditRuas(e.target.value)}
                        className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-slate-400">{sep.ruas || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sep.ativo
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {sep.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {recordCounts.get(sep.nome)?.toLocaleString('pt-BR') || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === sep.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(sep.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(sep)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {deleteConfirmId === sep.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(sep.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-medium"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-slate-400 rounded text-[10px] font-medium hover:bg-slate-700/50"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(sep.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {searchTerm
                      ? 'Nenhum separador encontrado'
                      : 'Nenhum separador cadastrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
