import React, { useState, useRef } from 'react';
import { parseExcelFile } from '../utils/excelUtils';
import type { SeparationRecord } from '../types';

interface Props {
  onImport: (records: SeparationRecord[]) => Promise<void>;
  loading: boolean;
}

export default function ImportData({ onImport, loading }: Props) {
  const [preview, setPreview] = useState<SeparationRecord[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError('');
    setSuccess('');
    setPreview([]);

    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Formato inválido. Use .xlsx ou .xls');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result as ArrayBuffer;
        const records = parseExcelFile(data);
        if (records.length === 0) {
          setError('Nenhum registro válido encontrado. Verifique as colunas: USUARIO, DATAINI, HORA_INI, QTD_VOLUMES_PDR_EXP');
          return;
        }
        setPreview(records);
      } catch (err) {
        setError('Erro ao processar arquivo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleImport = async () => {
    if (preview.length === 0) return;
    try {
      await onImport(preview);
      setSuccess(`${preview.length} registros importados com sucesso!`);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError('Erro ao importar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const uniqueUsers = [...new Set(preview.map(r => r.usuario))];
  const uniqueDates = [...new Set(preview.map(r => r.data))];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-slate-100 mb-1">📥 Importar Planilha</h2>
        <p className="text-slate-400 text-sm mb-6">
          Colunas esperadas: <code className="text-blue-400 bg-slate-700/50 px-1.5 py-0.5 rounded">USUARIO</code>,{' '}
          <code className="text-blue-400 bg-slate-700/50 px-1.5 py-0.5 rounded">DATAINI</code>,{' '}
          <code className="text-blue-400 bg-slate-700/50 px-1.5 py-0.5 rounded">HORA_INI</code>,{' '}
          <code className="text-blue-400 bg-slate-700/50 px-1.5 py-0.5 rounded">QTD_VOLUMES_PDR_EXP</code>
        </p>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
          }`}
        >
          <div className="text-5xl mb-3">{dragOver ? '📥' : '📂'}</div>
          <p className="text-slate-300 text-lg font-medium mb-1">
            {dragOver ? 'Solte o arquivo aqui' : 'Arraste e solte o arquivo Excel'}
          </p>
          <p className="text-slate-500 text-sm">ou clique para selecionar (.xlsx, .xls)</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <span>❌</span> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-start gap-2">
            <span>✅</span> {success}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Pré-visualização</h3>
              <p className="text-slate-400 text-sm">
                {preview.length} registros • {uniqueUsers.length} separadores • {uniqueDates.length} datas
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Importando...
                </>
              ) : (
                <>🚀 Importar para o Sistema</>
              )}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{preview.length}</div>
              <div className="text-xs text-slate-400">Registros</div>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{uniqueUsers.length}</div>
              <div className="text-xs text-slate-400">Separadores</div>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{preview.reduce((s, r) => s + r.volumes, 0)}</div>
              <div className="text-xs text-slate-400">Volumes Total</div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/60">
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Usuário</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Data</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Hora</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-semibold">Volumes</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2 text-slate-200 font-medium">{r.usuario}</td>
                    <td className="px-4 py-2 text-slate-300">{r.data}</td>
                    <td className="px-4 py-2 text-slate-300">{r.hora}</td>
                    <td className="px-4 py-2 text-right text-blue-400 font-semibold">{r.volumes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="p-3 text-center text-slate-500 text-sm bg-slate-700/30">
                Mostrando 50 de {preview.length} registros
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
