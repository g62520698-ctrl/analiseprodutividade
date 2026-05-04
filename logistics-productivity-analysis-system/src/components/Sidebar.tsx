import {
  LayoutDashboard,
  Upload,
  Trophy,
  Bell,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import type { PageType } from '../types';

const navItems: { id: PageType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'importar', label: 'Importar / Exportar', icon: Upload },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'separadores', label: 'Separadores', icon: Users },
];

export function Sidebar() {
  const currentPage = useStore((s) => s.currentPage);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const appName = useStore((s) => s.appName);
  const alerts = useStore((s) => s.alerts);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  const unreadCount = alerts.filter((a) => !a.lido).length;

  return (
    <div
      className={`h-screen bg-[#0d1117] border-r border-slate-800/60 flex flex-col transition-all duration-300 shrink-0 ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}
    >
      <div className="flex items-center gap-3 p-4 border-b border-slate-800/60">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <Package className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-white font-bold text-sm tracking-tight truncate">
            {appName}
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {sidebarOpen && (
                <span className="text-[13px] font-medium truncate">
                  {item.label}
                </span>
              )}
              {item.id === 'alertas' && unreadCount > 0 && (
                <span className="absolute right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-800/60">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
