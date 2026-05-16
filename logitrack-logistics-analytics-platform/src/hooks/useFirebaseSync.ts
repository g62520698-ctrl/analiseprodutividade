import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import {
  listenToOperators,
  listenToTasks,
  listenToSeparacaoConfig,
  listenToRessuprimentoConfig,
  listenToSettings,
  initializeFirebaseData,
  pushAlert,
} from '../services/firebase';
import { generateAlerts } from '../utils';
import type { Unsubscribe } from 'firebase/database';

/**
 * Hook that connects Firebase Realtime Database to the Zustand store.
 * On mount, initializes Firebase data and attaches real-time listeners.
 * All listeners are cleaned up on unmount.
 */
export function useFirebaseSync() {
  const initialized = useRef(false);
  const seenAlertIds = useRef(new Set<string>());

  const initFirebase = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const state = useStore.getState();

      // Seed Firebase with defaults if empty (first run only)
      await initializeFirebaseData(
        state.operators,
        state.separacaoConfig,
        state.ressuprimentoConfig,
        state.settings,
      );

      useStore.getState().setFirebaseConnected(true);
      useStore.getState().addToast('🔥 Firebase conectado com sucesso!', 'success');

      // Attach real-time listeners
      const unsubs: Unsubscribe[] = [];

      unsubs.push(listenToOperators((operators) => {
        if (operators.length > 0) useStore.getState().setOperators(operators);
      }));

      unsubs.push(listenToTasks('separacao', (tasks) => {
        useStore.getState().setSeparacaoTasks(tasks);
      }));

      unsubs.push(listenToTasks('ressuprimento', (tasks) => {
        useStore.getState().setRessuprimentoTasks(tasks);
      }));

      unsubs.push(listenToSeparacaoConfig((config) => {
        useStore.getState().setSeparacaoConfig(config);
      }));

      unsubs.push(listenToRessuprimentoConfig((config) => {
        useStore.getState().setRessuprimentoConfig(config);
      }));

      unsubs.push(listenToSettings((settings) => {
        useStore.getState().setSettingsDirect(settings);
      }));

      // Return cleanup function
      return () => { unsubs.forEach((u) => u()); };
    } catch (err) {
      console.warn('[LogiTrack] Firebase connection failed, using local data:', err);
      useStore.getState().setFirebaseConnected(false);
      useStore.getState().addToast('⚠️ Firebase indisponível — dados locais ativos', 'warning');
      return undefined;
    }
  }, []);

  // Subscribe to task count changes for alert generation
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      const sepChanged = state.separacaoTasks.length !== prevState.separacaoTasks.length;
      const resChanged = state.ressuprimentoTasks.length !== prevState.ressuprimentoTasks.length;
      if (!sepChanged && !resChanged) return;

      // Generate alerts from real data
      const sepAlerts = generateAlerts(state.separacaoTasks, state.separacaoConfig);
      const resAlerts = generateAlerts(state.ressuprimentoTasks, state.ressuprimentoConfig);
      const allAlerts = [...sepAlerts, ...resAlerts];

      const newCritical = allAlerts.filter(
        (a) => (a.tipoAlerta === 'OCIOSIDADE' || a.tipoAlerta === 'AVISO') && !seenAlertIds.current.has(a.id)
      );

      for (const alert of newCritical.slice(0, 5)) {
        seenAlertIds.current.add(alert.id);
        const isCritical = alert.tipoAlerta === 'OCIOSIDADE';
        const durMin = Math.round(alert.duracao / 60);

        // Push to Firebase
        pushAlert({
          operatorName: alert.operatorName,
          type: alert.tipoAlerta,
          message: isCritical
            ? `${alert.operatorName}: ociosidade de ${durMin} min`
            : `${alert.operatorName}: intervalo de ${durMin} min`,
          timestamp: Date.now(),
        }).catch(() => {});

        // Local notification
        state.addNotification({
          type: isCritical ? 'critical' : 'attention',
          operatorName: alert.operatorName,
          message: isCritical
            ? `${alert.operatorName}: ociosidade de ${durMin} min detectada`
            : `${alert.operatorName}: intervalo de ${durMin} min entre tarefas`,
        });

        if (state.settings.notificationsEnabled) {
          state.addToast(
            isCritical
              ? `🔴 ${alert.operatorName}: ociosidade ${durMin} min`
              : `⚠️ ${alert.operatorName}: intervalo ${durMin} min`,
            isCritical ? 'error' : 'warning'
          );
        }

        if (state.settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`LogiTrack — ${isCritical ? '🔴 Ociosidade' : '⚠️ Atenção'}`, {
              body: isCritical
                ? `${alert.operatorName}: ${durMin} min sem atividade`
                : `${alert.operatorName}: intervalo de ${durMin} min`,
              tag: alert.id,
            });
          } catch { /* ignore */ }
        }
      }
    });

    return () => unsub();
  }, []);

  return { initFirebase };
}
