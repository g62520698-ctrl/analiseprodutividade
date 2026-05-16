import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, Trash2, AlertCircle, FileDown, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '../store';
import { parseDate, parseTime, findColumn, processRawImportedTasks, type RawImportRow } from '../utils';
import type { Task } from '../types';
import { addTasksToFirebase, clearTasksInFirebase, saveImportHistory } from '../services/firebase';

const REQUIRED_COLUMNS = [
  { key: 'USUARIO', aliases: ['USUARIO', 'usuario', 'Usuario', 'OPERADOR', 'operador', 'NOME', 'nome', 'FUNCIONARIO'] },
  { key: 'DATAINI', aliases: ['DATAINI', 'dataini', 'DataIni', 'DATA', 'data', 'DATA_INI', 'DT_INI'] },
  { key: 'HORA_INI', aliases: ['HORA_INI', 'hora_ini', 'Hora_Ini', 'HORA_INICIO', 'HORAINI', 'INICIO', 'inicio'] },
  { key: 'PRODUTO', aliases: ['PRODUTO', 'produto', 'Produto', 'ITEM', 'item', 'SKU', 'DESCRICAO'] },
  { key: 'QTD_VOLUMES', aliases: ['QTD_VOLUMES_PDR_EXP', 'QTD_VOLUMES', 'qtd_volumes', 'VOLUME', 'volume', 'VOLUMES', 'volumes', 'QTD', 'qtd', 'QTDE'] },
];

