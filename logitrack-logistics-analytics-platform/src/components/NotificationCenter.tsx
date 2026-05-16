import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, CheckCheck, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle, Radio, RadioOff } from 'lucide-react';
import { useStore } from '../store';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  critical: { icon: <AlertCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10' },
  attention: { icon: <AlertTriangle size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { icon: <Info size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { icon: <CheckCircle size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const {
    notifications, markNotificationRead, markAllNotificationsRead, clearNotifications,
    settings, updateSettings, addToast,
  } = useStore();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const filtered = useMemo(() => {
    if (filter === 'ALL') return notifications;
    if (filter === 'UNREAD') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const toggleRealtime = useCallback(() => {
    const next = !settings.realtimeEnabled;
    updateSettings({ realtimeEnabled: next });
    addToast(next ? '📡 Monitoramento em tempo real ativado' : '📡 Monitoramento em tempo real desativado', next ? 'success' : 'info');
  }, [settings.realtimeEnabled, updateSettings, addToast]);

  const toggleBrowser = useCallback(async () => {
    if (!settings.browserNotifications) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          updateSettings({ browserNotifications: true });
          addToast('🔔 Notificações do navegador ativadas!', 'success');
          new Notification('LogiTrack', { body: 'Notificações ativadas com sucesso!' });
        } else {
          addToast('Permissão de notificação negada pelo navegador.', 'warning');
        }
      } else {
        addToast('Este navegador não suporta notificações push.', 'warning');
      }
    } else {
      updateSettings({ browserNotifications: false });
      addToast('Notificações do navegador desativadas.', 'info');
    }
  }, [settings.browserNotifications, updateSettings, addToast]);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-neon-cyan"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        {settings.realtimeEnabled && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notificações</h3>
                  {unreadCount > 0 && <span className="text-xs text-neon-cyan font-medium">{unreadCount} novas</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={toggleRealtime} title={settings.realtimeEnabled ? 'Desativar tempo real' : 'Ativar tempo real'}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${settings.realtimeEnabled ? 'text-neon-green bg-neon-green/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'}`}>
                    {settings.realtimeEnabled ? <Radio size={14} /> : <RadioOff size={14} />}
                  </button>
                  <button onClick={toggleBrowser} title={settings.browserNotifications ? 'Desativar push' : 'Ativar push'}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${settings.browserNotifications ? 'text-neon-cyan bg-neon-cyan/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'}`}>
                    {settings.browserNotifications ? <Bell size={14} /> : <BellOff size={14} />}
                  </button>
                  <button onClick={markAllNotificationsRead} title="Marcar todas como lidas"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-neon-cyan">
                    <CheckCheck size={14} />
                  </button>
                  <button onClick={clearNotifications} title="Limpar todas"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="px-4 py-2 flex gap-1.5 border-b border-[var(--border-color)]">
                {['ALL', 'UNREAD', 'critical', 'attention'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      filter === f ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                    }`}>
                    {f === 'ALL' ? 'Todas' : f === 'UNREAD' ? 'Não lidas' : f === 'critical' ? '🔴 Crítico' : '🟡 Atenção'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto max-h-[380px]">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--text-muted)]">Nenhuma notificação</div>
                ) : (
                  filtered.map((notif) => {
                    const cfg = typeConfig[notif.type] || typeConfig.info;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`px-4 py-3 border-b border-[var(--border-color)] cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] ${!notif.read ? 'bg-[var(--bg-tertiary)]' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{notif.operatorName}</span>
                              <span className="text-[10px] text-[var(--text-muted)] shrink-0">{formatTimeAgo(notif.timestamp)}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                          {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan mt-2 shrink-0" />}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
