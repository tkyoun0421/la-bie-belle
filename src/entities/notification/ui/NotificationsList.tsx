import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { NotificationRow } from "@/shared/ui/NotificationRow";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATION_LIST_COPY } from "@/entities/notification/consts/notification.const";
import {
  useNotificationsList,
  type NotificationsListInput,
} from "@/entities/notification/hooks/useNotificationsList";

export type NotificationsListProps = NotificationsListInput & {
  pending?: ReactNode;
  empty?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
  failedMore?: (retry: () => void) => ReactNode;
};

export function NotificationsList({
  pending,
  empty,
  failed,
  failedMore,
  ...input
}: NotificationsListProps) {
  const fragment = useNotificationsList(input);

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  if (fragment.state === "failed") {
    return failed?.(fragment.retry) ?? null;
  }

  if (fragment.state === "empty") {
    return empty ?? null;
  }

  return (
    <ScrollView scrollEventThrottle={200} onScroll={fragment.loadNextOnScroll}>
      <View className="px-6 pb-6">
        {fragment.groups.map((group, at) => (
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

        {fragment.loadingMore ? (
          <View className="h-14 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : null}

        {fragment.failedMore ? failedMore?.(fragment.retryNextPage) : null}

        {fragment.hasMore ? null : (
          <Text size="xs" tone="subtle" className="py-8 text-center">
            {NOTIFICATION_LIST_COPY.end}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
