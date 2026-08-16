import { RouteTransition } from "@/shared/ui/route-transition";
import { NotificationSettingsView } from "@/views/notification-settings/ui/NotificationSettingsView";

export default function NotificationSettingsPage() {
  return (
    <RouteTransition>
      <NotificationSettingsView />
    </RouteTransition>
  );
}
