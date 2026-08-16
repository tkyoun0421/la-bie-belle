import type { NotificationTarget } from "@/entities/notification/model/notification-item";

const NOTIFICATION_MONTH_PATTERN = /^\d{4}-\d{2}$/;
const NOTIFICATIONS_FALLBACK_PATH = "/notifications";

export function resolveNotificationPath(target: NotificationTarget): string {
  if (target.screen === "schedule-detail") {
    return `/schedule/${target.date}`;
  }

  if (target.screen === "schedule") {
    return NOTIFICATION_MONTH_PATTERN.test(target.month)
      ? `/schedule?month=${target.month}`
      : NOTIFICATIONS_FALLBACK_PATH;
  }

  if (target.screen === "pay") {
    return "/pay";
  }

  return NOTIFICATIONS_FALLBACK_PATH;
}
