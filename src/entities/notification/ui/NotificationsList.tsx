import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";
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

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={(branch) => failed?.(branch.retry)}
      empty={empty}
    >
      {(ready) => (
        <ScrollView scrollEventThrottle={200} onScroll={ready.loadNextOnScroll}>
          <View className="px-6 pb-6">
            {ready.groups.map((group, at) => (
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

            {ready.loadingMore ? (
              <View className="h-14 items-center justify-center">
                <ActivityIndicator />
              </View>
            ) : null}

            {ready.failedMore ? failedMore?.(ready.retryNextPage) : null}

            {ready.hasMore ? null : (
              <Text size="xs" tone="subtle" className="py-8 text-center">
                {NOTIFICATION_LIST_COPY.end}
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </FragmentView>
  );
}
