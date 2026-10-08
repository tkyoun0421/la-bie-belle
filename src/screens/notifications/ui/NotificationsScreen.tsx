import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { NotificationRow } from "@/shared/ui/NotificationRow";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";
import { useNotificationsScreen } from "@/screens/notifications/hooks/useNotificationsScreen";
import { nearBottom } from "@/screens/notifications/utils/nearBottom.utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export type NotificationsScreenProps = {
  from?: string;
};

function FailBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="mt-4 items-center gap-3">
      <Text size="sm" tone="muted">
        {NOTIFICATIONS_COPY.readFailed}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        {NOTIFICATIONS_COPY.retry}
      </Button>
    </View>
  );
}

export function NotificationsScreen({ from }: NotificationsScreenProps) {
  const router = useRouter();
  const bearings = useMemo(
    () => ({
      canGoBack: () => router.canGoBack(),
      back: () => router.back(),
      replace: (destination: string) => router.replace(destination as Href),
      push: (destination: string) => router.push(destination as Href),
    }),
    [router],
  );
  const { state, groups, goBack, retry, retryNextPage, loadNextWhenNear } =
    useNotificationsScreen(bearings, from);

  return (
    <Screen floor="plain">
      <AppBar title={NOTIFICATIONS_COPY.appBarTitle} onBack={goBack} />

      {state === "loading" ? (
        <View className="px-6 pt-4">
          {SKELETON_ROWS.map((at) => (
            <View key={at} className="h-14 flex-row items-center gap-3">
              <SkeletonLine className="flex-1" />
              <SkeletonLine className="w-12" />
            </View>
          ))}
        </View>
      ) : state === "error" ? (
        <View className="px-6">
          <FailBlock onRetry={retry} />
        </View>
      ) : state === "empty" ? (
        <View className="mt-4 px-6 py-4">
          <Text weight="medium">{NOTIFICATIONS_COPY.emptyTitle}</Text>
          <Text size="sm" tone="subtle" className="mt-0.5">
            {NOTIFICATIONS_COPY.emptyBody}
          </Text>
        </View>
      ) : (
        <ScrollView
          scrollEventThrottle={200}
          onScroll={(event) => loadNextWhenNear(nearBottom(event))}
        >
          <View className="px-6 pb-6">
            {groups.map((group, at) => (
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

            {state === "loadingMore" ? (
              <View className="h-14 items-center justify-center">
                <ActivityIndicator />
              </View>
            ) : null}

            {state === "errorMore" ? (
              <FailBlock onRetry={retryNextPage} />
            ) : null}

            {state === "end" ? (
              <Text size="xs" tone="subtle" className="py-8 text-center">
                {NOTIFICATIONS_COPY.end}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
