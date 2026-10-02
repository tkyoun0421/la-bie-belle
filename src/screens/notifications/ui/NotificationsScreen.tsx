import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { NotificationRow } from "@/shared/ui/NotificationRow";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import type { NotificationRow as Notification } from "@/entities/notification/api/notification.dto";
import { toNotificationDestination } from "@/entities/notification/model/destination.policy";
import { useNotificationsQuery } from "@/entities/notification/services/useNotificationsQuery";
import { toNotificationTitle } from "@/entities/notification/utils/title.utils";
import {
  toNotificationDateHeader,
  toNotificationReceivedTime,
} from "@/entities/notification/utils/when.utils";
import { useMarkNotificationsReadMutation } from "@/features/notificationRead/services/useMarkNotificationsReadMutation";
import {
  groupNotificationsByDate,
  resolveNotificationsListState,
  unreadAdminNoticeIds,
} from "@/screens/notifications/model/notificationRows.policy";
import { pressNotification } from "@/screens/notifications/model/pressNotification.policy";

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
 * **관리자 공지 줄만 안 눌린다.** 갈 곳이 없어서고, 그래서 그 줄의 읽음은 누르는 것이 아니라
 * 화면에 들어오는 것으로 찍힌다. 어느 줄이 그 자리인지는
 * [notification-rows](../model/notificationRows.ts)가 고른다 — 여기서 고르면 계산이 UI로
 * 샌다(ADR-001).
 *
 * **읽음이 실패해도 조용하다.** 이동이 먼저라 그 사람은 이미 다른 화면에 있다
 * ([press-notification](../model/pressNotification.ts)).
 *
 * **문장이 없는 줄은 안 그린다.** 2차 다섯은 제목이 아직 널이라(plan AC-01) 그릴 글자가
 * 없다 — 빈 줄을 세우면 눌러도 아무 일이 없는 자리가 목록에 남는다.
 */

const SKELETON_ROWS = [0, 1, 2, 3, 4];

const READ_FAILED = "알림을 불러오지 못했어요";

/** 바닥에서 이만큼 남았을 때 다음 쪽을 부른다. 끝에 닿고 나서 부르면 한 박자 빈다. */
const NEXT_PAGE_SLACK = 240;

export type NotificationsScreenProps = {
  from?: string;
};

function FailBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="mt-4 items-center gap-3">
      <Text size="sm" tone="muted">
        {READ_FAILED}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        다시 시도
      </Button>
    </View>
  );
}

function nearBottom(event: NativeSyntheticEvent<NativeScrollEvent>): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

  return (
    contentOffset.y + layoutMeasurement.height >=
    contentSize.height - NEXT_PAGE_SLACK
  );
}

export function NotificationsScreen({ from }: NotificationsScreenProps) {
  const router = useRouter();
  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset));

  const notifications = useNotificationsQuery(supabase);
  const { mutate: markRead, mutateAsync: markReadAsync } =
    useMarkNotificationsReadMutation(supabase);

  const rows: Notification[] = (notifications.data?.pages ?? []).flat();
  const state = resolveNotificationsListState({
    rows,
    isLoading: notifications.isLoading,
    isError: notifications.isError,
    isFetchingNextPage: notifications.isFetchingNextPage,
    hasNextPage: notifications.hasNextPage,
    isFetchNextPageError: notifications.isFetchNextPageError,
  });

  const noticeIds = unreadAdminNoticeIds(rows).join(",");

  useEffect(() => {
    if (noticeIds !== "") {
      markRead(noticeIds.split(","));
    }
  }, [noticeIds, markRead]);

  const groups = groupNotificationsByDate(rows);

  return (
    <Screen floor="plain">
      <AppBar
        title="알림"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace((from ?? "/") as Href)
        }
      />

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
          <FailBlock onRetry={() => void notifications.refetch()} />
        </View>
      ) : state === "empty" ? (
        <View className="mt-4 px-6 py-4">
          <Text weight="medium">아직 받은 알림이 없어요</Text>
          <Text size="sm" tone="subtle" className="mt-0.5">
            근무표가 확정되면 여기 쌓여요
          </Text>
        </View>
      ) : (
        <ScrollView
          scrollEventThrottle={200}
          onScroll={(event) => {
            if (
              nearBottom(event) &&
              notifications.hasNextPage &&
              !notifications.isFetchingNextPage
            ) {
              void notifications.fetchNextPage();
            }
          }}
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
                  {toNotificationDateHeader(group.date, now)}
                </Text>

                {group.rows.map((row) => {
                  const spelled = toNotificationTitle(row);

                  if (spelled === null) {
                    return null;
                  }

                  const destination = toNotificationDestination(row);

                  return (
                    <NotificationRow
                      key={row.id}
                      testID={`notification-row-${row.kind}`}
                      title={spelled.title}
                      time={toNotificationReceivedTime(row.created_at, now)}
                      unread={row.read_at === null}
                      onPress={
                        destination === null
                          ? undefined
                          : () =>
                              void pressNotification({
                                ids: [row.id],
                                destination,
                                navigate: (to) => router.push(to as Href),
                                markRead: markReadAsync,
                              })
                      }
                    />
                  );
                })}
              </View>
            ))}

            {state === "loadingMore" ? (
              <View className="h-14 items-center justify-center">
                <ActivityIndicator />
              </View>
            ) : null}

            {state === "errorMore" ? (
              <FailBlock onRetry={() => void notifications.fetchNextPage()} />
            ) : null}

            {state === "end" ? (
              <Text size="xs" tone="subtle" className="py-8 text-center">
                여기까지예요
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
