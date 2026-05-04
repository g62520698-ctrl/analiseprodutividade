import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, FileSpreadsheet, AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { parseExcelFile, exportToExcel } from '../utils/excel';
import { calcularResumos, gerarAlertas } from '../utils/calculations';
import dayjs from 'dayjs';
import type { ProcessedRecord } from '../types';

function generateDemoData(): ProcessedRecord[] {
  const usuarios = ['JOAO SILVA', 'MARIA SOUZA', 'PEDRO SANTOS', 'ANA LIMA', 'CARLOS OLIVEIRA', 'LUCAS FERREIRA', 'JULIA COSTA'];
  const records: ProcessedRecord[] = []; let counter = 0;
  for (const usuario of usuarios) {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = dayjs().subtract(dayOffset, 'day').format('YYYY-MM-DD');
      if (dayjs(date).day() === 0) continue;
      let minutes = 7 * 60 + Math.floor(Math.random() * 30);
      const numTasks = 5 + Math.floor(Math.random() * 12);
      for (let i = 0; i < numTasks; i++) {
        const h = Math.floor(minutes / 60), m = minutes % 60; if (h >= 17) break;
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const volumes = 3 + Math.floor(Math.random() * 25);
        records.push({ id: `demo_${counter++}`, usuario, data: date, hora, volumes, timestamp: new Date(`${date}T${hora}:00`).getTime() });
        minutes += 5 + Math.floor(Math.random() * 30);
      }
    }
  }
  return records.sort((a, b) => a.timestamp - b.timestamp);
}

export function ImportExport() {
  const addRecords = useStore(s => s.addRecords);
  const addSeparator = useStore(s => s.addSeparator);
  const records = useStore(s => s.records);
  const separators = useStore(s => s.separators);
  const clearRecords = useStore(s => s.clearRecords);
  const setAlerts = useStore(s => s.setAlerts);
  const showNotification = useStore(s => s.showNotification);
  const setLoading = useStore(s => s.setLoading);
  const loading = useStore(s => s.loading);

  const [previewData, setPreviewData] = useState<ProcessedRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) { showNotification('Formato inválido', 'error'); return; }
    setLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) { showNotification('Nenhum registro válido', 'error'); return; }
      setPreviewData(parsed); setShowPreview(true); showNotification(`${parsed.length} registros encontrados`, 'success');
    } catch (err) { showNotification(`Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`, 'error'); }
    finally { setLoading(false); }
  }, [showNotification, setLoading]);

  const handleImport = useCallback(() => {
    if (previewData.length === 0) return;
    addRecords(previewData);
    for (const nome of new Set(previewData.map(r => r.usuario))) addSeparator({ id: `sep_${nome.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`, nome, ruas: '', ativo: true });
    const allRecs = [...records, ...previewData];
    setAlerts(gerarAlertas(allRecs, calcularResumos(allRecs)));
    showNotification(`${previewData.length} registros importados!`, 'success');
    setPreviewData([]); setShowPreview(false);
  }, [previewData, addRecords, addSeparator, records, setAlerts, showNotification]);

  const handleExport = useCallback(() => {
    const resumos = calcularResumos(records);
    const alertas = gerarAlertas(records, resumos);
    exportToExcel(resumos, alertas, 'LogiTrack Pro');
    showNotification('Relatório exportado!', 'success');
  }, [records, showNotification]);

  const handleClear = useCallback(() => { clearRecords(); setShowClearConfirm(false); showNotification('Dados removidos', 'info'); }, [clearRecords, showNotification]);

  const handleDemo = useCallback(() => {
    const demo = generateDemoData(); addRecords(demo);
    for (const nome of new Set(demo.map(r => r.usuario))) addSeparator({ id: `sep_${nome.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`, nome, ruas: '', ativo: true });
    const allRecs = [...records, ...demo];
    setAlerts(gerarAlertas(allRecs, calcularResumos(allRecs)));
    showNotification(`${demo.length} registros demo carregados!`, 'success');
  }, [addRecords, addSeparator, records, setAlerts, showNotification]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60"><h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-400" /> Importar Dados</h3></div>
        <div className="p-5">
          <div onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/20'}`}>
            <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-medium mb-1">{isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo Excel ou clique para selecionar'}</p>
            <p className="text-xs text-slate-500">Formatos: .xlsx, .xls, .csv</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          </div>
          {loading && <div className="mt-4 flex items-center gap-2 text-sm text-blue-400"><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</div>}
        </div>
      </div>

      {showPreview && previewData.length > 0 && (
        <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-400" /> Pré-visualização ({previewData.length})</h3>
            <div className="flex gap-2">
              <button onClick={() => { setPreviewData([]); setShowPreview(false); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50">Cancelar</button>
              <button onClick={handleImport} className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Importar {previewData.length}</button>
            </div>
          </div>
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/40 sticky top-0"><tr><th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase">Usuário</th><th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase">Data</th><th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase">Hora</th><th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase">Volumes</th></tr></thead>
              <tbody className="divide-y divide-slate-800/40">{previewData.slice(0, 50).map(r => (<tr key={r.id} className="hover:bg-slate-800/20"><td className="px-4 py-2 text-slate-300">{r.usuario}</td><td className="px-4 py-2 text-slate-400">{r.data}</td><td className="px-4 py-2 text-slate-400">{r.hora}</td><td className="px-4 py-2 text-right text-white font-medium">{r.volumes}</td></tr>))}</tbody>
            </table>
            {previewData.length > 50 && <div className="px-4 py-2 text-xs text-slate-500 text-center border-t border-slate-800/40">Mostrando 50 de {previewData.length}</div>}
          </div>
        </div>
      )}

      <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60"><h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Download className="w-4 h-4 text-emerald-400" /> Exportar Relatório</h3></div>
        <div className="p-5">
          <p className="text-sm text-slate-400 mb-4">Exporte dados com Resumo e Ranking em Excel.</p>
          <button onClick={handleExport} disabled={records.length === 0} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Exportar XLSX</button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60"><h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Database className="w-4 h-4 text-violet-400" /> Gerenciamento</h3></div>
        <div className="p-5">
          <div className="flex items-center gap-6 mb-4 text-sm">
            <div><span className="text-slate-400">Registros:</span> <span className="text-white font-medium">{records.length.toLocaleString('pt-BR')}</span></div>
            <div><span className="text-slate-400">Separadores:</span> <span className="text-white font-medium">{separators.length}</span></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDemo} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Dados Demo</button>
            <button onClick={() => setShowClearConfirm(true)} disabled={records.length === 0} className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-40"><Trash2 className="w-4 h-4" /> Limpar Dados</button>
          </div>
          {showClearConfirm && (
            <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div><p className="text-sm text-red-300 font-medium mb-1">Confirmar exclusão</p><p className="text-xs text-red-400/70 mb-3">Todos os dados serão removidos. Separadores mantidos.</p>
                  <div className="flex gap-2"><button onClick={handleClear} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium">Confirmar</button><button onClick={() => setShowClearConfirm(false)} className="px-3 py-1.5 text-slate-400 rounded-lg text-xs hover:bg-slate-700/50">Cancelar</button></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
