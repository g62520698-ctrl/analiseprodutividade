import { messagingPromise } from './config';
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';

let currentToken: string | null = null;

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn('[LogiTrack] FCM not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[LogiTrack] Notification permission denied');
      return null;
    }

    currentToken = await getToken(messaging, {
      vapidKey: 'BDJx8Z3G3dEKY9hxTpE1qPzOb_khdVPp5bCqFR3LfOKnzLq7m3xUhJxTCTZwJ3xntzMwYqp9hNqPjLzQLqC8VdA',
    });

    if (currentToken) {
      console.log('[LogiTrack] FCM Token:', currentToken);
    }
    return currentToken;
  } catch (err) {
    console.warn('[LogiTrack] FCM token error:', err);
    return null;
  }
}

// Listen for foreground messages (when app is open)
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await messagingPromise;
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[LogiTrack] Foreground message:', payload);
    callback(payload);
  });

  return unsubscribe;
}

// Send a local notification (works without server)
export function showLocalNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `logitrack-${Date.now()}`,
        requireInteraction: false,
        silent: false,
      });
    } catch {
      // Ignore errors
    }
  }
}

export function getFCMToken(): string | null {
  return currentToken;
}
