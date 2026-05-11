// Unified push notification interface for web and native
export interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  url?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

// Web push (VAPID) token structure
export interface WebPushToken {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Expo push token
export interface ExpoPushToken {
  token: string;
  platform: 'ios' | 'android';
}

export function isWebPushToken(token: unknown): token is WebPushToken {
  return typeof token === 'object' && token !== null && 'endpoint' in token && 'keys' in token;
}

export function isExpoPushToken(token: unknown): token is ExpoPushToken {
  return typeof token === 'object' && token !== null && 'token' in token && 'platform' in token;
}

// Send push via Expo's HTTP/2 API
export async function sendToExpo(tokens: string[], message: PushMessage) {
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(
        chunk.map((token) => ({
          to: token,
          sound: 'default',
          title: message.title,
          body: message.body,
          data: { url: message.url },
        }))
      ),
    });

    if (!response.ok) {
      console.error('Expo push failed:', await response.text());
    }
  }
}
