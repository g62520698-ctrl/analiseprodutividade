import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from './stores/useStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportExport } from './components/ImportExport';
import { Ranking } from './components/Ranking';
import { Alerts } from './components/Alerts';
import { Separators } from './components/Separators';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  importar: 'Importar / Exportar',
  ranking: 'Ranking',
  alertas: 'Alertas',
  separadores: 'Separadores',
};

function Notification() {
  const notification = useStore((s) => s.notification);
  const clearNotification = useStore((s) => s.clearNotification);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(clearNotification, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification) return null;

  const bgMap: Record<string, string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgMap[notification.type] || 'bg-blue-600'} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in`}
    >
      <span className="text-sm font-medium">{notification.message}</span>
      <button
        onClick={clearNotification}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function App() {
  const currentPage = useStore((s) => s.currentPage);
  const appName = useStore((s) => s.appName);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'importar':
        return <ImportExport />;
      case 'ranking':
        return <Ranking />;
      case 'alertas':
        return <Alerts />;
      case 'separadores':
        return <Separators />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e14] text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1600px]">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {pageTitles[currentPage] || 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {appName} — Sistema de Análise de Produtividade Logística
            </p>
          </div>
          {renderPage()}
        </div>
      </main>
      <Notification />
    </div>
  );
}
