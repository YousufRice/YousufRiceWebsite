// Meta Pixel + Conversions API helpers
export interface MetaEvent {
  eventName: string;
  eventTime?: number;
  userData?: Record<string, string | number>;
  customData?: Record<string, string | number>;
}

export function createMetaTracker(pixelId: string, accessToken?: string) {
  return {
    track(event: MetaEvent) {
      // Web: send via Meta Pixel JS SDK
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', event.eventName, event.customData);
      }

      // Server: send to Conversions API
      if (accessToken) {
        // POST to your Next.js API route which proxies to Meta
        fetch('/api/meta-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pixelId, ...event }),
        }).catch(console.error);
      }
    },

    trackCustom(eventName: string, data?: Record<string, unknown>) {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', eventName, data);
      }
    },
  };
}
