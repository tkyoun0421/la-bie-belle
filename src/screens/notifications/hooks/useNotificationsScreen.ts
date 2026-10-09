import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { WORKER_HOME_PATH } from "@/shared/consts/navigation.const";
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
import { nearBottom } from "@/screens/notifications/utils/nearBottom.utils";

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

export type NotificationsBody = "loading" | "failed" | "empty" | "rows";

export type NotificationsScreenController = {
  state: NotificationsListState;
  body: NotificationsBody;
  groups: NotificationsScreenGroup[];
  goBack: () => void;
  retry: () => void;
  retryNextPage: () => void;
  loadNextWhenNear: (near: boolean) => void;
  loadNextOnScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

function bodyOf(state: NotificationsListState): NotificationsBody {
  if (state === "loading") {
    return "loading";
  }

  if (state === "error") {
    return "failed";
  }

  if (state === "empty") {
    return "empty";
  }

  return "rows";
}

export function useNotificationsScreen(
  from?: string,
): NotificationsScreenController {
  const router = useRouter();
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
                    navigate: (to) => router.push(to as Href),
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

    router.replace((from ?? WORKER_HOME_PATH) as Href);
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

  const loadNextOnScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      loadNextWhenNear(nearBottom(event)),
    [loadNextWhenNear],
  );

  return {
    state,
    body: bodyOf(state),
    groups,
    goBack,
    retry,
    retryNextPage,
    loadNextWhenNear,
    loadNextOnScroll,
  };
}
