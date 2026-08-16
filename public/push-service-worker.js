const DEFAULT_TITLE = "라비에벨";
const DEFAULT_BODY = "";
const NOTIFICATION_ICON = "/icons/icon-192.png";
const NOTIFICATIONS_FALLBACK_PATH = "/notifications";

function parsePushPayload(event) {
  if (event.data === null) {
    return {};
  }
  try {
    const value = event.data.json();
    if (typeof value !== "object" || value === null) {
      return {};
    }
    return value;
  } catch {
    return {};
  }
}

function toShowNotificationOptions(payload) {
  return {
    title: payload.title ?? DEFAULT_TITLE,
    options: {
      body: payload.body ?? DEFAULT_BODY,
      icon: NOTIFICATION_ICON,
      data: { target: payload.target ?? null },
    },
  };
}

function isNotificationTarget(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (value.screen === "schedule-detail") {
    return typeof value.date === "string";
  }
  return value.screen === "pay";
}

function resolvePushClickPath(target) {
  if (!isNotificationTarget(target)) {
    return NOTIFICATIONS_FALLBACK_PATH;
  }
  return target.screen === "schedule-detail" ? `/schedule/${target.date}` : "/pay";
}

async function focusOrOpenWindow(path) {
  const url = new URL(path, self.location.origin).href;
  const openClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const existing = openClients.find((client) => client.url === url);
  if (existing !== undefined) {
    return existing.focus();
  }
  return self.clients.openWindow(url);
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event);
  const { title, options } = toShowNotificationOptions(payload);
  event.waitUntil(Promise.resolve(self.registration.showNotification(title, options)));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = resolvePushClickPath(event.notification.data?.target);
  event.waitUntil(focusOrOpenWindow(path));
});
