/**
 * Server-side Push Notification Utilities
 * 
 * Production-grade push notification service with:
 * - Appwrite database integration
 * - Batch sending with rate limiting
 * - Dead subscription cleanup
 * - Analytics tracking
 */

import { Client, TablesDB, Query, ID } from "node-appwrite";
import webpush from "web-push";

// Initialize VAPID
const vapidEmail = process.env.VAPID_EMAIL;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidEmail && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const PUSH_SUBSCRIPTIONS_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID || "push_subscriptions";
const PUSH_LOG_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID || "push_notification_log";

// Push API Secret for admin operations
const PUSH_API_SECRET = process.env.PUSH_API_SECRET || "";

// Batch configuration
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 200;

// Types
export interface PushSubscription {
  $id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id?: string;
  tags?: string;
  status: "active" | "inactive";
  fail_count: number;
  user_agent?: string;
  ip_address?: string;
  $createdAt?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: Record<string, unknown>;
  ttl?: number;
}

export interface SendOptions {
  tags?: string[];
  userIds?: string[];
  batchSize?: number;
  batchDelayMs?: number;
  ttl?: number;
}

export interface SendResult {
  total: number;
  sent: number;
  failed: number;
  removed: number;
  errors: Array<{ endpoint: string; error: string }>;
}

// Create admin client
function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_API_KEY || "");

  return new TablesDB(client);
}

/**
 * Save a new push subscription to the database
 */
