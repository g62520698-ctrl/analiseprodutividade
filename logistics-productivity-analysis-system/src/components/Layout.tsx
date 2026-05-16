import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, RefreshCw, Settings, Menu, X, Activity, Database,
  Volume2, VolumeX, Sun, Moon, Flame, AlertTriangle, Clock, Eye,
} from 'lucide-react';
import { useStore } from '../store';
import { NotificationCenter } from './NotificationCenter';
import type { PageType } from '../types';

const navItems: { page: PageType; label: string; icon: ReactNode }[] = [
  { page: 'painel', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
  { page: 'separacao', label: 'Separação', icon: <Package size={20} /> },
  { page: 'ressuprimento', label: 'Ressuprimento', icon: <RefreshCw size={20} /> },
  { page: 'configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
];

export function Filters() {
  const { operators, filters, setFilters, currentPage } = useStore();
  const moduleOps = currentPage === 'separacao'
    ? operators.filter((o) => o.module === 'separacao')
    : currentPage === 'ressuprimento'
    ? operators.filter((o) => o.module === 'ressuprimento')
    : operators;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select value={filters.operatorId} onChange={(e) => setFilters({ operatorId: e.target.value })}
        className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan transition-colors">
        <option value="">Todos Operadores</option>
        {moduleOps.map((op) => (<option key={op.id} value={op.id}>{op.name}</option>))}
      </select>
      <input type="date" value={filters.dataInicio} onChange={(e) => setFilters({ dataInicio: e.target.value })}
        className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan transition-colors" />
      <input type="date" value={filters.dataFim} onChange={(e) => setFilters({ dataFim: e.target.value })}
        className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan transition-colors" />
      <button onClick={() => setFilters({ operatorId: '', dataInicio: '', dataFim: '' })}
        className="text-xs px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--border-color)] transition-colors">Limpar</button>
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeToast, settings } = useStore();

  if (!settings.notificationsEnabled) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.slice(-5).map((toast) => (
          <motion.div key={toast.id}
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] border-l-4 rounded-lg px-4 py-3 shadow-xl flex items-center gap-3"
            style={{ borderLeftColor: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : toast.type === 'success' ? '#10b981' : '#00d4ff' }}
          >
            <Activity size={18} style={{ color: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : toast.type === 'success' ? '#10b981' : '#00d4ff' }} />
            <span className="text-sm text-[var(--text-primary)] flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Real-time idle status bar — shows operators currently in attention/idle state
function IdleStatusBar() {
  const statuses = useStore((s) => s.realtimeIdleStatuses);
  const activeAlerts = statuses.filter((s) => s.state === 'IDLE' || s.state === 'ATTENTION');

  if (activeAlerts.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-[var(--border-color)] bg-dark-700/50 flex items-center gap-3 overflow-x-auto">
      <Eye size={14} className="text-neon-cyan shrink-0" />
      {activeAlerts.map((s) => {
        const isIdle = s.state === 'IDLE';
        const min = Math.round(s.elapsedSeconds / 60);
        return (
          <div
            key={s.operatorId}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              isIdle ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isIdle ? <AlertTriangle size={12} /> : <Clock size={12} />}
            <span>{s.operatorName}</span>
            <span className="opacity-70">{min}min</span>
          </div>
        );
      })}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar, separacaoTasks, ressuprimentoTasks, settings, updateSettings, operators, firebaseConnected } = useStore();
  const totalRecords = separacaoTasks.length + ressuprimentoTasks.length;
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    document.documentElement.className = isDark ? 'theme-dark' : 'theme-light';
  }, [isDark]);

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        className={`h-screen flex flex-col shrink-0 z-50 transition-colors ${
          sidebarOpen ? 'fixed lg:relative' : 'fixed lg:relative hidden lg:flex'
        }`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
      >
        <div className="h-16 flex items-center px-4 gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shrink-0 shadow-lg shadow-neon-cyan/20">
            <Activity size={20} className="text-white" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent whitespace-nowrap tracking-tight">LOGITRACK</h1>
              <p className="text-[10px] text-[var(--text-muted)] -mt-0.5 whitespace-nowrap">Performance Logística</p>
            </motion.div>
          )}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = currentPage === item.page;
            return (
              <button key={item.page}
                onClick={() => { setCurrentPage(item.page); if (window.innerWidth < 1024) toggleSidebar(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-gradient-to-r from-neon-cyan/15 to-neon-purple/10 text-neon-cyan border border-neon-cyan/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}>
                {item.icon}
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        {sidebarOpen && (
          <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>{operators.length} operadores</span>
              {firebaseConnected && <span className="text-neon-green ml-auto flex items-center gap-1"><Flame size={10} />Firebase</span>}
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 flex items-center px-4 gap-3 shrink-0" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={toggleSidebar} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Database size={13} /><span>{totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <div className={`w-1.5 h-1.5 rounded-full ${firebaseConnected ? 'bg-neon-green animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden md:inline">{firebaseConnected ? 'Firebase' : 'Local'}</span>
            </div>
            <button onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-neon-cyan transition-colors hover:bg-[var(--bg-tertiary)]">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-neon-cyan transition-colors hover:bg-[var(--bg-tertiary)]">
              {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {/* Real-time idle status bar */}
          <IdleStatusBar />

          <div className="p-3 md:p-5 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={currentPage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="h-8 flex items-center justify-center text-[10px] text-[var(--text-muted)] shrink-0"
          style={{ borderTop: '1px solid var(--border-color)' }}>
          LogiTrack © 2026 — Desenvolvido por Guilherme Lopes
          {firebaseConnected && <span className="ml-2 text-neon-green">• Firebase Connected</span>}
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
}
