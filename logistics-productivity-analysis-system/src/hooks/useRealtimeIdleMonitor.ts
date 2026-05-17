import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { checkRealtimeIdleStatus } from '../utils';

/**
 * Real-time idle monitor.
 *
 * Runs every 30 seconds and checks actual elapsed time since each
 * operator's last recorded activity.
 *
 * Key principle: NEVER projects time to end of shift. Only measures
 * real elapsed seconds from the last known activity to NOW.
 *
 * States:
 * - ACTIVE: Operator had recent activity
 * - WAITING_NEXT_TASK: Last task is pending, within normal bounds
 * - ATTENTION: Elapsed > limiteAtencao but < limiteOciosidade
 * - IDLE: Elapsed > limiteOciosidade
 * - LUNCH_BREAK: Currently in lunch period
 * - OFF_SHIFT: Outside shift hours (not reported)
 */
export function useRealtimeIdleMonitor() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => {
      const state = useStore.getState();

      const statuses = checkRealtimeIdleStatus(
        state.operators,
        state.separacaoTasks,
        state.ressuprimentoTasks,
        state.separacaoConfig,
        state.ressuprimentoConfig,
      );

      state.setRealtimeIdleStatuses(statuses);

      // Generate notifications for NEW idle/attention states only
      for (const s of statuses) {
        const alertKey = `${s.operatorId}-${s.state}`;
        if ((s.state === 'IDLE' || s.state === 'ATTENTION') && !prevAlertIds.current.has(alertKey)) {
          prevAlertIds.current.add(alertKey);

          const isCritical = s.state === 'IDLE';
          const elapsedMin = Math.round(s.elapsedSeconds / 60);

          state.addNotification({
            type: isCritical ? 'critical' : 'attention',
            operatorName: s.operatorName,
            message: isCritical
              ? `🔴 ${s.operatorName}: ociosidade real de ${elapsedMin} min detectada`
              : `⚠️ ${s.operatorName}: sem atividade há ${elapsedMin} min`,
          });

          if (state.settings.notificationsEnabled) {
            state.addToast(
              isCritical
                ? `🔴 ${s.operatorName}: ociosidade real de ${elapsedMin} min`
                : `⚠️ ${s.operatorName}: sem atividade há ${elapsedMin} min`,
              isCritical ? 'error' : 'warning',
            );
          }

          if (state.settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`LogiTrack — ${isCritical ? '🔴 Ociosidade Real' : '⚠️ Atenção'}`, {
                body: `${s.operatorName}: ${elapsedMin} min sem atividade registrada`,
                tag: `rt-${s.operatorId}`,
              });
            } catch { /* ignore */ }
          }
        }

        // If operator returned to ACTIVE, clear the alert key so future idle will trigger again
        if (s.state === 'ACTIVE') {
          prevAlertIds.current.delete(`${s.operatorId}-IDLE`);
          prevAlertIds.current.delete(`${s.operatorId}-ATTENTION`);
        }
      }
    };

    // First check immediately
    check();

    // Then every 30 seconds
    intervalRef.current = setInterval(check, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
