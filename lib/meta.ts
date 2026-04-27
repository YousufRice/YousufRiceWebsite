import crypto from 'crypto';
import type { AgentLabel, OrderChannel } from "@/lib/tracking/order-channel";

// Meta Configuration (2025 - Dataset Approach)
// In 2025, every Pixel is part of a Dataset
// Use Dataset ID for both browser (Pixel) and server (Conversions API) tracking

export const META_DATASET_ID = process.env.NEXT_PUBLIC_META_DATASET_ID!;
export const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

// Meta Conversions API URL
export const META_API_URL = `https://graph.facebook.com/v20.0/${META_DATASET_ID}/events`;

// Types for Meta Events
export interface MetaUserData {
  em?: string; // email (hashed)
  ph?: string; // phone (hashed)
  fn?: string; // first name (hashed)
  ln?: string; // last name (hashed)
  ct?: string; // city (hashed)
  st?: string; // state (hashed)
  zp?: string; // zip code (hashed)
  country?: string; // country code (hashed)
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string; // Facebook browser ID (_fbp cookie)
  fbc?: string; // Facebook click ID (_fbc cookie)
  external_id?: string; // Your customer ID
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: string;
  order_id?: string;
  order_channel?: OrderChannel;
  agent_label?: AgentLabel;
  placed_by_user_id?: string;
  customer_user_id?: string;
}

export interface MetaEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: MetaUserData;
  custom_data?: MetaCustomData;
}

export interface MetaEventPayload {
  data: MetaEvent[];
  test_event_code?: string;
}

// Utility: Remove call agent symbols from customer name before sending to Meta
// Removes: -s, -S, -k, -K, (s), (S), (k), (K) which indicate orders taken by call agents
export function sanitizeCustomerNameForMeta(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  
  // Remove agent symbols: -s, -S, -k, -K, (s), (S), (k), (K)
  // This regex removes the symbols with optional spaces around them
  const sanitized = name
    .replace(/\s*-\s*[sSkK]\s*/g, ' ')  // Remove -s, -S, -k, or -K with surrounding spaces
    .replace(/\s*\(\s*[sSkK]\s*\)\s*/g, ' ')  // Remove (s), (S), (k), or (K) with surrounding spaces
    .replace(/\b[sSkK]\b/g, ' ')  // Remove standalone s, S, k, or K
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .trim();  // Remove leading/trailing spaces
  
  return sanitized || undefined;
}

// Utility: Hash data with SHA256 (required by Meta)
export function hashData(data: string | undefined | null): string | undefined {
  if (!data) return undefined;
  
  // Normalize: lowercase and trim
  const normalized = data.toLowerCase().trim();
  
  // Hash with SHA256
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Utility: Generate unique event ID for deduplication
export function generateEventId(options?: {
  eventName?: string;
  stableKey?: string;
}): string {
  const eventPrefix = options?.eventName
    ? options.eventName.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    : "event";

  if (options?.stableKey) {
    const stableHash = crypto
      .createHash("sha256")
      .update(options.stableKey)
      .digest("hex")
      .slice(0, 16);
    return `${eventPrefix}_${stableHash}`;
  }

  return `${eventPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// Utility: Get current Unix timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Utility: Extract Facebook cookies from browser
export function getFacebookCookies(): { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {};
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    fbp: cookies._fbp,
    fbc: cookies._fbc,
  };
}

// Utility: Get client IP (from headers in API route)
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIp || undefined;
}

// Utility: Prepare user data with hashing
export function prepareUserData(rawUserData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
}): MetaUserData {
  return {
    em: hashData(rawUserData.email),
    ph: hashData(rawUserData.phone),
    fn: hashData(rawUserData.firstName),
    ln: hashData(rawUserData.lastName),
    ct: hashData(rawUserData.city),
    st: hashData(rawUserData.state),
    zp: hashData(rawUserData.zipCode),
    country: hashData(rawUserData.country),
    client_ip_address: rawUserData.clientIp,
    client_user_agent: rawUserData.userAgent,
    fbp: rawUserData.fbp,
    fbc: rawUserData.fbc,
    external_id: rawUserData.externalId,
  };
}

// Utility: Send event to Meta Conversions API
export async function sendMetaEvent(
  event: MetaEvent,
  testEventCode?: string
): Promise<{ success: boolean; error?: string }> {
  const payload: MetaEventPayload = {
    data: [event],
    ...(testEventCode && { test_event_code: testEventCode }),
  };

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(META_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      timeout = undefined;

      if (response.ok) {
        return { success: true };
      }

      let errorMessage = 'Unknown error';
      try {
        const result = await response.json();
        errorMessage = result?.error?.message || errorMessage;
      } catch {
        errorMessage = `Meta API HTTP ${response.status}`;
      }

      const shouldRetry = response.status >= 500 || response.status === 429;
      if (!shouldRetry || attempt === maxAttempts) {
        console.error('Meta API Error:', {
          eventName: event.event_name,
          eventId: event.event_id,
          attempt,
          status: response.status,
          errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt) {
        console.error('Meta API Request Failed:', {
          eventName: event.event_name,
          eventId: event.event_id,
          attempt,
          error,
        });
        return {
          success: false,
          error: isAbort
            ? 'Meta request timeout'
            : error instanceof Error
              ? error.message
              : 'Network error',
        };
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  return { success: false, error: 'Meta request failed' };
}
