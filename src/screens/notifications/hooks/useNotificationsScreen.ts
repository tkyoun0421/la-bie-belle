import { useCallback, useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
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
  router: NotificationsRouter,
  from?: string,
): NotificationsScreenController {
  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset));

  const notifications = useNotificationsQuery(supabase);
  const { mutate: markRead, mutateAsync: markReadAsync } =
    useMarkNotificationsReadMutation(supabase);

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
          time: toNotificationReceivedTime(row.createdAt, now),
          unread: row.readAt === null,
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
