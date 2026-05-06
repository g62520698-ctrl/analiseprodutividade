import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type { SeparationRecord, PageView, AppFilters } from './types';
import { calculateAllSummaries } from './utils/calculations';
import Dashboard from './components/Dashboard';
import ImportData from './components/ImportData';
import Ranking from './components/Ranking';
import AlertsInsights from './components/AlertsInsights';
import DataManager from './components/DataManager';
import Evolucao from './components/Evolucao';

const navItems: { id: PageView; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'importar', label: 'Importar', icon: '📥' },
  { id: 'ranking', label: 'Ranking', icon: '🏆' },
  { id: 'alertas', label: 'Alertas', icon: '🚨' },
  { id: 'insights', label: 'Insights IA', icon: '🤖' },
  { id: 'evolucao', label: 'Evolução', icon: '📈' },
  { id: 'exportar', label: 'Exportar', icon: '💾' },
  { id: 'dados', label: 'Dados', icon: '🧹' },
];

const CHUNK_SIZE = 400;

export default function App() {
  const [records, setRecords] = useState<SeparationRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [filters, setFilters] = useState<AppFilters>({
    periodo: '',
    dataInicio: '',
    dataFim: '',
    usuario: '',
  });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const usuarios = useMemo(() => [...new Set(records.map(r => r.usuario))].sort(), [records]);
  const summaries = useMemo(() => calculateAllSummaries(records), [records]);

  // ✅ Carregar dados — sempre da coleção padronizada
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.REGISTROS));
      console.log('📥 Registros carregados do Firebase:', snapshot.size);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<SeparationRecord, 'id'>),
      }));
      data.sort((a, b) => a.datetime.localeCompare(b.datetime));
      setRecords(data);
    } catch (error) {
      console.error('❌ Erro ao carregar:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do Firebase. Verifique as regras e a conexão.' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ IMPORTAÇÃO EM LOTE (BATCH) — rápida, sem travamento
  const handleImport = useCallback(async (newRecords: SeparationRecord[]) => {
    setLoading(true);
    try {
      // Processar dados ANTES de salvar
      const dadosProcessados = newRecords.map(r => ({
        usuario: r.usuario,
        data: r.data,
        hora: r.hora,
        volumes: Number(r.volumes) || 0,
        datetime: r.datetime,
      }));

      console.log('🚀 Total a importar:', dadosProcessados.length);

      // Batch em chunks de 400 (limite Firestore = 500)
      for (let i = 0; i < dadosProcessados.length; i += CHUNK_SIZE) {
        const chunk = dadosProcessados.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const ref = doc(collection(db, COLLECTIONS.REGISTROS));
          batch.set(ref, item);
        });

        await batch.commit();
        console.log(`✅ Batch ${Math.floor(i / CHUNK_SIZE) + 1} commitado — ${chunk.length} registros`);
      }

      // Cadastrar separadores automaticamente (batch)
      const uniqueUsers = [...new Set(dadosProcessados.map(r => r.usuario))];
      const sepBatch = writeBatch(db);
      let sepCount = 0;

      for (const nome of uniqueUsers) {
        const q = query(collection(db, COLLECTIONS.SEPARADORES), where('nome', '==', nome));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          const ref = doc(collection(db, COLLECTIONS.SEPARADORES));
          sepBatch.set(ref, { nome, ativo: true });
          sepCount++;
        }
      }
      if (sepCount > 0) {
        await sepBatch.commit();
        console.log(`👤 ${sepCount} separadores cadastrados`);
      }

      // Log de operação
      try {
        const logBatch = writeBatch(db);
        const logRef = doc(collection(db, COLLECTIONS.LOGS));
        logBatch.set(logRef, {
          acao: 'importacao',
          registros: dadosProcessados.length,
          separadores: uniqueUsers,
          timestamp: new Date().toISOString(),
        });
        await logBatch.commit();
      } catch {
        // Log é opcional, não bloqueia importação
      }

      setMessage({ type: 'success', text: `${dadosProcessados.length} registros importados com sucesso!` });

      // Garantir sincronização — recarrega dados do Firebase
      await loadRecords();
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      setMessage({ type: 'error', text: 'Falha ao importar planilha. Verifique o console para detalhes.' });
    }
    setLoading(false);
  }, [loadRecords]);

  // ✅ LIMPEZA EM BATCH — sem loop de deleteDoc
  const handleClearAll = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.REGISTROS));
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      console.log('🧹 Todos os dados removidos');
      setMessage({ type: 'success', text: 'Todos os dados foram removidos' });
      await loadRecords();
    } catch (error) {
      console.error('❌ Erro ao limpar:', error);
      setMessage({ type: 'error', text: 'Erro ao limpar dados' });
    }
    setLoading(false);
  }, [loadRecords]);

  const handleClearByDate = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTIONS.REGISTROS), where('data', '==', date));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      setMessage({ type: 'success', text: `Dados de ${date} removidos` });
      await loadRecords();
    } catch (error) {
      console.error('❌ Erro ao limpar:', error);
      setMessage({ type: 'error', text: 'Erro ao limpar dados' });
    }
    setLoading(false);
  }, [loadRecords]);

  const handleClearByUser = useCallback(async (user: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTIONS.REGISTROS), where('usuario', '==', user));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      setMessage({ type: 'success', text: `Dados de "${user}" removidos` });
      await loadRecords();
    } catch (error) {
      console.error('❌ Erro ao limpar:', error);
      setMessage({ type: 'error', text: 'Erro ao limpar dados' });
    }
    setLoading(false);
  }, [loadRecords]);

  const currentNav = navItems.find(n => n.id === currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard summaries={summaries} filters={filters} setFilters={setFilters} usuarios={usuarios} />;
      case 'importar':
        return <ImportData onImport={handleImport} loading={loading} />;
      case 'ranking':
        return <Ranking summaries={summaries} usuarios={usuarios} />;
      case 'alertas':
      case 'insights':
        return <AlertsInsights summaries={summaries} />;
      case 'evolucao':
        return <Evolucao summaries={summaries} usuarios={usuarios} />;
      case 'exportar':
        return (
          <DataManager
            summaries={summaries} records={records} usuarios={usuarios}
            onClearAll={handleClearAll} onClearByDate={handleClearByDate}
            onClearByUser={handleClearByUser} loading={loading} mode="export"
          />
        );
      case 'dados':
        return (
          <DataManager
            summaries={summaries} records={records} usuarios={usuarios}
            onClearAll={handleClearAll} onClearByDate={handleClearByDate}
            onClearByUser={handleClearByUser} loading={loading} mode="cleanup"
          />
        );
      default:
        return <Dashboard summaries={summaries} filters={filters} setFilters={setFilters} usuarios={usuarios} />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Produtividade Separação</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Análise Logística</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-600/15 text-blue-400 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-base w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {currentPage === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-center">
            <p className="text-[10px] text-slate-600">
              {records.length > 0 ? `${records.length} registros carregados` : 'Nenhum dado carregado'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-slate-200 p-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>{currentNav?.icon}</span>
                <span>{currentNav?.label}</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs hidden sm:inline">Importando dados... aguarde</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <div className={`w-2 h-2 rounded-full ${records.length > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="text-xs text-slate-400">{records.length} registros</span>
            </div>
          </div>
        </header>

        {/* Toast Message */}
        {message && (
          <div
            className={`px-4 md:px-6 py-2.5 text-sm flex items-center gap-2 shrink-0 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'
                : message.type === 'error'
                ? 'bg-red-500/10 text-red-400 border-b border-red-500/20'
                : 'bg-blue-500/10 text-blue-400 border-b border-blue-500/20'
            }`}
          >
            <span>{message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">✕</button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="px-4 md:px-6 py-2 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <p className="text-[10px] text-slate-600 text-center">
            © {new Date().getFullYear()} Desenvolvido por <span className="text-slate-500">Guilherme Lopes</span> • Produtividade Separação v2.0
          </p>
        </footer>
      </div>
    </div>
  );
}
