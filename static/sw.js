async function pageIsVisible() {
  const windowClients = await clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    if (client.visibilityState === "visible") {
      return true;
    }
  }

  return false;
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // If there is a window open, focus it. Otherwise, open a new window.
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
  );
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const visible = await pageIsVisible();
    if (!visible) {
      self.registration.showNotification("Flipbit", {
        body: "You've received a new message.",
      });
    }
  })());
});
