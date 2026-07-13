/*
 * IHHH Event Navigator — service worker (Nov-event Phase 5).
 *
 * Deliberately minimal: it exists to receive Web Push and show notifications,
 * NOT to cache or intercept requests. There is no `fetch` handler, so it never
 * touches Next.js navigation or asset loading — installing it can't break the app.
 */

// Activate a new worker immediately instead of waiting for old tabs to close.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// A push arrived from the server (host reminder / event-journey update) → show it.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "IHHH 2026", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "IHHH 2026";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: "/badge-72.png",
    tag: payload.tag || undefined,
    // Replace an existing same-tag notification (and re-alert) rather than stack.
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping a notification focuses an open app tab (navigating it) or opens one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if ("navigate" in client) client.navigate(target).catch(() => {});
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
