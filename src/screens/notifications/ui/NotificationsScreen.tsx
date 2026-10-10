import { View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { QueryBoundary } from "@/shared/ui/QueryBoundary";
import { Screen } from "@/shared/ui/Screen";
import { NotificationsList } from "@/entities/notification/ui/NotificationsList";
import { UnreadCountFailed } from "@/entities/notification/ui/UnreadCountFailed";
import { UnreadCountLine } from "@/entities/notification/ui/UnreadCountLine";
import { UnreadCountLoading } from "@/entities/notification/ui/UnreadCountLoading";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";
import { useNotificationsScreen } from "@/screens/notifications/hooks/useNotificationsScreen";
import { NotificationsEmpty } from "@/screens/notifications/ui/NotificationsEmpty";
import { NotificationsFailed } from "@/screens/notifications/ui/NotificationsFailed";
import { NotificationsLoading } from "@/screens/notifications/ui/NotificationsLoading";

export type NotificationsScreenProps = {
  from?: string;
};

export function NotificationsScreen({ from }: NotificationsScreenProps) {
  const screen = useNotificationsScreen(from);

  return (
    <Screen floor="plain">
      <AppBar title={NOTIFICATIONS_COPY.appBarTitle} onBack={screen.goBack} />

      <QueryBoundary
        pending={<UnreadCountLoading />}
        failed={(retry) => <UnreadCountFailed onRetry={retry} />}
      >
        <UnreadCountLine />
      </QueryBoundary>

      <NotificationsList
        now={screen.now}
        onPressRow={screen.pressRow}
        onUnreadNotices={screen.markNotices}
        pending={<NotificationsLoading />}
        empty={<NotificationsEmpty />}
        failed={(retry) => (
          <View className="px-6">
            <NotificationsFailed onRetry={retry} />
          </View>
        )}
        failedMore={(retry) => <NotificationsFailed onRetry={retry} />}
      />
    </Screen>
  );
}
