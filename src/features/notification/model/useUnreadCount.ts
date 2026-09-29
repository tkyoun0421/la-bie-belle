import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import { countUnreadNotifications } from "@/entities/notification/dals/count-unread-notifications";
import { NOTIFICATIONS_UNREAD_KEY } from "@/features/notification/model/query-keys";

/**
 * 안 읽은 알림의 수다. 종 아이콘의 점이 이것을 보고, 목록과 키를 나눠 갖는 것은 50건 창
 * 밖의 안 읽은 알림도 점에 들어야 해서다(`count-unread-notifications.ts`).
 *
 * 훅은 실수를 그대로 낸다 — 점만 찍는 자리가 쓰는 것은 「0보다 큰가」 하나지만 같은 수를
 * 대시보드의 「안 본 알림 n」이 쓴다.
 */

export function useUnreadCount(client: Db) {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: () => countUnreadNotifications(client),
  });
}
