import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type { ProcessedRecord, Separator, DetailedAlert, FilterPeriod, PageType } from '../types';

interface AppState {
  records: ProcessedRecord[];
  separators: Separator[];
  alerts: DetailedAlert[];
  periodo: FilterPeriod;
  dataSelecionada: string;
  separadorSelecionado: string;
  currentPage: PageType;
  sidebarOpen: boolean;
  loading: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  appName: string;

  addRecords: (records: ProcessedRecord[]) => void;
  clearRecords: () => void;
  addSeparator: (sep: Separator) => void;
  updateSeparator: (id: string, data: Partial<Separator>) => void;
  deleteSeparator: (id: string) => void;
  setAlerts: (alerts: DetailedAlert[]) => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;
  setPeriodo: (p: FilterPeriod) => void;
  setDataSelecionada: (d: string) => void;
  setSeparadorSelecionado: (s: string) => void;
  setCurrentPage: (p: PageType) => void;
  toggleSidebar: () => void;
  setLoading: (l: boolean) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      records: [],
      separators: [],
      alerts: [],
      periodo: 'diario' as FilterPeriod,
      dataSelecionada: dayjs().format('YYYY-MM-DD'),
      separadorSelecionado: '',
      currentPage: 'dashboard' as PageType,
      sidebarOpen: true,
      loading: false,
      notification: null,
      appName: 'LogiTrack Pro',

      addRecords: (records) =>
        set((state) => {
          const existing = new Set(
            state.records.map((r) => `${r.usuario}_${r.data}_${r.hora}_${r.volumes}`)
          );
          const newRecords = records.filter((r) => {
            const key = `${r.usuario}_${r.data}_${r.hora}_${r.volumes}`;
            if (existing.has(key)) return false;
            existing.add(key);
            return true;
          });
          return { records: [...state.records, ...newRecords] };
        }),

      clearRecords: () => set({ records: [], alerts: [] }),

      addSeparator: (sep) =>
        set((state) => {
          const exists = state.separators.some(
            (s) => s.nome.toUpperCase() === sep.nome.toUpperCase()
          );
          if (exists) return state;
          return { separators: [...state.separators, sep] };
        }),

      updateSeparator: (id, data) =>
        set((state) => ({
          separators: state.separators.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      deleteSeparator: (id) =>
        set((state) => ({
          separators: state.separators.filter((s) => s.id !== id),
        })),

      setAlerts: (alerts) => set({ alerts }),
      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, lido: true } : a
          ),
        })),
      clearAlerts: () => set({ alerts: [] }),

      setPeriodo: (periodo) => set({ periodo }),
      setDataSelecionada: (dataSelecionada) => set({ dataSelecionada }),
      setSeparadorSelecionado: (separadorSelecionado) => set({ separadorSelecionado }),

      setCurrentPage: (currentPage) => set({ currentPage }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLoading: (loading) => set({ loading }),
      showNotification: (message, type) => set({ notification: { message, type } }),
      clearNotification: () => set({ notification: null }),
    }),
    {
      name: 'logitrack-storage',
      partialize: (state) => ({
        records: state.records,
        separators: state.separators,
        appName: state.appName,
      }),
    }
  )
);
