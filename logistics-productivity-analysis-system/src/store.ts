import { create } from 'zustand';
import type { Operator, Task, SeparacaoConfig, RessuprimentoConfig, Filters, ToastItem, PageType, AppSettings, NotificationItem, IdleStatus } from './types';
import { reprocessAndMergeTasks } from './utils';

let toastCounter = 0;
let notifCounter = 0;

function gid(): string { return Math.random().toString(36).substring(2, 11); }

function secondsToTime(totalSeconds: number): string {
  const h = Math.floor(Math.abs(totalSeconds) / 3600);
  const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
  const s = Math.floor(Math.abs(totalSeconds) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const defaultOperators: Operator[] = [];

function generateMockTasks(): { sep: Task[]; res: Task[] } {
  const sep: Task[] = [];
  const res: Task[] = [];
  const produtos = [
    'SKU-001 Caixa Padrão', 'SKU-002 Kit Especial', 'SKU-003 Palet Industrial',
    'SKU-004 Caixa Grande', 'SKU-005 Bloco Standard', 'SKU-006 Kit Montagem',
    'SKU-007 Embalagem Premium', 'SKU-008 Caixa Leve',
  ];
  const today = new Date();
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    for (const op of defaultOperators) {
      const taskCount = Math.floor(Math.random() * 35) + 20;
      const endShift = 17 * 3600;
      const startShift = 7 * 3600;
      let currentTime = startShift + Math.floor(Math.random() * 1800);
      const rawTasks: { horaInicio: string; startSec: number; volumes: number; produto: string; workSec: number }[] = [];
      for (let t = 0; t < taskCount; t++) {
        if (currentTime >= endShift) break;
        if (currentTime >= 12 * 3600 && currentTime < 13 * 3600) currentTime = 13 * 3600;
        const volumes = op.module === 'separacao' ? Math.floor(Math.random() * 15) + 1 : Math.floor(Math.random() * 8) + 1;
        const workSec = Math.round(volumes * (20 + Math.random() * 20));
        rawTasks.push({
          horaInicio: secondsToTime(currentTime),
          startSec: currentTime,
          volumes,
          produto: produtos[Math.floor(Math.random() * produtos.length)],
          workSec,
        });
        const bigGap = Math.random() > 0.88;
        const gap = bigGap ? Math.floor(Math.random() * 900) + 180 : Math.floor(Math.random() * 50) + 5;
        currentTime += workSec + gap;
      }
      for (let i = 0; i < rawTasks.length; i++) {
        // Last task: duration = work time only (not end-of-shift projection)
        // This avoids false idle alerts for the last task of the day
        const horaFim = i < rawTasks.length - 1
          ? rawTasks[i + 1].horaInicio
          : secondsToTime(Math.min(rawTasks[i].startSec + rawTasks[i].workSec, endShift));
        const task: Task = {
          id: gid(), operatorId: op.id, operatorName: op.name, date: dateStr,
          horaInicio: rawTasks[i].horaInicio, horaFim, produto: rawTasks[i].produto,
          volumes: rawTasks[i].volumes, tarefas: 1, module: op.module,
        };
        if (op.module === 'separacao') sep.push(task); else res.push(task);
      }
    }
  }
  return { sep, res };
}

const mockData = generateMockTasks();

// Firebase connection state tracking

interface AppStore {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  firebaseConnected: boolean;
  setFirebaseConnected: (v: boolean) => void;

  operators: Operator[];
  setOperators: (ops: Operator[]) => void;
  addOperator: (op: Operator) => void;
  removeOperator: (id: string) => void;
  updateOperator: (id: string, data: Partial<Operator>) => void;

  separacaoTasks: Task[];
  ressuprimentoTasks: Task[];
  setSeparacaoTasks: (tasks: Task[]) => void;
  setRessuprimentoTasks: (tasks: Task[]) => void;
  addTasks: (module: 'separacao' | 'ressuprimento', tasks: Task[]) => void;
  clearTasks: (scope: 'separacao' | 'ressuprimento' | 'all') => void;

  separacaoConfig: SeparacaoConfig;
  ressuprimentoConfig: RessuprimentoConfig;
  setSeparacaoConfig: (config: SeparacaoConfig) => void;
  setRessuprimentoConfig: (config: RessuprimentoConfig) => void;
  updateSeparacaoConfig: (data: Partial<SeparacaoConfig>) => void;
  updateRessuprimentoConfig: (data: Partial<RessuprimentoConfig>) => void;

  filters: Filters;
  setFilters: (data: Partial<Filters>) => void;

  settings: AppSettings;
  setSettingsDirect: (settings: Partial<AppSettings>) => void;
  updateSettings: (data: Partial<AppSettings>) => void;

  toasts: ToastItem[];
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  realtimeIdleStatuses: IdleStatus[];
  setRealtimeIdleStatuses: (statuses: IdleStatus[]) => void;

shownAlerts: Set<string>;
markAlertShown: (id: string) => void;
removeShownAlert: (id: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  currentPage: 'painel',
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  firebaseConnected: false,
  setFirebaseConnected: (v) => set({ firebaseConnected: v }),

  operators: defaultOperators,
  setOperators: (ops) => set({ operators: ops }),
  addOperator: (op) => set((s) => ({ operators: [...s.operators, op] })),
  removeOperator: (id) => set((s) => ({ operators: s.operators.filter((o) => o.id !== id) })),
  updateOperator: (id, data) => set((s) => ({
    operators: s.operators.map((o) => (o.id === id ? { ...o, ...data } : o)),
  })),

  separacaoTasks: mockData.sep,
  ressuprimentoTasks: mockData.res,
  setSeparacaoTasks: (tasks) => set({ separacaoTasks: tasks }),
  setRessuprimentoTasks: (tasks) => set({ ressuprimentoTasks: tasks }),
  addTasks: (module, tasks) => set((s) => {
    // Use incremental reprocessing: fix any pending last tasks before appending
    if (module === 'separacao') {
      return { separacaoTasks: reprocessAndMergeTasks(s.separacaoTasks, tasks) };
    } else {
      return { ressuprimentoTasks: reprocessAndMergeTasks(s.ressuprimentoTasks, tasks) };
    }
  }),
  clearTasks: (scope) => set(() => {
    if (scope === 'separacao') return { separacaoTasks: [] };
    if (scope === 'ressuprimento') return { ressuprimentoTasks: [] };
    return { separacaoTasks: [], ressuprimentoTasks: [] };
  }),

  separacaoConfig: {
    segundosPorVolume: 30, volumesPorHora: 120, limiteAtencao: 2, limiteOciosidade: 15,
    inicioExpediente: '07:00', fimExpediente: '17:00', inicioAlmoco: '12:00', fimAlmoco: '13:00',
  },
  ressuprimentoConfig: {
    minutosPorTarefa: 5, tarefasPorHora: 12, limiteAtencao: 2, limiteOciosidade: 15,
    inicioExpediente: '07:00', fimExpediente: '17:00', inicioAlmoco: '12:00', fimAlmoco: '13:00',
  },
  setSeparacaoConfig: (config) => set({ separacaoConfig: config }),
  setRessuprimentoConfig: (config) => set({ ressuprimentoConfig: config }),
  updateSeparacaoConfig: (data) => set((s) => ({ separacaoConfig: { ...s.separacaoConfig, ...data } })),
  updateRessuprimentoConfig: (data) => set((s) => ({ ressuprimentoConfig: { ...s.ressuprimentoConfig, ...data } })),

  filters: { operatorId: '', dataInicio: '', dataFim: '' },
  setFilters: (data) => set((s) => ({ filters: { ...s.filters, ...data } })),

  settings: {
    theme: 'dark', soundEnabled: true, notificationsEnabled: true,
    browserNotifications: true, realtimeEnabled: true, calcMode: 'volumes',
  },
  setSettingsDirect: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),
  updateSettings: (data) => set((s) => ({ settings: { ...s.settings, ...data } })),

  toasts: [],
  addToast: (message, type) => {
    const id = String(++toastCounter);
    set((s) => ({ toasts: [...s.toasts, { id, message, type, timestamp: Date.now() }] }));
    setTimeout(() => { set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })); }, 4500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  notifications: [],
  addNotification: (item) => set((s) => ({
    notifications: [
      { ...item, id: String(++notifCounter), timestamp: Date.now(), read: false },
      ...s.notifications,
    ].slice(0, 15),
  })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  markAllNotificationsRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),

  realtimeIdleStatuses: [],
setRealtimeIdleStatuses: (statuses) => set({ realtimeIdleStatuses: statuses }),

shownAlerts: new Set(),

markAlertShown: (id) =>
  set((s) => {
    const updated = new Set(s.shownAlerts);
    updated.add(id);

    return {
      shownAlerts: updated,
    };
  }),

removeShownAlert: (id) =>
  set((s) => {
    const updated = new Set(s.shownAlerts);
    updated.delete(id);

    return {
      shownAlerts: updated,
    };
  }),
