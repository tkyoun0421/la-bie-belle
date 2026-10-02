import { useCallback, useEffect } from "react";
import type { DB } from "@/shared/api/database";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
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
  type NotificationsListState,
} from "@/screens/notifications/model/notificationRows.policy";
import { pressNotification } from "@/screens/notifications/model/pressNotification.policy";

/**
 * 알림 목록 화면의 controller다. 쪽을 이어 붙이고 상태를 고르고 날짜로 묶고 줄마다
 * 제목·시각·목적지를 지어 손을 다는 일이 전부 여기 있다 — `.tsx`가 그 전부를 품고 있었다.
 *
 * **읽음이 두 길로 찍힌다.** 관리자 공지는 갈 곳이 없어 화면에 들어오는 것으로 찍히고
 * (`useEffect`), 나머지는 누르는 것으로 찍힌다. 어느 줄이 그 자리인지는
 * `notificationRows.policy.ts`가 고른다.
 *
 * **보낼 데를 아는 쪽이 controller다.** `?from=` 접두는 `pressNotification`이 붙이고 그
 * 판정은 `consts`의 접두 목록이 든다 — 이 훅은 router를 인자로 받아 그 손을 꽂는다.
 *
 * **다음 쪽을 부를지는 여기서 정하고, 바닥에 닿았는지는 화면이 잰다.** 재는 값이 전부 기기가
 * 그려 놓은 길이라 측정은 `.tsx`의 `nearBottom`이 하고, 그 답을 받아 부를지 정하는 것은
 * 이 훅이다.
 */

type NotificationsRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (destination: string) => void;
  push: (destination: string) => void;
};

export type NotificationsScreenRow = {
  id: string;
  kind: string;
  title: string;
  time: string;
  unread: boolean;
  press: (() => void) | undefined;
};

export type NotificationsScreenGroup = {
  date: string;
  header: string;
  rows: NotificationsScreenRow[];
};

export type NotificationsScreenController = {
  state: NotificationsListState;
  groups: NotificationsScreenGroup[];
  goBack: () => void;
  retry: () => void;
  retryNextPage: () => void;
  loadNextWhenNear: (near: boolean) => void;
};

export function useNotificationsScreen(
  client: DB,
  router: NotificationsRouter,
  from?: string,
): NotificationsScreenController {
  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset));

  const notifications = useNotificationsQuery(client);
  const { mutate: markRead, mutateAsync: markReadAsync } =
    useMarkNotificationsReadMutation(client);

  const rows = (notifications.data?.pages ?? []).flat();

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

  const groups = groupNotificationsByDate(rows).map((group) => ({
    date: group.date,
    header: toNotificationDateHeader(group.date, now),
    rows: group.rows.flatMap((row) => {
      const spelled = toNotificationTitle(row);

      if (spelled === null) {
        return [];
      }

      const destination = toNotificationDestination(row);

      return [
        {
          id: row.id,
          kind: row.kind,
          title: spelled.title,
          time: toNotificationReceivedTime(row.created_at, now),
          unread: row.read_at === null,
          press:
            destination === null
              ? undefined
              : () =>
                  void pressNotification({
                    ids: [row.id],
                    destination,
                    navigate: (to) => router.push(to),
                    markRead: markReadAsync,
                  }),
        },
      ];
    }),
  }));

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace(from ?? "/");
  }, [router, from]);

  const retry = useCallback(() => {
    void notifications.refetch();
  }, [notifications]);

  const retryNextPage = useCallback(() => {
    void notifications.fetchNextPage();
  }, [notifications]);

  const loadNextWhenNear = useCallback(
    (near: boolean) => {
      if (
        near &&
        notifications.hasNextPage &&
        !notifications.isFetchingNextPage
      ) {
        void notifications.fetchNextPage();
      }
    },
    [notifications],
  );

  return { state, groups, goBack, retry, retryNextPage, loadNextWhenNear };
}