export function ImportData({ module: defaultModule }: { module: 'separacao' | 'ressuprimento' }) {
  const { operators, separacaoConfig, ressuprimentoConfig, addTasks, addToast, clearTasks } = useStore();
  const [preview, setPreview] = useState<{ raw: RawImportRow[]; processed: Task[] }>({ raw: [], processed: [] });
  const [imported, setImported] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [stats, setStats] = useState<{ rows: number; operators: number; dates: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const config = defaultModule === 'separacao' ? separacaoConfig : ressuprimentoConfig;

  const processFile = useCallback((file: File) => {
    setProcessing(true);
    setErrors([]);
    setPreview({ raw: [], processed: [] });
    setImported(false);
    setStats(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (json.length === 0) {
          setErrors(['O arquivo está vazio ou não contém dados.']);
          setProcessing(false);
          return;
        }

        // Detect columns
        const sampleRow = json[0];
        const detected = REQUIRED_COLUMNS.map((col) => ({
          key: col.key,
          found: findColumn(sampleRow, col.aliases) !== undefined,
        }));
        const missing = detected.filter((d) => !d.found).map((d) => d.key);
        if (missing.length > 0) {
          setErrors([`Colunas não encontradas: ${missing.join(', ')}. Colunas obrigatórias: USUARIO, DATAINI, HORA_INI, PRODUTO, QTD_VOLUMES_PDR_EXP`]);
          setProcessing(false);
          return;
        }

        // Parse rows
        const parseErrors: string[] = [];
        const rawRows: RawImportRow[] = [];

        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const usuario = String(findColumn(row, REQUIRED_COLUMNS[0].aliases) || '').trim();
          if (!usuario) { if (parseErrors.length < 10) parseErrors.push(`Linha ${i + 2}: USUARIO vazio`); continue; }

          const dateVal = findColumn(row, REQUIRED_COLUMNS[1].aliases);
          const dateStr = parseDate(dateVal);
          if (!dateStr) { if (parseErrors.length < 10) parseErrors.push(`Linha ${i + 2}: Data inválida "${dateVal}"`); continue; }

          const horaVal = findColumn(row, REQUIRED_COLUMNS[2].aliases);
          const horaInicio = parseTime(horaVal);
          if (horaInicio === '00:00:00' && horaVal !== 0 && horaVal !== '0' && horaVal !== '00:00:00' && horaVal !== '') {
            // Likely failed parse
          }

          const produto = String(findColumn(row, REQUIRED_COLUMNS[3].aliases) || 'N/A');
          const volumeVal = findColumn(row, REQUIRED_COLUMNS[4].aliases);
          const volumes = Math.max(0, Math.round(Number(volumeVal) || 0));

          rawRows.push({ usuario, date: dateStr, horaInicio, produto, volumes });
        }

        if (rawRows.length === 0) {
          setErrors(['Nenhuma linha válida encontrada no arquivo.']);
          setProcessing(false);
          return;
        }

        if (parseErrors.length > 0) {
          setErrors(parseErrors.length <= 10 ? parseErrors : [`${parseErrors.length} linhas com erros.`, ...parseErrors.slice(0, 10)]);
        }

        // Process: group by user+date, sort, compute horaFim
        const processed = processRawImportedTasks(rawRows, defaultModule, operators, config.fimExpediente);

        // Stats
        const uniqueOps = new Set(rawRows.map((r) => r.usuario));
        const uniqueDates = new Set(rawRows.map((r) => r.date));

        setPreview({ raw: rawRows, processed });
        setStats({ rows: rawRows.length, operators: uniqueOps.size, dates: uniqueDates.size });
        setProcessing(false);
        addToast(`${rawRows.length} registros processados com sucesso!`, 'success');
      } catch {
        setErrors(['Erro ao processar arquivo. Verifique o formato (XLSX, XLS ou CSV).']);
        setProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [operators, defaultModule, config.fimExpediente, addToast]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      addToast('Formato não suportado. Use XLSX, XLS ou CSV.', 'warning');
      return;
    }
    processFile(file);
  }

  function handleImport() {
    if (preview.processed.length === 0) return;
    // Add to local store
    addTasks(defaultModule, preview.processed);
    // Push to Firebase Realtime Database
    addTasksToFirebase(defaultModule, preview.processed).catch(() => {
      // Firebase write failed — data is still in local store
    });
    // Save import history to Firebase
    if (stats) {
      saveImportHistory({
        date: new Date().toISOString().split('T')[0],
        module: defaultModule,
        records: stats.rows,
        operators: stats.operators,
        timestamp: Date.now(),
      }).catch(() => {});
    }
    addToast(`${preview.processed.length} tarefas importadas com sucesso!`, 'success');
    setImported(true);
  }

  function handleClear() {
    clearTasks(defaultModule);
    // Clear in Firebase
    clearTasksInFirebase(defaultModule).catch(() => {});
    addToast(`Dados de ${defaultModule === 'separacao' ? 'Separação' : 'Ressuprimento'} limpos.`, 'info');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Main import card */}
      <div className="glow-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-neon-green" />
          Importação de Dados — {defaultModule === 'separacao' ? 'Separação' : 'Ressuprimento'}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          O sistema calcula automaticamente o tempo entre tarefas consecutivas de cada operador.
        </p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragActive ? 'border-neon-cyan bg-neon-cyan/5' : 'border-[var(--border-color)] hover:border-neon-cyan/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          {processing ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[var(--text-muted)]">Processando arquivo...</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">Arraste um arquivo XLSX ou CSV aqui</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">ou clique para selecionar</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* Column info */}
        <div className="mt-4 bg-[var(--bg-tertiary)] rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-neon-cyan mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-[var(--text-secondary)]">Colunas obrigatórias:</p>
              <code className="text-neon-cyan block mt-1">USUARIO, DATAINI, HORA_INI, PRODUTO, QTD_VOLUMES_PDR_EXP</code>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info size={14} className="text-neon-amber mt-0.5 shrink-0" />
            <div className="text-[var(--text-muted)]">
              <p>📅 Data Excel: <code className="text-neon-cyan">46155</code> → 04/05/2026</p>
              <p>⏱️ Hora Excel: <code className="text-neon-cyan">0.285393</code> → 06:51:00</p>
              <p>🔄 Lógica: duração = HORA_INI da próxima tarefa − HORA_INI da tarefa atual</p>
            </div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-neon-cyan">{stats.rows.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-muted)]">Registros</div>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-neon-purple">{stats.operators}</div>
              <div className="text-xs text-[var(--text-muted)]">Operadores</div>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-neon-green">{stats.dates}</div>
              <div className="text-xs text-[var(--text-muted)]">Datas</div>
            </div>
          </div>
        )}

        {/* Preview table */}
        {preview.raw.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Prévia (primeiros 20 registros)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={imported}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={14} /> {imported ? 'Importado!' : 'Confirmar Importação'}
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={14} /> Limpar Dados
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-[var(--border-color)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">#</th>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">USUARIO</th>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">DATA</th>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">HORA_INI</th>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">PRODUTO</th>
                    <th className="px-2 py-2 text-left text-[var(--text-muted)]">VOLUMES</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.raw.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border-color)]">
                      <td className="px-2 py-1.5 text-[var(--text-muted)]">{i + 1}</td>
                      <td className="px-2 py-1.5 text-[var(--text-primary)] font-medium">{row.usuario}</td>
                      <td className="px-2 py-1.5 text-[var(--text-muted)]">{row.date.split('-').reverse().join('/')}</td>
                      <td className="px-2 py-1.5 text-[var(--text-secondary)] font-mono">{row.horaInicio}</td>
                      <td className="px-2 py-1.5 text-[var(--text-muted)]">{row.produto}</td>
                      <td className="px-2 py-1.5 text-[var(--text-secondary)] text-right">{row.volumes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.raw.length > 20 && (
                <div className="text-center py-2 text-xs text-[var(--text-muted)]">
                  ... e mais {(preview.raw.length - 20).toLocaleString()} registros
                </div>
              )}
            </div>
          </div>
        )}

        {imported && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle size={16} />
            <span>{preview.processed.length} tarefas importadas e processadas com sucesso!</span>
          </div>
        )}
      </div>

      {/* Template download */}
      <div className="glow-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <FileDown size={16} className="text-neon-purple" />
          Baixar Template
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">Baixe um modelo CSV para preencher com os dados da operação.</p>
        <button
          onClick={() => {
            const csv = [
              'USUARIO,DATAINI,HORA_INI,PRODUTO,QTD_VOLUMES_PDR_EXP',
              '118 CD_GILSON,46155,0.288194,SKU-001 CAIXA PADRAO,5',
              '118 CD_GILSON,46155,0.292361,SKU-002 KIT ESPECIAL,3',
              '118 CD_GILSON,46155,0.296528,SKU-003 PALET INDUSTRIAL,8',
              '119 CD_MARCELO,46155,0.290278,SKU-001 CAIXA PADRAO,12',
              '119 CD_MARCELO,46155,0.295139,SKU-004 CAIXA GRANDE,6',
              '119 CD_MARCELO,46155,0.301389,SKU-005 BLOCO STANDARD,4',
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template_logitrack.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg text-sm font-medium hover:bg-neon-purple/30 transition-colors"
        >
          Baixar Template CSV
        </button>
      </div>
    </motion.div>
  );
}
