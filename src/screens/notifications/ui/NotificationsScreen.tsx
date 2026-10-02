import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { NotificationRow } from "@/shared/ui/NotificationRow";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";
import { useNotificationsScreen } from "@/screens/notifications/hooks/useNotificationsScreen";
import { nearBottom } from "@/screens/notifications/utils/nearBottom.utils";

/**
 * 받은 알림이 최근부터 다 서는 화면이다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`고 완료 조건은
 * `docs/2-design/spec/notification-list.md`다.
 *
 * **탭 바가 없다.** 탭 넷 위로 밀려 올라간 화면이라 나가는 문이 앱바의 뒤로 하나다 — 온
 * 화면이 `?from=`에 실려 온다.
 *
 * **여기서 답하지 않는다.** 교대 요청에 수락·거절이 안 붙고 ✕도 없다. 닿는 자리가 줄
 * 하나뿐이고, 하나뿐이면 무엇이 일어날지가 한 가지다.
 *
 * **controller가 줄을 다 지어 준다.** 제목·시각·안 읽음·누르는 손이 줄마다 꽂혀 오고
 * ([use-notifications-screen](../hooks/useNotificationsScreen.ts)), 여기 남는 것은 그
 * 줄을 날짜 묶음대로 그리는 일이다 — 문장이 없는 줄을 걸러내는 것도 거기서 끝난다.
 *
 * **바닥에 닿았는지만 재서 넘긴다.** 재는 값이 전부 기기가 그려 놓은 길이라 측정은 화면의
 * 일이고, 그 답으로 다음 쪽을 부를지 정하는 것은 controller다.
 */

/** 묶음을 가로지르는 사본 열셋이라 한 열이 못 접는다 — AC-13의 사본 묶음 task가 받는다. */
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
  // controller는 경로를 글자로 든다 — `Href` 유니언을 아는 것은 라우터를 당기는 이 자리뿐이다.
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
    useNotificationsScreen(supabase, bearings, from);

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
