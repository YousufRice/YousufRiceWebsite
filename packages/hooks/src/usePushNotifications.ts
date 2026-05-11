import { useEffect, useState } from 'react';

interface PushState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  token: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: 'default',
    token: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState((s) => ({ ...s, isSupported: false }));
      return;
    }

    setState((s) => ({ ...s, isSupported: true }));

    if (Notification.permission) {
      setState((s) => ({ ...s, permission: Notification.permission }));
    }
  }, []);

  const requestPermission = async (vapidPublicKey: string): Promise<string | null> => {
    if (!state.isSupported) return null;

    const permission = await Notification.requestPermission();
    setState((s) => ({ ...s, permission }));

    if (permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
      });
      const token = JSON.stringify(subscription);
      setState((s) => ({ ...s, token }));
      return token;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return null;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    setState((s) => ({ ...s, token: null, permission: 'default' }));
  };

  return { ...state, requestPermission, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split('').map((char) => char.charCodeAt(0)));
}
