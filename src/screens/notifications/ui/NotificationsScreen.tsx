import { View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Screen } from "@/shared/ui/Screen";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";
import { useNotificationsScreen } from "@/screens/notifications/hooks/useNotificationsScreen";
import { NotificationsEmpty } from "@/screens/notifications/ui/NotificationsEmpty";
import { NotificationsFailed } from "@/screens/notifications/ui/NotificationsFailed";
import { NotificationsList } from "@/screens/notifications/ui/NotificationsList";
import { NotificationsLoading } from "@/screens/notifications/ui/NotificationsLoading";

export type NotificationsScreenProps = {
  from?: string;
};

export function NotificationsScreen({ from }: NotificationsScreenProps) {
  const screen = useNotificationsScreen(from);

  return (
    <Screen floor="plain">
      <AppBar title={NOTIFICATIONS_COPY.appBarTitle} onBack={screen.goBack} />

      {screen.body === "loading" ? <NotificationsLoading /> : null}

      {screen.body === "failed" ? (
        <View className="px-6">
          <NotificationsFailed onRetry={screen.retry} />
        </View>
      ) : null}

      {screen.body === "empty" ? <NotificationsEmpty /> : null}

      {screen.body === "rows" ? <NotificationsList screen={screen} /> : null}
    </Screen>
  );
}
