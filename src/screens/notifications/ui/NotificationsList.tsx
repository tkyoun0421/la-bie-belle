import { ActivityIndicator, ScrollView, View } from "react-native";
import { NotificationRow } from "@/shared/ui/NotificationRow";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";
import type { NotificationsScreenController } from "@/screens/notifications/hooks/useNotificationsScreen";
import { NotificationsFailed } from "@/screens/notifications/ui/NotificationsFailed";

export type NotificationsListProps = {
  screen: NotificationsScreenController;
};

export function NotificationsList({ screen }: NotificationsListProps) {
  return (
    <ScrollView scrollEventThrottle={200} onScroll={screen.loadNextOnScroll}>
      <View className="px-6 pb-6">
        {screen.groups.map((group, at) => (
          <View key={group.date}>
            <Text
              size="xs"
              weight="medium"
              tone="subtle"
              className={at === 0 ? "mt-4 mb-2" : "mt-6 mb-2"}
            >
              {group.header}
            </Text>

            {group.rows.map((row) => (
              <NotificationRow
                key={row.id}
                testID={`notification-row-${row.kind}`}
                title={row.title}
                time={row.time}
                unread={row.unread}
                onPress={row.press}
              />
            ))}
          </View>
        ))}

        {screen.state === "loadingMore" ? (
          <View className="h-14 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : null}

        {screen.state === "errorMore" ? (
          <NotificationsFailed onRetry={screen.retryNextPage} />
        ) : null}

        {screen.state === "end" ? (
          <Text size="xs" tone="subtle" className="py-8 text-center">
            {NOTIFICATIONS_COPY.end}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
