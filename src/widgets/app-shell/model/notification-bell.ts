import type { ListNotificationsResult } from "@/entities/notification/api/list-notifications";

export type { ListNotificationsResult };

export function hasUnreadNotifications(result: ListNotificationsResult): boolean {
  return result.ok && result.unreadCount > 0;
}
