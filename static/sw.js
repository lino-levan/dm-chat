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

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const visible = await pageIsVisible();
    if (!visible) {
      self.registration.showNotification("You've received a new message.");
    }
  })());
});
