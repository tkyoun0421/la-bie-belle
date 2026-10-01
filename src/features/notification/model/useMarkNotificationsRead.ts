import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { markNotificationsRead } from "@/entities/notification/dals/markNotificationsRead";
import {
  NOTIFICATIONS_KEY,
  NOTIFICATIONS_UNREAD_KEY,
} from "@/features/notification/model/queryKeys";

/**
 * 누른 알림에 읽음을 찍는다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「읽음 찍기」다.
 *
 * **두 키를 같이 무효화한다.** 안 읽은 수가 종 아이콘의 점이라 목록만 다시 읽으면 줄의 점은
 * 꺼지는데 종의 점이 남는다.
 *
 * **실패를 안 삼킨다.** ✕·CTA·답으로 찍는 자리는 되돌려야 하고 그 판단은 부르는 쪽 몫이다 —
 * 목록에서 줄을 눌러 이미 다른 화면에 선 사람에게만 실패가 조용하고, 그 삼킴은
 * `screens/notifications/model/pressNotification.ts`가 한다.
 */

export function useMarkNotificationsRead(client: DB) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(client, ids),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY }),
      ]),
  });
}
