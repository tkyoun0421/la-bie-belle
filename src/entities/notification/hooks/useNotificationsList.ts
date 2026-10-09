import { useCallback, useEffect } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { toNotificationDestination } from "@/entities/notification/model/destination.policy";
import {
  groupNotificationsByDate,
  resolveNotificationsListState,
  unreadAdminNoticeIds,
  type NotificationsListState,
} from "@/entities/notification/model/notificationRows.policy";
import { useNotificationsQuery } from "@/entities/notification/services/useNotificationsQuery";
import { nearBottom } from "@/entities/notification/utils/nearBottom.utils";
import { toNotificationTitle } from "@/entities/notification/utils/title.utils";
import {
  toNotificationDateHeader,
  toNotificationReceivedTime,
} from "@/entities/notification/utils/when.utils";

export type NotificationsBody = "loading" | "failed" | "empty" | "rows";

export type NotificationPick = {
  ids: string[];
  destination: string;
};

export type NotificationsListRow = {
  id: string;
  kind: string;
  title: string;
  time: string;
  unread: boolean;
  press: (() => void) | undefined;
};

export type NotificationsListGroup = {
  date: string;
  header: string;
  rows: NotificationsListRow[];
};

export type NotificationsListInput = {
  now: Date;
  onPressRow: (picked: NotificationPick) => void;
  onUnreadNotices: (ids: string[]) => void;
};

export type NotificationsListController = {
  state: NotificationsListState;
  body: NotificationsBody;
  groups: NotificationsListGroup[];
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

export function useNotificationsList({
  now,
  onPressRow,
  onUnreadNotices,
}: NotificationsListInput): NotificationsListController {
  const notifications = useNotificationsQuery(supabase);

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
      onUnreadNotices(noticeIds.split(","));
    }
  }, [noticeIds, onUnreadNotices]);

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
              : () => onPressRow({ ids: [row.id], destination }),
        },
      ];
    }),
  }));

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
    retry,
    retryNextPage,
    loadNextWhenNear,
    loadNextOnScroll,
  };
}
