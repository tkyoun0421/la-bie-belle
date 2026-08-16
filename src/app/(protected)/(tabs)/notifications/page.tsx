import { listNotifications } from "@/entities/notification/api/list-notifications";
import { markAllNotificationsRead } from "@/features/notification/api/mark-all-notifications-read";
import { markNotificationRead } from "@/features/notification/api/mark-notification-read";
import { RouteTransition } from "@/shared/ui/route-transition";
import { NotificationsPageClient } from "@/views/notifications/ui/NotificationsPageClient";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function NotificationsPage() {
  const notificationsResult = await listNotifications();

  if (!notificationsResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <RouteTransition>
      <NotificationsPageClient
        items={notificationsResult.items}
        now={new Date()}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />
    </RouteTransition>
  );
}
