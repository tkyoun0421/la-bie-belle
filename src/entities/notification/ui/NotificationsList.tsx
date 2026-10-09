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
  loading?: ReactNode;
  empty?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
  failedMore?: (retry: () => void) => ReactNode;
};

export function NotificationsList({
  loading,
  empty,
  failed,
  failedMore,
  ...input
}: NotificationsListProps) {
  const fragment = useNotificationsList(input);

  if (fragment.body === "loading") {
    return loading ?? null;
  }

  if (fragment.body === "failed") {
    return failed?.(fragment.retry) ?? null;
  }

  if (fragment.body === "empty") {
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

        {fragment.state === "loadingMore" ? (
          <View className="h-14 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : null}

        {fragment.state === "errorMore"
          ? failedMore?.(fragment.retryNextPage)
          : null}

        {fragment.state === "end" ? (
          <Text size="xs" tone="subtle" className="py-8 text-center">
            {NOTIFICATION_LIST_COPY.end}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
