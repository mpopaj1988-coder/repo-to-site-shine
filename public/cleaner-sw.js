// Service worker for cleaner-portal push notifications. Scoped to /cleaners
// only (registered from that page) so it never touches the main site.
self.addEventListener("push", (event) => {
  let data = { title: "New cleaning available", body: "", url: "/cleaners" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/og.jpg",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/cleaners";
  event.waitUntil(clients.openWindow(url));
});
