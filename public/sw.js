/**
 * Push Notification Service Worker
 * 
 * Handles:
 * - Push events (displaying rich notifications)
 * - Notification clicks (tracking + deep linking)
 * - Notification dismiss (tracking)
 * - Tag-based notification replacement
 */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: data.badge || "/badge.png",
      image: data.image || undefined,
      tag: data.tag || "general",
      requireInteraction: data.requireInteraction ?? false,
      vibrate: [100, 50, 100, 50, 100],
      actions: data.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
      data: {
        url: data.url || "/",
        subscriptionId: data.data?.subscriptionId || null,
        tag: data.tag || "general",
        dateOfArrival: Date.now(),
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});

self.addEventListener("notificationclick", function (event) {
  const notification = event.notification;
  notification.close();

  const { url, subscriptionId } = notification.data || {};

  // Track click if we have a subscription ID
  if (subscriptionId) {
    event.waitUntil(
      fetch("/api/push/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action: "click",
          url: url || "/",
        }),
      }).catch((err) => console.error("Track click failed:", err))
    );
  }

  // Handle actions
  if (event.action === "view" || !event.action) {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          const targetUrl = url || "/";

          // Focus existing window if it's open
          for (const client of clientList) {
            if (client.url === targetUrl && "focus" in client) {
              return client.focus();
            }
          }

          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

self.addEventListener("notificationclose", function (event) {
  const notification = event.notification;
  const { subscriptionId } = notification.data || {};

  // Track dismiss if we have a subscription ID
  if (subscriptionId) {
    event.waitUntil(
      fetch("/api/push/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action: "dismiss",
        }),
      }).catch((err) => console.error("Track dismiss failed:", err))
    );
  }
});

// Handle service worker activation and cleanup
self.addEventListener("activate", function (event) {
  console.log("[SW] Push Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener("install", function (event) {
  console.log("[SW] Push Service Worker installed");
  self.skipWaiting();
});
