# Push Notification System (Production-Grade)

A fully production-ready push notification system built with Next.js, Appwrite, and Web Push API.

## Features

### Security
- **Rate limiting** per IP address on all endpoints
- **Input validation** and sanitization
- **Secret-based authentication** for admin endpoints
- **Timing-safe secret comparison** to prevent timing attacks
- **HTTPS-only endpoint validation**

### Reliability
- **Circuit breaker pattern** prevents cascading failures
- **Exponential backoff retry** for failed operations
- **Dead subscription cleanup** (410/404 error handling)
- **Graceful degradation** when VAPID is not configured

### Performance
- **Cursor-based pagination** for large subscription lists
- **Batched sending** with configurable batch size and delay
- **In-memory rate limit store** (Redis-ready for production scale)

### Monitoring
- **Health check endpoint** with system status
- **Real-time metrics** (sent, failed, clicked, latency)
- **Error categorization** by type
- **Database connection monitoring**

### Data Management
- **30-day log retention** (configurable)
- **Inactive subscription pruning**
- **Unique constraints** on endpoints
- **Indexed fields** for efficient queries

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │ PushNotification │  │         Service Worker          │  │
│  │     Button       │  │              (sw.js)            │  │
│  └────────┬─────────┘  └──────────────────────────────────┘  │
│           │ push-client.ts                                   │
└───────────┼────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Routes                               │
│  ┌──────────┐ ┌────────────┐ ┌────────┐ ┌───────┐ ┌────────┐│
│  │ subscribe│ │ unsubscribe│ │ status │ │ track │ │  send  ││
│  └────┬─────┘ └─────┬──────┘ └───┬────┘ └───┬───┘ └───┬────┘│
│       └─────────────┴────────────┴──────────┴─────────┘     │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────┐                         │
│              │  push-production.ts │                         │
│              │   (Core Library)    │                         │
│              └──────────┬──────────┘                         │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Appwrite Database                         │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────┐ ┌────────┐│
│  │ push_subs      │ │  push_log    │ │templates │ │ prefs  ││
│  └────────────────┘ └──────────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Public Endpoints

#### POST `/api/push/subscribe`
Subscribe a user to push notifications.
**Rate limit:** 10 requests/minute per IP

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "...",
  "auth": "...",
  "user_id": "optional_user_id",
  "tags": ["promotions", "orders"]
}
```

#### POST `/api/push/unsubscribe`
Remove a subscription.
**Rate limit:** 20 requests/minute per IP

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

#### GET `/api/push/status?endpoint=...`
Check subscription status.
**Rate limit:** 60 requests/minute per IP

#### POST `/api/push/track`
Track notification interactions (click/dismiss).
**Rate limit:** 120 requests/minute per IP

```json
{
  "subscription_id": "...",
  "action": "click" | "dismiss",
  "url": "optional"
}
```

### Admin Endpoints (Protected by `PUSH_API_SECRET`)

#### POST `/api/push/send`
Send notifications to subscribers.
**Rate limit:** 10 requests/minute per IP
**Headers:** `x-push-secret: your_secret`

```json
{
  "title": "New Offer!",
  "body": "Get 20% off on all rice varieties",
  "url": "/offers",
  "tag": "promotion",
  "tags": ["promotions"],
  "userIds": ["user_id_1"],
  "batchSize": 100,
  "templateId": "optional_template_id",
  "variables": { "discount": "20%" }
}
```

#### GET `/api/push/health`
Get system health status and metrics.
**Rate limit:** 30 requests/minute per IP
**Headers:** `x-push-secret: your_secret`

Response:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "vapidConfigured": true,
    "databaseConnected": true,
    "metrics": {
      "totalSubscriptions": 1000,
      "activeSubscriptions": 950,
      "notificationsLast24h": 5000,
      "errorRate": 2.5
    }
  },
  "stats": { ... },
  "metrics": { ... }
}
```

#### POST `/api/push/cleanup`
Clean up old logs and inactive subscriptions.
**Rate limit:** 5 requests/hour per IP
**Headers:** `x-push-secret: your_secret`

