import { useInfiniteQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getNotifications } from "@/entities/notification/api/getNotifications.api";
import {
  NOTIFICATION_MAX_PAGES,
  NOTIFICATION_PAGE_SIZE,
} from "@/entities/notification/model/notification.type";

/**
 * 받은 알림을 쪽으로 읽는다. 키는 `['notifications']`고 한 쪽이
 * `NOTIFICATION_PAGE_SIZE`건이다(`docs/2-design/system/runtime.md`의 「읽기 범위」).
 *
 * **쪽이 가득 찼으면 다음 쪽이 있다고 본다.** 전체 수를 따로 세지 않는 것은, 세는 질의를 한
 * 번 더 보내도 그 사이 새 알림이 들어오면 답이 어긋나서다 — 덜 찬 쪽이 곧 끝이다.
 *
 * **쥐는 쪽 수에 한도가 있다.** 지난 것을 안 지우는 규칙이라(NTF-026) 한 사람의 목록이
 * 해마다 길어지는데, `maxPages`가 끝없이 내려도 메모리가 안 늘게 막는다. 위로 되감으면 앞
 * 쪽을 다시 읽는다.
 */

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
