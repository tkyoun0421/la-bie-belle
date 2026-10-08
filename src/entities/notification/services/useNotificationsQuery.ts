import { useInfiniteQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getNotifications } from "@/entities/notification/api/getNotifications.api";
import {
  NOTIFICATION_MAX_PAGES,
  NOTIFICATION_PAGE_SIZE,
} from "@/entities/notification/consts/notification.const";

export function useNotificationsQuery(client: DB) {
  return useInfiniteQuery({
    queryKey: queryKeys.notification.all,
    queryFn: ({ pageParam }) => getNotifications(client, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < NOTIFICATION_PAGE_SIZE ? undefined : lastPageParam + 1,
    maxPages: NOTIFICATION_MAX_PAGES,
  });
}