export async function saveSubscription(
  subscription: Omit<PushSubscription, "status" | "fail_count">
): Promise<{ success: boolean; error?: string }> {
  try {
    const tablesDB = createAdminClient();

    // Check if subscription already exists
    const existing = await tablesDB.listRows(
      DATABASE_ID,
      PUSH_SUBSCRIPTIONS_TABLE_ID,
      [Query.equal("endpoint", subscription.endpoint)]
    );

    if (existing.total > 0) {
      // Update existing subscription
      const existingSub = existing.rows[0] as unknown as PushSubscription;
      await tablesDB.updateRow(
        DATABASE_ID,
        PUSH_SUBSCRIPTIONS_TABLE_ID,
        existingSub.$id!,
        {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          user_id: subscription.user_id || existingSub.user_id,
          tags: subscription.tags || existingSub.tags,
          status: "active",
          fail_count: 0,
          user_agent: subscription.user_agent,
          ip_address: subscription.ip_address,
        }
      );
      return { success: true };
    }

    // Create new subscription
    await tablesDB.createRow(
      DATABASE_ID,
      PUSH_SUBSCRIPTIONS_TABLE_ID,
      ID.unique(),
      {
        ...subscription,
        status: "active",
        fail_count: 0,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a subscription by endpoint
 */
export async function removeSubscription(endpoint: string): Promise<{ success: boolean }> {
  try {
    const tablesDB = createAdminClient();

    const existing = await tablesDB.listRows(
      DATABASE_ID,
      PUSH_SUBSCRIPTIONS_TABLE_ID,
      [Query.equal("endpoint", endpoint)]
    );

    if (existing.total > 0) {
      const sub = existing.rows[0] as unknown as PushSubscription;
      await tablesDB.deleteRow(DATABASE_ID, PUSH_SUBSCRIPTIONS_TABLE_ID, sub.$id!);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to remove subscription:", error);
    return { success: false };
  }
}

/**
 * Mark subscription as inactive after repeated failures
 */
async function markSubscriptionFailed(subscriptionId: string): Promise<void> {
  try {
    const tablesDB = createAdminClient();
    
    const row = await tablesDB.getRow(
      DATABASE_ID,
      PUSH_SUBSCRIPTIONS_TABLE_ID,
      subscriptionId
    ) as unknown as PushSubscription;

    const newFailCount = (row.fail_count || 0) + 1;
    
    if (newFailCount >= 5) {
      // Deactivate after 5 failures
      await tablesDB.updateRow(
        DATABASE_ID,
        PUSH_SUBSCRIPTIONS_TABLE_ID,
        subscriptionId,
        {
          status: "inactive",
          fail_count: newFailCount,
        }
      );
    } else {
      await tablesDB.updateRow(
        DATABASE_ID,
        PUSH_SUBSCRIPTIONS_TABLE_ID,
        subscriptionId,
        {
          fail_count: newFailCount,
        }
      );
    }
  } catch (error) {
    console.error("Failed to mark subscription as failed:", error);
  }
}

/**
 * Delete a subscription that returns 410 Gone
 */
async function deleteSubscription(subscriptionId: string): Promise<void> {
  try {
    const tablesDB = createAdminClient();
    await tablesDB.deleteRow(DATABASE_ID, PUSH_SUBSCRIPTIONS_TABLE_ID, subscriptionId);
  } catch (error) {
    console.error("Failed to delete subscription:", error);
  }
}

/**
 * Log notification to analytics table
 */
async function logNotification(
  subscriptionId: string,
  payload: NotificationPayload,
  status: "sent" | "clicked" | "dismissed" | "failed" | "delivered",
  errorCode?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const tablesDB = createAdminClient();

    const logData: Record<string, unknown> = {
      subscription_id: subscriptionId,
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      tag: payload.tag || "general",
      image: payload.image || null,
      status,
    };

    if (status === "sent" || status === "delivered") {
      logData.sent_at = new Date().toISOString();
    }
    if (status === "clicked") {
      logData.clicked_at = new Date().toISOString();
    }
    if (status === "dismissed") {
      logData.dismissed_at = new Date().toISOString();
    }
    if (status === "failed") {
      logData.error_code = errorCode;
      logData.error_message = errorMessage;
    }

    await tablesDB.createRow(DATABASE_ID, PUSH_LOG_TABLE_ID, ID.unique(), logData);
  } catch (error) {
    console.error("Failed to log notification:", error);
  }
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/logo.png",
      badge: payload.badge || "/badge.png",
      image: payload.image,
      tag: payload.tag || "general",
      requireInteraction: payload.requireInteraction ?? false,
      actions: payload.actions || [{ action: "view", title: "View" }],
      data: {
        ...payload.data,
        url: payload.url || "/",
        subscriptionId: subscription.$id,
      },
    });

    const ttl = payload.ttl || 86400; // 24 hours default

    await webpush.sendNotification(pushSubscription, notificationPayload, {
      TTL: ttl,
    });

    await logNotification(subscription.$id!, payload, "sent");
    return { success: true };
  } catch (error: any) {
    const statusCode = error.statusCode;
    
    // Handle specific error codes
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or invalid - delete it
      await deleteSubscription(subscription.$id!);
      return { success: false, statusCode, error: "Subscription expired" };
    }

    // Mark as failed for other errors
    await markSubscriptionFailed(subscription.$id!);
    await logNotification(subscription.$id!, payload, "failed", statusCode, error.message);
    
    return { success: false, statusCode, error: error.message };
  }
}

/**
 * Get subscriptions based on filters
 */
async function getSubscriptions(options: SendOptions): Promise<PushSubscription[]> {
  const tablesDB = createAdminClient();
  
  const queries: string[] = [Query.equal("status", "active")];
  
  if (options.userIds && options.userIds.length > 0) {
    queries.push(Query.equal("user_id", options.userIds));
  }
  
  // For tags, we need to fetch all and filter manually since tags are stored as comma-separated string
  const response = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_TABLE_ID,
    [...queries, Query.limit(10000)]
  );

  let subscriptions = response.rows as unknown as PushSubscription[];

  // Filter by tags if specified
  if (options.tags && options.tags.length > 0) {
    subscriptions = subscriptions.filter((sub) => {
      if (!sub.tags) return false;
      const subTags = sub.tags.split(",").map((t) => t.trim());
      return options.tags!.some((tag) => subTags.includes(tag));
    });
  }

  return subscriptions;
}