```json
{
  "logRetentionDays": 30,
  "subscriptionRetentionDays": 30
}
```

## Setup

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Add to `.env`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your-email@example.com
```

### 2. Generate Push API Secret

```bash
openssl rand -hex 32
```

Add to `.env`:
```
PUSH_API_SECRET=your_generated_secret_at_least_32_chars
```

### 3. Run Setup Script

```bash
pnpm dotenv tsx scripts/setup-push-tables.ts
```

### 4. Add Service Worker

Ensure `public/sw.js` exists and handles push events.

## Database Schema

### push_subscriptions
| Field | Type | Description |
|-------|------|-------------|
| endpoint | string (500) | Push endpoint URL |
| p256dh | string (255) | Public key |
| auth | string (255) | Auth secret |
| user_id | string (255) | Optional user ID |
| tags | string[] | Array of tags |
| status | enum | active/inactive/pending |
| fail_count | integer | Consecutive failures |
| user_agent | string (500) | Browser info |
| ip_address | string (50) | Client IP |
| last_used_at | datetime | Last successful send |
| created_at | datetime | Creation time |

### push_notification_log
| Field | Type | Description |
|-------|------|-------------|
| subscription_id | string | Reference to subscription |
| title | string (255) | Notification title |
| body | string (1000) | Notification body |
| url | string (500) | Click URL |
| tag | string (100) | Notification tag |
| status | enum | sent/clicked/dismissed/failed/delivered |
| sent_at | datetime | Send timestamp |
| clicked_at | datetime | Click timestamp |
| error_code | integer | Error code if failed |
| error_message | string | Error details |

### push_templates (Optional)
| Field | Type | Description |
|-------|------|-------------|
| name | string (100) | Template name |
| title | string (100) | Template title with {{vars}} |
| body | string (300) | Template body with {{vars}} |
| icon | string (500) | Icon URL |
| actions | string (1000) | JSON action buttons |
| is_active | boolean | Template active status |

### push_user_preferences (Optional)
| Field | Type | Description |
|-------|------|-------------|
| user_id | string | User ID |
| enabled | boolean | Notifications enabled |
| quiet_hours_start | string | HH:MM format |
| quiet_hours_end | string | HH:MM format |
| timezone | string | User timezone |
| excluded_tags | string[] | Tags to exclude |
| max_per_day | integer | Daily limit |

## Client Usage

```tsx
import { subscribeToPush, getPushPermission } from "@/lib/push-client";

// Check support
const isSupported = () => 'Notification' in window && 'serviceWorker' in navigator;

// Subscribe
const handleSubscribe = async () => {
  const permission = await getPushPermission();
  if (permission !== 'granted') return;
  
  const result = await subscribeToPush(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    { 
      userId: currentUser?.id,
      tags: ['promotions', 'orders'] 
    }
  );
  
  if (result.success) {
    console.log('Subscribed successfully');
  }
};
```

## Production Checklist

- [ ] VAPID keys generated and configured
- [ ] PUSH_API_SECRET set (32+ characters)
- [ ] Database tables created with indexes
- [ ] Service worker deployed
- [ ] Rate limits tested
- [ ] Health endpoint monitored
- [ ] Cleanup job scheduled (cron)
- [ ] Error alerting configured
- [ ] Redis configured for rate limiting (optional)

## Monitoring

### Health Endpoint
```bash
curl -H "x-push-secret: YOUR_SECRET" \
  https://yoursite.com/api/push/health
```

### Metrics to Watch
- Error rate (should be < 5%)
- Active subscription count
- Average latency (should be < 500ms)
- Circuit breaker status

## Troubleshooting

### Push notifications not sending
1. Check VAPID configuration: `/api/push/health`
2. Verify subscriptions are active in database
3. Check browser console for service worker errors

### High error rate
1. Check circuit breaker status in health endpoint
2. Review error types in metrics
3. Verify FCM/APNs endpoints are accessible

### Rate limit exceeded
- Wait for reset time (returned in 429 response)
- Consider increasing limits for legitimate use cases
- Implement exponential backoff in client

## License

MIT
