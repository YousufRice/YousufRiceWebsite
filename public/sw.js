self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "1",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

// Handle service worker activation and cleanup
self.addEventListener("activate", function (event) {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener("install", function (event) {
  console.log("Service Worker installed");
  self.skipWaiting();
});