/**
 * Send push notifications to multiple subscribers with batching
 */
export async function sendPushNotifications(
  payload: NotificationPayload,
  options: SendOptions = {}
): Promise<SendResult> {
  const batchSize = options.batchSize || BATCH_SIZE;
  const batchDelayMs = options.batchDelayMs || BATCH_DELAY_MS;

  // Get target subscriptions
  const subscriptions = await getSubscriptions(options);

  if (subscriptions.length === 0) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      removed: 0,
      errors: [],
    };
  }

  const result: SendResult = {
    total: subscriptions.length,
    sent: 0,
    failed: 0,
    removed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);

    // Process batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map((sub) => sendToSubscription(sub, payload))
    );

    // Aggregate results
    batchResults.forEach((batchResult, index) => {
      const subscription = batch[index];
      
      if (batchResult.status === "fulfilled") {
        if (batchResult.value.success) {
          result.sent++;
        } else {
          result.failed++;
          if (batchResult.value.statusCode === 410 || batchResult.value.statusCode === 404) {
            result.removed++;
          }
          result.errors.push({
            endpoint: subscription.endpoint,
            error: batchResult.value.error || "Unknown error",
          });
        }
      } else {
        result.failed++;
        result.errors.push({
          endpoint: subscription.endpoint,
          error: batchResult.reason?.message || "Unknown error",
        });
      }
    });

    // Delay between batches (except for the last one)
    if (i + batchSize < subscriptions.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }

  return result;
}

/**
 * Get push notification statistics
 */
export async function getPushStats(): Promise<{
  totalSubscriptions: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
  totalNotifications: number;
  clickedNotifications: number;
  clickRate: number;
}> {
  const tablesDB = createAdminClient();

  // Get subscription counts
  const allSubs = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_TABLE_ID,
    [Query.limit(1)]
  );

  const activeSubs = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_TABLE_ID,
    [Query.equal("status", "active"), Query.limit(1)]
  );

  const inactiveSubs = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_TABLE_ID,
    [Query.equal("status", "inactive"), Query.limit(1)]
  );

  // Get notification stats
  const allNotifications = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_LOG_TABLE_ID,
    [Query.limit(1)]
  );

  const clickedNotifications = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_LOG_TABLE_ID,
    [Query.equal("status", "clicked"), Query.limit(1)]
  );

  const totalSent = allNotifications.total;
  const totalClicked = clickedNotifications.total;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

  return {
    totalSubscriptions: allSubs.total,
    activeSubscriptions: activeSubs.total,
    inactiveSubscriptions: inactiveSubs.total,
    totalNotifications: totalSent,
    clickedNotifications: totalClicked,
    clickRate: Math.round(clickRate * 100) / 100,
  };
}

/**
 * Verify push API secret for admin operations
 */
export function verifyPushSecret(secret: string): boolean {
  return secret === PUSH_API_SECRET;
}

/**
 * Clean up inactive subscriptions older than specified days
 */
export async function cleanupInactiveSubscriptions(daysOld: number = 30): Promise<{
  deleted: number;
}> {
  const tablesDB = createAdminClient();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Get inactive subscriptions older than cutoff
  const inactiveSubs = await tablesDB.listRows(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_TABLE_ID,
    [
      Query.equal("status", "inactive"),
      Query.lessThan("$createdAt", cutoffDate.toISOString()),
      Query.limit(1000),
    ]
  );

  let deleted = 0;
  for (const sub of inactiveSubs.rows as unknown as PushSubscription[]) {
    try {
      await tablesDB.deleteRow(DATABASE_ID, PUSH_SUBSCRIPTIONS_TABLE_ID, sub.$id!);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete subscription ${sub.$id}:`, error);
    }
  }

  return { deleted };
}

// Re-export webpush for direct access if needed
export { webpush };
